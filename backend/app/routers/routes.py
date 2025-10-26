"""Роуты для работы с маршрутами"""

import re
from fastapi import APIRouter, HTTPException

from app.schemas.route import RouteAnalysisRequest, RouteAnalysisResponse
from app.schemas.response import ResponseModel
from app.services.ml_route_optimizer import MLRouteOptimizer

router = APIRouter(prefix="/routes", tags=["routes"])

# Инициализируем ML-оптимизатор
ml_optimizer = MLRouteOptimizer()


@router.post("/analyze", response_model=ResponseModel[RouteAnalysisResponse])
async def analyze_route(request: RouteAnalysisRequest):
    """
    Запустить анализ и оптимизацию маршрута с использованием ML-модели

    Принимает список клиентов с координатами и возвращает оптимизированный маршрут
    с учетом:
    - Трафика по времени суток и дню недели
    - Рабочего времени клиентов
    - Обеденных перерывов
    - Уровня клиента (VIP = 25 мин, Standard = 15 мин обслуживания)
    - ML-модели для выбора оптимального следующего клиента
    """
    try:
        # Валидация: минимум 1 клиент
        if len(request.clients) == 0:
            raise HTTPException(
                status_code=400,
                detail="Необходимо указать хотя бы одного клиента"
            )

        # Валидация: максимум 50 клиентов (для производительности)
        if len(request.clients) > 50:
            raise HTTPException(
                status_code=400,
                detail="Максимальное количество клиентов: 50"
            )

        # Валидация формата времени
        if request.start_time and not re.match(r'^([01]\d|2[0-3]):([0-5]\d)$', request.start_time):
            raise HTTPException(
                status_code=400,
                detail="Неверный формат времени start_time. Используйте HH:MM"
            )

        # Валидация дня недели
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        if request.start_day and request.start_day.lower() not in valid_days:
            raise HTTPException(
                status_code=400,
                detail=f"Неверный день недели. Допустимые: {', '.join(valid_days)}"
            )

        # Валидация координат
        for idx, client in enumerate(request.clients):
            if not (-90 <= client.latitude <= 90):
                raise HTTPException(
                    status_code=400,
                    detail=f"Неверная широта у клиента {idx + 1}: {client.latitude}"
                )
            if not (-180 <= client.longitude <= 180):
                raise HTTPException(
                    status_code=400,
                    detail=f"Неверная долгота у клиента {idx + 1}: {client.longitude}"
                )

            # Валидация уровня клиента
            if client.level.lower() not in ["vip", "standard"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Неверный уровень клиента {idx + 1}: {client.level}. Допустимые: vip, standard"
                )

        # Конвертируем Pydantic модели в словари для оптимизатора
        clients_data = [
            {
                "address": client.address,
                "latitude": client.latitude,
                "longitude": client.longitude,
                "level": client.level,
                "work_start": client.work_start,
                "work_end": client.work_end,
                "lunch_start": client.lunch_start,
                "lunch_end": client.lunch_end,
                "id": client.id or f"client_{idx}"
            }
            for idx, client in enumerate(request.clients)
        ]

        # Подготавливаем стартовую точку если указана
        start_point_data = None
        if request.start_point:
            start_point_data = {
                "address": request.start_point.address,
                "latitude": request.start_point.latitude,
                "longitude": request.start_point.longitude
            }

        # Оптимизируем маршрут с использованием ML-модели
        print(f"\n🚀 Запуск оптимизации маршрута для {len(clients_data)} клиентов...")
        if start_point_data:
            print(f"📍 Стартовая точка: {start_point_data['address']}")

        optimized_result = await ml_optimizer.optimize_route(
            clients=clients_data,
            start_point=start_point_data,
            start_time=request.start_time,
            start_day=request.start_day
        )

        return ResponseModel(
            success=True,
            message=f"Маршрут успешно оптимизирован ({len(request.clients)} клиентов)",
            data=optimized_result
        )

    except HTTPException:
        raise
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=500,
            detail=f"ML-модель не найдена. Убедитесь, что файл модели находится в папке models/: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Ошибка при оптимизации маршрута: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при оптимизации маршрута: {str(e)}"
        )


@router.get("/stats", response_model=ResponseModel)
async def get_route_stats():
    """Получить статистику по маршрутам (заглушка)"""
    # Заглушка для будущей функциональности
    return ResponseModel(
        success=True,
        message="Статистика по маршрутам",
        data={
            "total_routes_analyzed": 0,
            "average_distance": 0,
            "average_duration": 0
        }
    )
