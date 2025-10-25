"""Схемы для работы с клиентами"""

from typing import Optional
from pydantic import BaseModel, Field


class ClientBase(BaseModel):
    """Базовая схема клиента"""
    address: str = Field(..., description="Адрес клиента")


class ClientCreate(ClientBase):
    """Схема для создания клиента"""
    latitude: Optional[float] = Field(None, description="Широта")
    longitude: Optional[float] = Field(None, description="Долгота")


class Client(ClientBase):
    """Полная схема клиента"""
    id: str = Field(..., description="Уникальный идентификатор клиента")
    latitude: Optional[float] = Field(None, description="Широта")
    longitude: Optional[float] = Field(None, description="Долгота")

    class Config:
        from_attributes = True


class ClientBulkCreate(BaseModel):
    """Схема для массового добавления клиентов"""
    clients: list[ClientCreate] = Field(..., description="Список клиентов для добавления")
