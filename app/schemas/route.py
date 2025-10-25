"""Схемы для работы с маршрутами"""

from typing import Optional
from pydantic import BaseModel, Field


class StartPoint(BaseModel):
    """Стартовая точка маршрута (офис, склад и т.д.)"""
    address: str = Field(..., description="Адрес стартовой точки")
    latitude: float = Field(..., description="Широта")
    longitude: float = Field(..., description="Долгота")


class ClientData(BaseModel):
    """Данные клиента для построения маршрута"""
    address: str = Field(..., description="Адрес клиента")
    latitude: float = Field(..., description="Широта")
    longitude: float = Field(..., description="Долгота")

    # Дополнительные поля для ML-оптимизации
    level: str = Field(default="standard", description="Уровень клиента (vip или standard)")
    work_start: str = Field(default="09:00", description="Начало рабочего дня (формат HH:MM)")
    work_end: str = Field(default="18:00", description="Конец рабочего дня (формат HH:MM)")
    lunch_start: str = Field(default="13:00", description="Начало обеденного перерыва (формат HH:MM)")
    lunch_end: str = Field(default="14:00", description="Конец обеденного перерыва (формат HH:MM)")
    id: Optional[str] = Field(None, description="ID клиента (опционально)")


class RoutePoint(BaseModel):
    """Точка маршрута"""
    order: int = Field(..., description="Порядковый номер посещения")
    address: str = Field(..., description="Адрес")
    latitude: float = Field(..., description="Широта")
    longitude: float = Field(..., description="Долгота")

    # Детальная информация о времени
    estimated_arrival: Optional[str] = Field(None, description="Расчетное время прибытия (HH:MM)")
    departure_time: Optional[str] = Field(None, description="Время отправления (HH:MM)")
    travel_time: float = Field(default=0.0, description="Время в пути до этой точки (минуты)")
    service_time: int = Field(default=15, description="Время обслуживания (минуты)")


class RouteAnalysisRequest(BaseModel):
    """Запрос на анализ маршрута"""
    clients: list[ClientData] = Field(..., description="Список клиентов с координатами")
    start_point: Optional[StartPoint] = Field(None, description="Стартовая точка (офис, склад). Если не указана - используется первый клиент")
    start_time: Optional[str] = Field(default="09:00", description="Время начала маршрута (формат HH:MM)")
    start_day: Optional[str] = Field(None, description="День недели (Monday, Tuesday, и т.д.)")


class RouteAnalysisResponse(BaseModel):
    """Результат анализа маршрута"""
    total_distance: float = Field(..., description="Общее расстояние маршрута в км")
    total_duration: float = Field(..., description="Общее время маршрута в минутах")
    optimized_route: list[RoutePoint] = Field(..., description="Оптимизированный маршрут")
