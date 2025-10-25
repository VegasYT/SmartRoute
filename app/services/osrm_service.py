"""Сервис для работы с OSRM API"""

import time
import httpx
from typing import Tuple, Dict
import os


class OSRMService:
    """Сервис для получения времени в пути через OSRM API"""

    def __init__(self, base_url: str = None):
        """
        Инициализация OSRM сервиса.

        Args:
            base_url: Базовый URL OSRM сервера (по умолчанию из env или публичный)
        """
        self.base_url = base_url or os.getenv(
            "OSRM_BASE_URL",
            "http://router.project-osrm.org"
        )
        self._cache: Dict[Tuple[float, float, float, float], Dict[str, float]] = {}

    async def get_duration(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
        retries: int = 3
    ) -> float:
        """
        Получить время в пути между двумя точками через OSRM.

        Args:
            lat1: Широта первой точки
            lon1: Долгота первой точки
            lat2: Широта второй точки
            lon2: Долгота второй точки
            retries: Количество попыток при ошибке

        Returns:
            Время в пути в минутах
        """
        route_data = await self._get_route_data(lat1, lon1, lat2, lon2, retries)
        return route_data["duration"]

    async def get_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
        retries: int = 3
    ) -> float:
        """
        Получить расстояние между двумя точками через OSRM.

        Args:
            lat1: Широта первой точки
            lon1: Долгота первой точки
            lat2: Широта второй точки
            lon2: Долгота второй точки
            retries: Количество попыток при ошибке

        Returns:
            Расстояние в километрах
        """
        route_data = await self._get_route_data(lat1, lon1, lat2, lon2, retries)
        return route_data["distance"]

    async def _get_route_data(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float,
        retries: int = 3
    ) -> Dict[str, float]:
        """
        Получить данные о маршруте (время и расстояние) через OSRM.

        Args:
            lat1: Широта первой точки
            lon1: Долгота первой точки
            lat2: Широта второй точки
            lon2: Долгота второй точки
            retries: Количество попыток при ошибке

        Returns:
            Словарь с ключами 'duration' (минуты) и 'distance' (км)
        """
        # Округляем координаты для кэширования
        key = (
            round(lat1, 5),
            round(lon1, 5),
            round(lat2, 5),
            round(lon2, 5)
        )

        # Проверяем кэш (теперь кэш хранит словарь)
        if key in self._cache:
            return self._cache[key]

        # Формируем URL для OSRM
        url = f"{self.base_url}/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"

        # Пытаемся получить данные
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(url)

                    if response.status_code == 200:
                        data = response.json()

                        if "routes" in data and len(data["routes"]) > 0:
                            route = data["routes"][0]

                            # OSRM возвращает время в секундах, расстояние в метрах
                            duration_minutes = route["duration"] / 60.0
                            distance_km = route["distance"] / 1000.0

                            result = {
                                "duration": duration_minutes,
                                "distance": distance_km
                            }

                            # Кэшируем результат
                            self._cache[key] = result

                            # Задержка для предотвращения rate limiting на публичном OSRM
                            await self._sleep(0.2)

                            return result

            except Exception as e:
                print(f"⚠ Ошибка OSRM (попытка {attempt + 1}/{retries}): {e}")
                if attempt < retries - 1:
                    await self._sleep(1)

        # Если все попытки неудачны - используем fallback
        print(f"⚠ Не удалось получить данные OSRM между ({lat1},{lon1}) и ({lat2},{lon2}). Использую fallback.")
        fallback_result = {
            "duration": 10.0,  # 10 минут
            "distance": 5.0    # 5 км
        }
        self._cache[key] = fallback_result
        return fallback_result

    async def build_time_matrix(self, coords: list) -> list:
        """
        Построить матрицу времени между всеми точками.

        Args:
            coords: Список координат [(lat, lon), (lat, lon), ...]

        Returns:
            Матрица времени n x n, где matrix[i][j] = время от i до j
        """
        n = len(coords)
        matrix = [[0.0 for _ in range(n)] for _ in range(n)]

        for i in range(n):
            for j in range(n):
                if i != j:
                    duration = await self.get_duration(
                        coords[i][0],
                        coords[i][1],
                        coords[j][0],
                        coords[j][1]
                    )
                    matrix[i][j] = duration

        return matrix

    async def build_distance_matrix(self, coords: list) -> list:
        """
        Построить матрицу расстояний между всеми точками.

        Args:
            coords: Список координат [(lat, lon), (lat, lon), ...]

        Returns:
            Матрица расстояний n x n, где matrix[i][j] = расстояние от i до j в км
        """
        n = len(coords)
        matrix = [[0.0 for _ in range(n)] for _ in range(n)]

        for i in range(n):
            for j in range(n):
                if i != j:
                    distance = await self.get_distance(
                        coords[i][0],
                        coords[i][1],
                        coords[j][0],
                        coords[j][1]
                    )
                    matrix[i][j] = distance

        return matrix

    def clear_cache(self):
        """Очистить кэш OSRM запросов"""
        self._cache.clear()

    def get_cache_size(self) -> int:
        """Получить размер кэша"""
        return len(self._cache)

    async def _sleep(self, seconds: float):
        """Асинхронная задержка"""
        import asyncio
        await asyncio.sleep(seconds)
