# Деплой


## 1. Подготовка сервера
Обновите систему
```
sudo apt update && sudo apt upgrade -y
```

Установите Nginx и Certbot для получения SSL сертификатов
```
sudo apt install nginx certbot python3-certbot-nginx -y
```

## Установите Docker


## 2. Билд и запуск
Сделать файл исполняемым
```
chmod +x deploy.sh
```

Запустить можно либо в режиме **local** либо в **production**
- Используйте local если хотите развренуть без домена и ssl сертификата для теста локально
- Используйте production если у вас уже есть домен

```
./deploy.sh local
```