"""Сервис для работы с данными о трафике"""

import json
import os
from typing import Dict, Any


class TrafficService:
    """Сервис для получения коэффициентов трафика по времени и дню недели"""

    def __init__(self, traffic_config_path: str = None):
        """
        Инициализация сервиса трафика.

        Args:
            traffic_config_path: Путь к файлу с данными трафика
        """
        self.traffic_config_path = traffic_config_path or os.getenv(
            "TRAFFIC_CONFIG_PATH",
            "config/traffic.json"
        )
        self._traffic_data: Dict[str, Any] = {}
        self._load_traffic_data()

    def _load_traffic_data(self):
        """Загрузить данные трафика из JSON файла"""
        try:
            with open(self.traffic_config_path, "r", encoding="utf-8") as f:
                self._traffic_data = json.load(f)
            print(f"✅ Данные трафика загружены из {self.traffic_config_path}")
        except FileNotFoundError:
            print(f"⚠ Файл {self.traffic_config_path} не найден. Используются дефолтные коэффициенты.")
            self._traffic_data = {}
        except json.JSONDecodeError as e:
            print(f"⚠ Ошибка парсинга {self.traffic_config_path}: {e}")
            self._traffic_data = {}

    def get_traffic_multiplier(self, hour: int, day_of_week: str) -> float:
        """
        Получить коэффициент трафика для указанного времени.

        Args:
            hour: Час дня (0-23)
            day_of_week: День недели (monday, tuesday, и т.д.)

        Returns:
            Коэффициент трафика (по умолчанию 1.0)
        """
        # Приводим день недели к формату с заглавной буквы (Monday, Tuesday, etc.)
        day_capitalized = day_of_week.capitalize()

        # Получаем данные для дня
        day_data = self._traffic_data.get(day_capitalized, {})

        # Если нет данных для дня - возвращаем 1.0
        if not day_data:
            return 1.0

        # Получаем данные часов
        hours_data = day_data.get("hours", {})

        # Получаем данные для конкретного часа
        hour_data = hours_data.get(str(hour), {})

        # Возвращаем коэффициент (average)
        return float(hour_data.get("average", 1.0))

    def reload_traffic_data(self):
        """Перезагрузить данные трафика из файла"""
        self._load_traffic_data()

    def get_all_traffic_data(self) -> Dict[str, Any]:
        """Получить все данные трафика"""
        return self._traffic_data

    def get_day_data(self, day_of_week: str) -> Dict[str, Any]:
        """
        Получить данные трафика для конкретного дня.

        Args:
            day_of_week: День недели

        Returns:
            Данные дня или пустой словарь
        """
        day_capitalized = day_of_week.capitalize()
        return self._traffic_data.get(day_capitalized, {})
