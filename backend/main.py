"""Главный файл приложения SmartRoute Backend"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import routes

# Загрузка переменных окружения из .env файла
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler для инициализации при старте и очистки при завершении.

    При старте:
    - Загружаем ML-модель
    - Проверяем наличие конфигураций
    """
    print("\n" + "=" * 60)
    print("Запуск SmartRoute API...")
    print("=" * 60)

    # Проверяем наличие файла модели
    model_path = os.getenv("MODEL_PATH", "models/routenet_traffic.pt")
    if os.path.exists(model_path):
        print(f"Файл модели найден: {model_path}")

        # Загружаем ML-модель
        try:
            from app.routers.routes import ml_optimizer
            await ml_optimizer.load_model()
            print("ML-модель успешно загружена")
        except Exception as e:
            print(f"Ошибка загрузки ML-модели: {e}")
            print("API будет работать, но оптимизация маршрутов недоступна")
    else:
        print(f"Файл модели не найден: {model_path}")
        print("Скопируйте файл routenet_traffic.pt в папку models/")
        print("API будет работать, но оптимизация маршрутов будет недоступна")

    # Проверяем конфигурацию трафика
    traffic_path = os.getenv("TRAFFIC_CONFIG_PATH", "config/traffic.json")
    if os.path.exists(traffic_path):
        print(f"Конфигурация трафика найдена: {traffic_path}")
    else:
        print(f"Конфигурация трафика не найдена: {traffic_path}")

    print("=" * 60)
    print("Документация доступна: /docs")
    print("=" * 60 + "\n")

    yield

    # Очистка при завершении
    print("\nЗавершение работы SmartRoute API...")


# Создание приложения FastAPI
app = FastAPI(
    title="SmartRoute API",
    description="API для оптимизации маршрутов посещения клиентов с использованием ML",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Настройка CORS для возможности запросов с фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(routes.router)


@app.get("/", tags=["root"])
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "SmartRoute API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Проверка работоспособности API и статуса ML-модели"""
    import os
    from app.routers.routes import ml_optimizer

    model_path = os.getenv("MODEL_PATH", "models/routenet_traffic.pt")
    traffic_path = os.getenv("TRAFFIC_CONFIG_PATH", "config/traffic.json")

    return {
        "status": "ok",
        "message": "API работает нормально",
        "ml_model": {
            "loaded": ml_optimizer._model_loaded,
            "path": model_path,
            "exists": os.path.exists(model_path)
        },
        "traffic_config": {
            "path": traffic_path,
            "exists": os.path.exists(traffic_path)
        },
        "osrm_cache_size": ml_optimizer.osrm_service.get_cache_size()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=bool(os.getenv("RELOAD", True)),
    )
