"""Общие схемы ответов"""

from typing import Generic, TypeVar, Optional
from pydantic import BaseModel, Field

T = TypeVar('T')


class ResponseModel(BaseModel, Generic[T]):
    """Универсальная модель ответа"""
    success: bool = Field(..., description="Статус выполнения операции")
    message: str = Field(..., description="Сообщение о результате")
    data: Optional[T] = Field(None, description="Данные ответа")


class ErrorResponse(BaseModel):
    """Модель ответа с ошибкой"""
    success: bool = Field(False, description="Статус выполнения операции")
    message: str = Field(..., description="Описание ошибки")
    error_code: Optional[str] = Field(None, description="Код ошибки")
