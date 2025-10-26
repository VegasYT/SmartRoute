# SmartRoute - Деплой

## Структура проекта
```
.
├── backend/          # Backend приложение (FastAPI)
│   ├── app/         # Код приложения
│   ├── config/      # Конфигурационные файлы
│   ├── models/      # ML модели
│   ├── main.py      # Точка входа
│   └── Dockerfile   # Dockerfile для backend
├── frontend/         # Frontend приложение (React + Vite)
│   ├── src/         # Исходный код
│   └── dist/        # Собранные файлы (создается при сборке)
├── docker-compose.yml
├── nginx.conf
└── deploy.sh        # Скрипт автоматического развертывания
```

## 1. Подготовка сервера
Обновите систему
```bash
sudo apt update && sudo apt upgrade -y
```

Установите Docker и Docker Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

Установите Node.js и pnpm (для сборки frontend)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm i -g pnpm
```

Для production также установите Nginx и Certbot для SSL
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

## 2. Развертывание
Создать в \frontend\\.env используя .env.example
- **VITE_YANDEX_MAPS_API_KEY** - апи ключ "JavaScript API и HTTP Геокодер". Получить можно тут https://developer.tech.yandex.ru/services
- **VITE_REST_API_SSL** - http или https
- **VITE_REST_API_DOMAIN** - домен (например demo-project.space)


Сделайте файл deploy.sh исполняемым
```bash
chmod +x deploy.sh
```

### Локальный режим (без SSL)
Для тестирования на локальной машине:
```bash
./deploy.sh local
```

### Production режим (с доменом и SSL)
Для развертывания на сервере с доменом:
```bash
./deploy.sh production
```
Скрипт запросит:
- Доменное имя
- Email для Let's Encrypt

## Что делает скрипт

1. **Frontend**:
   - Проверяет и устанавливает pnpm (если не установлен)
   - Устанавливает зависимости (pnpm i)
   - Собирает production build (pnpm run build)

2. **Backend**:
   - Собирает Docker образ

3. **Nginx**:
   - Настраивает reverse proxy
   - В production режиме получает SSL сертификат

## После развертывания

- **Local**: API доступно по `http://localhost`
- **Production**: API доступно по `https://ваш-домен.com/api`
- **Frontend**: взаимодейсвтие через `ваш-домен.com`
- Документация API: `/docs` или `/redoc`