"""Основной сервис ML-оптимизации маршрутов"""

import os
import torch
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set
from torch_geometric.data import Data

from app.ml.route_model import RouteNet
from app.services.osrm_service import OSRMService
from app.services.traffic_service import TrafficService
from app.schemas.route import RouteAnalysisResponse, RoutePoint


class MLRouteOptimizer:
    """ML-оптимизатор маршрутов на базе нейронной сети"""

    def __init__(
        self,
        model_path: str = None,
        traffic_config_path: str = None,
        osrm_base_url: str = None
    ):
        """
        Инициализация ML-оптимизатора.

        Args:
            model_path: Путь к файлу модели
            traffic_config_path: Путь к конфигу трафика
            osrm_base_url: URL OSRM сервера
        """
        self.model_path = model_path or os.getenv("MODEL_PATH", "models/routenet_traffic.pt")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Инициализируем сервисы
        self.osrm_service = OSRMService(base_url=osrm_base_url)
        self.traffic_service = TrafficService(traffic_config_path=traffic_config_path)

        # Модель будет загружена при первом использовании
        self.model: Optional[RouteNet] = None
        self._model_loaded = False

    async def load_model(self):
        """Загрузить ML-модель"""
        if self._model_loaded:
            return

        try:
            # Создаём модель (in_dim=3: lat, lon, feature)
            self.model = RouteNet(in_dim=3).to(self.device)

            # Загружаем веса
            self.model.load_state_dict(
                torch.load(self.model_path, map_location=self.device)
            )
            self.model.eval()

            self._model_loaded = True
            print(f"✅ ML-модель загружена из {self.model_path}")

        except FileNotFoundError:
            print(f"⚠ Модель не найдена: {self.model_path}")
            raise
        except Exception as e:
            print(f"⚠ Ошибка загрузки модели: {e}")
            raise

    def get_visit_duration(self, level: str) -> int:
        """
        Получить время обслуживания клиента в минутах.

        Args:
            level: Уровень клиента (VIP или Standard)

        Returns:
            Время обслуживания в минутах
        """
        if level.lower() == "vip":
            return 25
        else:
            return 15

    def parse_time_safe(self, val: str, default: str) -> datetime.time:
        """
        Безопасный парсинг времени.

        Args:
            val: Значение времени (HH:MM)
            default: Значение по умолчанию

        Returns:
            Объект time
        """
        try:
            return datetime.strptime(str(val), "%H:%M").time()
        except Exception:
            return datetime.strptime(default, "%H:%M").time()

    def can_visit(self, at_time: datetime, client: Dict) -> bool:
        """
        Проверить, можно ли посетить клиента в указанное время.

        Args:
            at_time: Время посещения
            client: Данные клиента

        Returns:
            True если клиент доступен
        """
        work_start = self.parse_time_safe(
            client.get("work_start", "09:00"),
            "09:00"
        )
        work_end = self.parse_time_safe(
            client.get("work_end", "18:00"),
            "18:00"
        )
        lunch_start = self.parse_time_safe(
            client.get("lunch_start", "13:00"),
            "13:00"
        )
        lunch_end = self.parse_time_safe(
            client.get("lunch_end", "14:00"),
            "14:00"
        )

        t = at_time.time()

        # Проверяем рабочее время и обеденный перерыв
        return work_start <= t < work_end and not (lunch_start <= t < lunch_end)

    async def optimize_route(
        self,
        clients: List[Dict],
        start_point: Optional[Dict] = None,
        start_time: Optional[str] = "09:00",
        start_day: Optional[str] = None
    ) -> RouteAnalysisResponse:
        """
        Оптимизировать маршрут посещения клиентов с использованием ML-модели.

        Args:
            clients: Список клиентов с данными
            start_point: Стартовая точка dict с 'address', 'latitude', 'longitude'. Если None - используется первый клиент
            start_time: Время начала маршрута (формат HH:MM)
            start_day: День недели (Monday, Tuesday, etc.)

        Returns:
            Оптимизированный маршрут
        """
        # Загружаем модель если ещё не загружена
        if not self._model_loaded:
            await self.load_model()

        # Если указана стартовая точка, добавляем её в начало списка клиентов
        if start_point:
            start_client = {
                "address": start_point["address"],
                "latitude": start_point["latitude"],
                "longitude": start_point["longitude"],
                "level": "start",
                "work_start": "00:00",
                "work_end": "23:59",
                "lunch_start": "23:59",
                "lunch_end": "23:59",
                "id": "START"
            }
            clients = [start_client] + clients

        # Извлекаем координаты и данные клиентов
        coords = [(c["latitude"], c["longitude"]) for c in clients]
        n = len(clients)

        # Строим матрицы времени и расстояний через OSRM
        print("⏳ Расчёт матриц времени и расстояний через OSRM...")
        base_time_matrix = await self.osrm_service.build_time_matrix(coords)
        distance_matrix = await self.osrm_service.build_distance_matrix(coords)
        print("✅ Матрицы готовы.")

        # Определяем время старта
        current_time = datetime.now().replace(
            hour=int(start_time.split(":")[0]),
            minute=int(start_time.split(":")[1]),
            second=0,
            microsecond=0
        )

        # Определяем день недели
        if start_day:
            day_of_week = start_day.lower()
        else:
            day_of_week = current_time.strftime("%A").lower()

        print(f"\n📅 День недели: {day_of_week.capitalize()}, старт: {current_time.strftime('%H:%M')}")

        # Инициализация маршрута
        route: List[int] = [0]  # Начинаем с первого клиента
        visited: Set[int] = {0}
        total_time = 0.0
        total_distance = 0.0

        # Для хранения данных о каждом переходе
        route_data = []  # [(client_idx, arrival_time, departure_time, travel_time, distance)]
        route_data.append((0, current_time, current_time, 0.0, 0.0))  # Стартовая точка

        # Основной цикл построения маршрута
        while len(visited) < n:
            current_node = route[-1]

            best_j: Optional[int] = None
            best_score = -float("inf")
            best_arrival_time: Optional[datetime] = None
            best_departure_time: Optional[datetime] = None
            best_travel_time: Optional[float] = None

            any_available_later = False

            # Перебираем всех непосещённых клиентов
            for j in range(n):
                if j in visited or j == current_node:
                    continue

                # Получаем базовое время в пути
                base_time = base_time_matrix[current_node][j]

                # Применяем коэффициент трафика
                traffic_mult = self.traffic_service.get_traffic_multiplier(
                    current_time.hour,
                    day_of_week
                )
                # Умножаем коэффициент пробки на 0.65
                adjusted_time = base_time * (traffic_mult * 0.65)

                # Вычисляем время прибытия
                tentative_arrival = current_time + timedelta(minutes=adjusted_time)

                # Проверяем доступность клиента
                if not self.can_visit(tentative_arrival, clients[j]):
                    any_available_later = True
                    continue

                # Получаем attention score от модели
                attn_score = await self._get_attention_score(coords[j])

                # Вычисляем итоговый score
                score = attn_score / (adjusted_time + 1e-5)

                if score > best_score:
                    best_score = score
                    best_j = j
                    best_arrival_time = tentative_arrival
                    best_travel_time = adjusted_time

                    # Время обслуживания зависит от уровня клиента
                    service_duration = self.get_visit_duration(
                        clients[j].get("level", "standard")
                    )
                    best_departure_time = tentative_arrival + timedelta(minutes=service_duration)

            # Если никого не нашли
            if best_j is None:
                if any_available_later:
                    # Ждём 15 минут
                    print(f"⏸ Все клиенты заняты. Ждём 15 минут... ({current_time.strftime('%H:%M')})")
                    current_time += timedelta(minutes=15)
                    continue
                else:
                    # Больше нет доступных клиентов
                    break

            # Добавляем клиента в маршрут
            route.append(best_j)
            visited.add(best_j)

            service_time = self.get_visit_duration(clients[best_j].get("level", "standard"))

            # Получаем расстояние между текущей точкой и следующей
            distance = distance_matrix[current_node][best_j]

            total_time += best_travel_time + service_time
            total_distance += distance
            current_time = best_departure_time

            # Сохраняем данные о переходе
            route_data.append((
                best_j,
                best_arrival_time,
                best_departure_time,
                best_travel_time,
                distance
            ))

            # Получаем ID клиентов для лога
            current_id = clients[current_node].get("id", f"client_{current_node}")
            next_id = clients[best_j].get("id", f"client_{best_j}")

            print(
                f"➡ ID {current_id} → ID {next_id} | "
                f"Путь: {best_travel_time:.1f} мин | "
                f"Прибытие: {best_arrival_time.strftime('%H:%M')} | "
                f"Обслуживание: {service_time} мин | "
                f"Отправление: {best_departure_time.strftime('%H:%M')}"
            )

        # Формируем результат
        route_points = []
        for idx, (client_idx, arrival_time, departure_time, travel_time, distance) in enumerate(route_data):
            client = clients[client_idx]
            route_points.append(RoutePoint(
                order=idx + 1,
                address=client["address"],
                latitude=client["latitude"],
                longitude=client["longitude"],
                estimated_arrival=arrival_time.strftime("%H:%M") if arrival_time else None,
                departure_time=departure_time.strftime("%H:%M") if departure_time else None,
                travel_time=round(travel_time, 2),
                service_time=self.get_visit_duration(client.get("level", "standard"))
            ))

        print("\n✅ Оптимальный маршрут построен!")
        print(f"⏱ Общее время: {total_time:.1f} минут")
        print(f"📏 Общее расстояние: {total_distance:.2f} км")

        return RouteAnalysisResponse(
            total_distance=round(total_distance, 2),
            total_duration=round(total_time, 2),
            optimized_route=route_points,
        )

    async def _get_attention_score(self, coords: tuple) -> float:
        """
        Получить attention score от модели для конкретных координат.

        Args:
            coords: Кортеж (latitude, longitude)

        Returns:
            Attention score
        """
        # Создаём признаки узла
        node_feat = torch.tensor(
            [[coords[0], coords[1], 0.0]],
            dtype=torch.float32
        ).to(self.device)

        # Создаём фиктивный граф (для одного узла)
        edge_index = torch.tensor(
            [[0, 0], [0, 0]],
            dtype=torch.long
        ).to(self.device)

        edge_attr = torch.zeros((1, 1), dtype=torch.float32).to(self.device)

        # Создаём Data объект
        data = Data(x=node_feat, edge_index=edge_index, edge_attr=edge_attr)

        # Получаем attention score от модели
        with torch.no_grad():
            attn_score = self.model(data).item()

        return attn_score
