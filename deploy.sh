#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Скрипт деплоя проекта ===${NC}\n"

# Проверка аргументов
if [ "$1" == "local" ]; then
    MODE="local"
    echo -e "${YELLOW}Режим: Локальный запуск (без SSL)${NC}\n"
elif [ "$1" == "production" ]; then
    MODE="production"
    
    # Запрос домена
    read -p "Введите ваш домен (например, demo-project.space): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}Ошибка: домен не указан${NC}"
        exit 1
    fi
    
    read -p "Введите ваш email для Let's Encrypt: " EMAIL
    if [ -z "$EMAIL" ]; then
        echo -e "${RED}Ошибка: email не указан${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Режим: Продакшн с доменом $DOMAIN${NC}\n"
else
    echo "Использование:"
    echo "  ./deploy.sh local        - Локальный запуск на localhost"
    echo "  ./deploy.sh production   - Продакшн деплой с доменом и SSL"
    exit 1
fi

# Локальный режим
if [ "$MODE" == "local" ]; then
    echo -e "${GREEN}Настройка локального окружения...${NC}"
    
    # Используем docker-compose-local.yml
    cp docker-compose-local.yml docker-compose.yml
    cp nginx-local.conf nginx.conf
    
    echo -e "${GREEN}Запуск контейнеров...${NC}"
    docker compose down 2>/dev/null
    docker compose up -d
    
    echo -e "\n${GREEN}✓ Готово!${NC}"
    echo -e "API доступно по адресу: ${YELLOW}http://localhost${NC}"
    echo -e "Для просмотра логов: ${YELLOW}docker compose logs -f${NC}"
    
# Продакшн режим
elif [ "$MODE" == "production" ]; then
    echo -e "${GREEN}Проверка установки необходимых пакетов...${NC}"
    
    # Проверка nginx и certbot
    if ! command -v nginx &> /dev/null; then
        echo -e "${YELLOW}Установка Nginx...${NC}"
        sudo apt update
        sudo apt install -y nginx
    fi
    
    if ! command -v certbot &> /dev/null; then
        echo -e "${YELLOW}Установка Certbot...${NC}"
        sudo apt install -y certbot python3-certbot-nginx
    fi
    
    # Остановка Docker контейнеров
    echo -e "${GREEN}Остановка Docker контейнеров...${NC}"
    docker compose down 2>/dev/null
    
    # Получение SSL сертификата
    echo -e "${GREEN}Получение SSL сертификата...${NC}"
    sudo systemctl start nginx
    
    # Проверка существующего сертификата
    if sudo certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
        echo -e "${YELLOW}Сертификат для $DOMAIN уже существует${NC}"
        read -p "Обновить сертификат? (y/n): " RENEW
        if [ "$RENEW" == "y" ]; then
            sudo certbot certonly --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --force-renewal
        fi
    else
        sudo certbot certonly --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email
    fi
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Ошибка при получении сертификата${NC}"
        sudo systemctl stop nginx
        exit 1
    fi
    
    sudo systemctl stop nginx
    sudo systemctl disable nginx
    
    # Настройка конфигов
    echo -e "${GREEN}Настройка конфигурации...${NC}"
    
    # Обновление nginx.conf с доменом
    cp nginx-prod.conf nginx.conf
    sed -i "s/demo-project.space/$DOMAIN/g" nginx.conf
    
    # Обновление docker-compose.yml
    cp docker-compose-prod.yml docker-compose.yml
    
    # Запуск контейнеров
    echo -e "${GREEN}Запуск контейнеров...${NC}"
    docker compose up -d
    
    # Ожидание запуска
    sleep 5
    
    # Перезагрузка nginx
    docker compose restart nginx
    
    echo -e "\n${GREEN}✓ Деплой завершен!${NC}"
    echo -e "API доступно по адресу: ${YELLOW}https://$DOMAIN${NC}"
    echo -e "Для просмотра логов: ${YELLOW}docker compose logs -f${NC}"
    
    # Настройка автообновления сертификата
    echo -e "\n${YELLOW}Настройка автообновления SSL сертификата...${NC}"
    (sudo crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * 1 certbot renew --quiet && docker exec nginx nginx -s reload") | sudo crontab -
    echo -e "${GREEN}✓ Автообновление настроено (каждый понедельник в 3:00)${NC}"
fi