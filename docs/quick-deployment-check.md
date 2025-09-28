# Быстрая проверка деплоя

## Подключись к серверу и проверь:

```bash
ssh root@92.51.22.226

# Проверь статус контейнеров
docker ps -a

# Проверь логи если что-то не работает
docker logs callcentre-backend
docker logs callcentre-frontend  
docker logs callcentre-nginx

# Проверь переменные окружения
cat /opt/callcentre-crm/.env

# Проверь доступ к базе данных
docker exec callcentre-backend sh -c "npm run migrate"

# Проверь локальные порты
curl http://localhost:80
curl http://localhost:3000
```

## Если контейнеры падают:

```bash
cd /opt/callcentre-crm
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

## Настройка DNS:

В панели управления доменом `lead-schem.ru` добавь:
```
A callcentre → 92.51.22.226
A apikc → 92.51.22.226
```
