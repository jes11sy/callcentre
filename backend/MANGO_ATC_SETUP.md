# Настройка интеграции с Mango ATC

## Обзор

Интеграция с Mango ATC реализована через webhook для получения событий звонков в реальном времени. Это обеспечивает автоматическое создание записей звонков в системе CRM.

## Архитектура

```
Mango ATC → Webhook → Backend API → Database
                ↓
         Frontend (обновление в реальном времени)
```

## Настройка

### 1. Переменные окружения

Добавьте в файл `.env`:

```env
# Mango ATC Integration
MANGO_API_URL="https://app.mango-office.ru/vpbx"
MANGO_API_KEY="your_api_key"
MANGO_API_ID="your_api_id"
MANGO_WEBHOOK_URL="/api/webhooks/mango"
```

### 2. Настройка webhook в Mango Office

1. Войдите в панель управления Mango Office
2. Перейдите в раздел "Настройки" → "Webhook"
3. Добавьте новый webhook:
   - **URL**: `https://your-domain.com/api/webhooks/mango`
   - **События**: 
     - `call/start` - начало звонка
     - `call/answer` - ответ на звонок
     - `call/end` - завершение звонка
   - **Метод**: POST
   - **Формат**: JSON

### 3. Настройка номеров телефонов

Убедитесь, что в таблице `phones` добавлены номера АТС:

```sql
INSERT INTO phones (number, rk, city) VALUES 
('+7XXXXXXXXXX', 'РК1', 'Москва'),
('+7YYYYYYYYYY', 'РК2', 'Санкт-Петербург');
```

## Обрабатываемые события

### 1. Начало звонка (`call/start`)
- Создается запись в таблице `mango`
- Статус: `started`

### 2. Ответ на звонок (`call/answer`)
- Обновляется статус в таблице `mango`
- Статус: `answered`

### 3. Завершение звонка (`call/end`)
- Обновляется запись в таблице `mango`
- Создается запись в таблице `calls`
- Статус: `completed`

## Структура данных webhook

```json
{
  "call_id": "unique_call_id",
  "from": "+7XXXXXXXXXX",
  "to": "+7YYYYYYYYYY",
  "direction": "in|out",
  "status": "start|answer|end",
  "duration": 120,
  "record_url": "https://...",
  "timestamp": 1234567890,
  "entry_id": "entry_id",
  "line_number": "+7XXXXXXXXXX",
  "location": "location",
  "disconnect_reason": "busy|no_answer|...",
  "vpbx_api_id": "api_id",
  "vpbx_api_key": "api_key"
}
```

## Определение статуса звонка

- **answered** - звонок отвечен (duration > 0)
- **missed** - звонок пропущен
- **busy** - занято
- **no_answer** - нет ответа

## Логика определения оператора

1. Поиск номера АТС в таблице `phones`
2. Поиск оператора по городу из таблицы `phones`
3. Если не найден - используется оператор по умолчанию

## API Endpoints

### POST /api/webhooks/mango
Webhook endpoint для получения событий от Mango ATC

**Параметры:**
- `webhookData` - данные webhook от Mango ATC

**Ответ:**
```json
{
  "success": true
}
```

### GET /api/webhooks/mango/settings
Получение настроек Mango ATC (требует аутентификации)

**Ответ:**
```json
{
  "success": true,
  "data": {
    "webhookUrl": "/api/webhooks/mango",
    "apiUrl": "https://app.mango-office.ru/vpbx",
    "apiKey": "***",
    "apiId": "***"
  }
}
```

## Мониторинг

### Логи
Все события webhook логируются в файлы:
- `logs/combined.log` - общие логи
- `logs/error.log` - ошибки

### Проверка работы
1. Проверьте логи на наличие ошибок
2. Убедитесь, что записи создаются в таблице `calls`
3. Проверьте статусы звонков в веб-интерфейсе

## Устранение неполадок

### Webhook не приходит
1. Проверьте URL webhook в настройках Mango Office
2. Убедитесь, что сервер доступен извне
3. Проверьте логи на наличие ошибок

### Звонки не создаются
1. Проверьте настройки номеров в таблице `phones`
2. Убедитесь, что операторы существуют в системе
3. Проверьте логи на ошибки обработки

### Неправильные статусы
1. Проверьте логику определения статуса в коде
2. Убедитесь, что Mango отправляет корректные данные

## Безопасность

- Webhook endpoint не требует аутентификации (только для Mango ATC)
- Рекомендуется использовать HTTPS
- Можно добавить проверку IP-адресов Mango Office
- Логирование всех входящих webhook для аудита
