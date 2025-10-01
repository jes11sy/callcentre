# 🤖 Настройка интеграции с Telegram ботом

## 📋 Обзор

Интеграция CRM с Telegram ботом для отправки уведомлений директорам о новых заказах и изменениях дат встреч.

## 🔧 Настройка GitHub Secrets

### Production Secrets
Добавьте в GitHub Secrets (Settings → Secrets and variables → Actions):

```bash
BOT_WEBHOOK_URL=http://your-bot-server:8080
WEBHOOK_TOKEN=your_webhook_secret_token
```

### Staging Secrets
```bash
STAGING_BOT_WEBHOOK_URL=http://your-staging-bot-server:8080
STAGING_WEBHOOK_TOKEN=your_staging_webhook_secret_token
```

## 🚀 Что уже настроено

### ✅ CI/CD Workflows
- **deploy.yml** - автоматическое развертывание в production
- **manual-deploy.yml** - ручное развертывание в staging/production

### ✅ Docker Compose
- **docker-compose.prod.yml** - передача переменных в production контейнер
- **docker-compose.staging.yml** - передача переменных в staging контейнер

### ✅ CRM Backend
- **DirectorNotificationService** - сервис отправки уведомлений
- **Автоматические вызовы** при создании/изменении заказов

## 📡 Формат уведомлений

### Новая заявка
```json
POST /webhook/new-order
{
  "orderId": 123,
  "city": "Москва",
  "dateMeeting": "2025-01-15T10:30:00.000Z",
  "token": "your_webhook_secret_token"
}
```

### Перенос даты
```json
POST /webhook/order-update
{
  "orderId": 123,
  "newDate": "2025-01-15T14:00:00.000Z",
  "city": "Москва",
  "token": "your_webhook_secret_token"
}
```

## 🔄 Точки интеграции

CRM отправляет уведомления в следующих случаях:

1. **Создание заказа из звонка** (`POST /api/orders/from-call`)
2. **Создание заказа из чата Авито** (`POST /api/orders/from-chat`)
3. **Создание заказа** (`POST /api/orders`)
4. **Изменение даты встречи** (`PUT /api/orders/:id`)

## 🧪 Тестирование

### 1. Проверка переменных окружения
```bash
# В контейнере CRM
echo $BOT_WEBHOOK_URL
echo $WEBHOOK_TOKEN
```

### 2. Тест создания заказа
Создайте тестовый заказ через CRM и проверьте логи:
```bash
docker-compose logs -f backend | grep "уведомление"
```

### 3. Тест изменения даты
Измените дату встречи в заказе и проверьте отправку уведомления.

## 📊 Мониторинг

### Логи CRM
```bash
# Логи уведомлений
docker-compose logs backend | grep -E "(уведомление|webhook|bot)"

# Файлы логов
tail -f logs/combined.log | grep -E "(DirectorNotification|webhook)"
```

### Health Check
```bash
# Проверка доступности бота
curl -f http://your-bot-server:8080/health
```

## 🚨 Troubleshooting

### Проблема: Уведомления не отправляются
**Проверьте:**
1. Переменные окружения в контейнере
2. Доступность бота по URL
3. Совпадение WEBHOOK_TOKEN
4. Логи CRM на ошибки

### Проблема: 401 Unauthorized
**Решение:** Проверьте совпадение WEBHOOK_TOKEN в CRM и боте

### Проблема: 404 Director not found
**Решение:** Убедитесь что в таблице `director` есть запись с нужным городом и tg_id

## 📚 Дополнительные ресурсы

- [DirectorNotificationService](../backend/src/services/directorNotificationService.ts)
- [Order Controller](../backend/src/controllers/orderController.ts)
- [CI/CD Guide](./docs/cicd-guide.md)

---

**🎉 После настройки GitHub Secrets интеграция заработает автоматически при следующем развертывании!**
