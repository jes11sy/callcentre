# API Документация CRM системы колл-центра

## 📋 Содержание

1. [Обзор API](#обзор-api)
2. [Аутентификация](#аутентификация)
3. [Коды ответов](#коды-ответов)
4. [Эндпоинты](#эндпоинты)
5. [Модели данных](#модели-данных)
6. [Примеры использования](#примеры-использования)
7. [Обработка ошибок](#обработка-ошибок)

## 🌐 Обзор API

### Базовый URL
```
http://localhost:5000/api
```

### Формат данных
- **Content-Type**: `application/json`
- **Кодировка**: UTF-8
- **Формат дат**: ISO 8601 (`2025-01-21T10:00:00Z`)

### Версионирование
API использует версионирование через URL: `/api/v1/`

## 🔐 Аутентификация

### JWT токены
API использует JWT (JSON Web Tokens) для аутентификации.

#### Получение токена
```http
POST /api/auth/login
Content-Type: application/json

{
  "login": "admin",
  "password": "admin123"
}
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "login": "admin",
    "role": "admin",
    "name": "Администратор"
  }
}
```

#### Использование токена
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Роли пользователей
- **admin** - полный доступ ко всем функциям
- **operator** - доступ к звонкам, заказам и личной статистике

## 📊 Коды ответов

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс создан |
| 400 | Неверный запрос |
| 401 | Не авторизован |
| 403 | Доступ запрещен |
| 404 | Ресурс не найден |
| 409 | Конфликт (дублирование) |
| 422 | Ошибка валидации |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |

## 🔌 Эндпоинты

### Аутентификация

#### POST `/api/auth/login`
Вход в систему.

**Тело запроса:**
```json
{
  "login": "string",
  "password": "string"
}
```

**Ответ:**
```json
{
  "accessToken": "string",
  "user": {
    "id": 1,
    "login": "string",
    "role": "admin|operator",
    "name": "string"
  }
}
```

#### POST `/api/auth/logout`
Выход из системы.

**Заголовки:** `Authorization: Bearer <token>`

**Ответ:**
```json
{
  "message": "Успешный выход из системы"
}
```

#### GET `/api/auth/profile`
Получение профиля текущего пользователя.

**Заголовки:** `Authorization: Bearer <token>`

**Ответ:**
```json
{
  "id": 1,
  "login": "string",
  "role": "admin|operator",
  "name": "string",
  "city": "string",
  "status": "active|inactive|on_leave",
  "statusWork": "working|break|offline"
}
```

### Звонки

#### GET `/api/calls`
Получение списка звонков с пагинацией и фильтрацией.

**Параметры запроса:**
- `page` (number, optional) - номер страницы (по умолчанию 1)
- `limit` (number, optional) - количество записей (по умолчанию 20)
- `dateFrom` (string, optional) - дата начала фильтрации (ISO 8601)
- `dateTo` (string, optional) - дата окончания фильтрации (ISO 8601)
- `operatorId` (number, optional) - ID оператора
- `status` (string, optional) - статус звонка
- `city` (string, optional) - город
- `rk` (string, optional) - номер РК
- `avitoName` (string, optional) - название Avito
- `sortBy` (string, optional) - поле для сортировки (по умолчанию dateCreate)
- `sortOrder` (string, optional) - порядок сортировки (asc|desc, по умолчанию desc)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rk": "RK001",
      "city": "Москва",
      "phoneClient": "+79999999999",
      "phoneAts": "+79999999998",
      "dateCreate": "2025-01-21T10:00:00Z",
      "status": "answered",
      "avitoName": "Avito Москва",
      "operator": {
        "id": 1,
        "name": "Иван Иванов",
        "login": "ivan"
      },
      "avito": {
        "id": 1,
        "name": "Avito Москва"
      },
      "mango": {
        "id": 1,
        "callId": "12345",
        "recordUrl": "https://example.com/record.mp3"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET `/api/calls/:id`
Получение звонка по ID.

**Параметры пути:**
- `id` (number) - ID звонка

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rk": "RK001",
    "city": "Москва",
    "phoneClient": "+79999999999",
    "phoneAts": "+79999999998",
    "dateCreate": "2025-01-21T10:00:00Z",
    "status": "answered",
    "avitoName": "Avito Москва",
    "operator": {
      "id": 1,
      "name": "Иван Иванов",
      "login": "ivan"
    },
    "avito": {
      "id": 1,
      "name": "Avito Москва"
    },
    "mango": {
      "id": 1,
      "callId": "12345",
      "recordUrl": "https://example.com/record.mp3"
    }
  }
}
```

#### PUT `/api/calls/:id`
Обновление звонка.

**Параметры пути:**
- `id` (number) - ID звонка

**Тело запроса:**
```json
{
  "status": "answered|missed|no_answer|completed|assigned",
  "avitoName": "string",
  "comments": "string"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "answered",
    "avitoName": "Avito Москва",
    "comments": "Клиент заинтересован в услуге"
  }
}
```

### Заказы

#### GET `/api/orders`
Получение списка заказов с пагинацией и фильтрацией.

**Параметры запроса:**
- `page` (number, optional) - номер страницы
- `limit` (number, optional) - количество записей
- `dateFrom` (string, optional) - дата начала
- `dateTo` (string, optional) - дата окончания
- `operatorId` (number, optional) - ID оператора
- `status` (string, optional) - статус заказа
- `city` (string, optional) - город
- `masterId` (number, optional) - ID мастера
- `search` (string, optional) - поиск по ID, телефону, адресу
- `sortBy` (string, optional) - поле для сортировки
- `sortOrder` (string, optional) - порядок сортировки

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "rk": "RK001",
      "city": "Москва",
      "phone": "+79999999999",
      "typeOrder": "first_time",
      "clientName": "Иван Петров",
      "address": "ул. Ленина, д. 1",
      "dateMeeting": "2025-01-22T14:00:00Z",
      "typeEquipment": "kp",
      "problem": "Не работает",
      "statusOrder": "new",
      "masterId": 1,
      "result": 1500.00,
      "expenditure": 200.00,
      "clean": 1300.00,
      "operator": {
        "id": 1,
        "name": "Иван Иванов",
        "login": "ivan"
      },
      "avito": {
        "id": 1,
        "name": "Avito Москва"
      },
      "createDate": "2025-01-21T10:00:00Z",
      "closingData": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET `/api/orders/:id`
Получение заказа по ID.

**Параметры пути:**
- `id` (number) - ID заказа

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rk": "RK001",
    "city": "Москва",
    "phone": "+79999999999",
    "typeOrder": "first_time",
    "clientName": "Иван Петров",
    "address": "ул. Ленина, д. 1",
    "dateMeeting": "2025-01-22T14:00:00Z",
    "typeEquipment": "kp",
    "problem": "Не работает",
    "statusOrder": "new",
    "masterId": 1,
    "result": 1500.00,
    "expenditure": 200.00,
    "clean": 1300.00,
    "operator": {
      "id": 1,
      "name": "Иван Иванов",
      "login": "ivan"
    },
    "avito": {
      "id": 1,
      "name": "Avito Москва"
    },
    "createDate": "2025-01-21T10:00:00Z",
    "closingData": null
  }
}
```

#### POST `/api/orders`
Создание нового заказа.

**Тело запроса:**
```json
{
  "rk": "RK001",
  "city": "Москва",
  "phone": "+79999999999",
  "typeOrder": "first_time|repeat|warranty",
  "clientName": "Иван Петров",
  "address": "ул. Ленина, д. 1",
  "dateMeeting": "2025-01-22T14:00:00Z",
  "typeEquipment": "kp|bt|mnch",
  "problem": "Не работает",
  "operatorNameId": 1,
  "masterId": 1
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rk": "RK001",
    "city": "Москва",
    "phone": "+79999999999",
    "typeOrder": "first_time",
    "clientName": "Иван Петров",
    "address": "ул. Ленина, д. 1",
    "dateMeeting": "2025-01-22T14:00:00Z",
    "typeEquipment": "kp",
    "problem": "Не работает",
    "statusOrder": "new",
    "masterId": 1,
    "operatorNameId": 1,
    "createDate": "2025-01-21T10:00:00Z"
  }
}
```

#### PUT `/api/orders/:id`
Обновление заказа.

**Параметры пути:**
- `id` (number) - ID заказа

**Тело запроса:**
```json
{
  "rk": "RK001",
  "city": "Москва",
  "phone": "+79999999999",
  "typeOrder": "first_time|repeat|warranty",
  "clientName": "Иван Петров",
  "address": "ул. Ленина, д. 1",
  "dateMeeting": "2025-01-22T14:00:00Z",
  "typeEquipment": "kp|bt|mnch",
  "problem": "Не работает",
  "statusOrder": "new|assigned|in_progress|completed|cancelled",
  "masterId": 1,
  "result": 1500.00,
  "expenditure": 200.00,
  "clean": 1300.00,
  "operatorNameId": 1,
  "closingData": "2025-01-22T16:00:00Z"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rk": "RK001",
    "statusOrder": "completed",
    "result": 1500.00,
    "expenditure": 200.00,
    "clean": 1300.00,
    "closingData": "2025-01-22T16:00:00Z"
  }
}
```

#### DELETE `/api/orders/:id`
Удаление заказа.

**Параметры пути:**
- `id` (number) - ID заказа

**Ответ:**
```json
{
  "success": true,
  "message": "Заказ успешно удален"
}
```

### Статистика

#### GET `/api/stats/my`
Получение личной статистики оператора.

**Параметры запроса:**
- `startDate` (string, optional) - дата начала периода (ISO 8601)
- `endDate` (string, optional) - дата окончания периода (ISO 8601)

**Ответ:**
```json
{
  "success": true,
  "data": {
    "operator": {
      "id": 1,
      "name": "Иван Иванов",
      "login": "ivan"
    },
    "period": {
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-31T23:59:59Z"
    },
    "calls": {
      "total": 150,
      "accepted": 120,
      "missed": 30,
      "acceptanceRate": 80
    },
    "orders": {
      "total": 45,
      "byStatus": {
        "new": 10,
        "assigned": 15,
        "in_progress": 10,
        "completed": 10
      }
    },
    "dailyStats": [
      {
        "date": "2025-01-21",
        "calls": 25,
        "orders": 8
      }
    ]
  }
}
```

#### GET `/api/stats/operator/:operatorId`
Получение статистики конкретного оператора (только для админов).

**Параметры пути:**
- `operatorId` (number) - ID оператора

**Параметры запроса:**
- `startDate` (string, optional) - дата начала периода
- `endDate` (string, optional) - дата окончания периода

**Ответ:** Аналогичен `/api/stats/my`

#### GET `/api/stats/overall`
Получение общей статистики (только для админов).

**Параметры запроса:**
- `startDate` (string, optional) - дата начала периода
- `endDate` (string, optional) - дата окончания периода

**Ответ:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-01-01T00:00:00Z",
      "endDate": "2025-01-31T23:59:59Z"
    },
    "calls": {
      "total": 1500,
      "accepted": 1200,
      "missed": 300,
      "acceptanceRate": 80
    },
    "orders": {
      "total": 450,
      "byStatus": {
        "new": 100,
        "assigned": 150,
        "in_progress": 100,
        "completed": 100
      }
    },
    "operators": [
      {
        "id": 1,
        "name": "Иван Иванов",
        "calls": 150,
        "orders": 45,
        "acceptanceRate": 80
      }
    ],
    "dailyStats": [
      {
        "date": "2025-01-21",
        "calls": 250,
        "orders": 80
      }
    ]
  }
}
```

### Операторы (только для админов)

#### GET `/api/employees`
Получение списка операторов.

**Параметры запроса:**
- `page` (number, optional) - номер страницы
- `limit` (number, optional) - количество записей
- `status` (string, optional) - статус оператора
- `city` (string, optional) - город
- `search` (string, optional) - поиск по имени или логину

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Иван Иванов",
      "login": "ivan",
      "city": "Москва",
      "status": "active",
      "statusWork": "working",
      "sipAddress": "ivan@company.com",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-21T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

#### GET `/api/employees/:id`
Получение оператора по ID.

**Параметры пути:**
- `id` (number) - ID оператора

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Иван Иванов",
    "login": "ivan",
    "city": "Москва",
    "status": "active",
    "statusWork": "working",
    "sipAddress": "ivan@company.com",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-21T10:00:00Z"
  }
}
```

#### POST `/api/employees`
Создание нового оператора.

**Тело запроса:**
```json
{
  "name": "Иван Иванов",
  "login": "ivan",
  "password": "password123",
  "city": "Москва",
  "status": "active|inactive|on_leave",
  "statusWork": "working|break|offline",
  "sipAddress": "ivan@company.com"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Иван Иванов",
    "login": "ivan",
    "city": "Москва",
    "status": "active",
    "statusWork": "offline",
    "sipAddress": "ivan@company.com",
    "createdAt": "2025-01-21T10:00:00Z"
  }
}
```

#### PUT `/api/employees/:id`
Обновление оператора.

**Параметры пути:**
- `id` (number) - ID оператора

**Тело запроса:**
```json
{
  "name": "Иван Иванов",
  "login": "ivan",
  "password": "newpassword123",
  "city": "Москва",
  "status": "active|inactive|on_leave",
  "statusWork": "working|break|offline",
  "sipAddress": "ivan@company.com"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Иван Иванов",
    "login": "ivan",
    "city": "Москва",
    "status": "active",
    "statusWork": "working",
    "sipAddress": "ivan@company.com",
    "updatedAt": "2025-01-21T10:00:00Z"
  }
}
```

#### DELETE `/api/employees/:id`
Удаление оператора.

**Параметры пути:**
- `id` (number) - ID оператора

**Ответ:**
```json
{
  "success": true,
  "message": "Оператор успешно удален"
}
```

## 📋 Модели данных

### Call (Звонок)
```typescript
interface Call {
  id: number;
  rk?: string;
  city?: string;
  phoneClient?: string;
  phoneAts?: string;
  dateCreate: Date;
  operatorId?: number;
  status: 'new' | 'answered' | 'missed' | 'no_answer' | 'completed' | 'assigned';
  avitoName?: string;
  avitoId?: number;
  mangoId?: number;
  operator?: Operator;
  avito?: Avito;
  mango?: Mango;
}
```

### Order (Заказ)
```typescript
interface Order {
  id: number;
  rk?: string;
  city?: string;
  phone?: string;
  typeOrder: 'first_time' | 'repeat' | 'warranty';
  clientName?: string;
  address?: string;
  dateMeeting?: Date;
  typeEquipment: 'kp' | 'bt' | 'mnch';
  problem?: string;
  statusOrder: 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  masterId?: number;
  result?: number;
  expenditure?: number;
  clean?: number;
  operatorNameId: number;
  createDate: Date;
  closingData?: Date;
  operator?: Operator;
  avito?: Avito;
}
```

### Operator (Оператор)
```typescript
interface Operator {
  id: number;
  name: string;
  login: string;
  password: string;
  city: string;
  status: 'active' | 'inactive' | 'on_leave';
  statusWork: 'working' | 'break' | 'offline';
  sipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Avito
```typescript
interface Avito {
  id: number;
  name: string;
  userId?: string;
  connectionStatus?: string;
}
```

### Mango
```typescript
interface Mango {
  id: number;
  callId?: string;
  recordUrl?: string;
}
```

## 💡 Примеры использования

### JavaScript/TypeScript

```typescript
// Аутентификация
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    login: 'admin',
    password: 'admin123'
  })
});

const { accessToken } = await loginResponse.json();

// Получение звонков
const callsResponse = await fetch('/api/calls?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const callsData = await callsResponse.json();

// Создание заказа
const orderResponse = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    rk: 'RK001',
    city: 'Москва',
    phone: '+79999999999',
    typeOrder: 'first_time',
    clientName: 'Иван Петров',
    address: 'ул. Ленина, д. 1',
    dateMeeting: '2025-01-22T14:00:00Z',
    typeEquipment: 'kp',
    problem: 'Не работает',
    operatorNameId: 1
  })
});

const orderData = await orderResponse.json();
```

### cURL

```bash
# Аутентификация
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"admin123"}'

# Получение звонков
curl -X GET "http://localhost:5000/api/calls?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Создание заказа
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rk": "RK001",
    "city": "Москва",
    "phone": "+79999999999",
    "typeOrder": "first_time",
    "clientName": "Иван Петров",
    "address": "ул. Ленина, д. 1",
    "dateMeeting": "2025-01-22T14:00:00Z",
    "typeEquipment": "kp",
    "problem": "Не работает",
    "operatorNameId": 1
  }'
```

## ⚠️ Обработка ошибок

### Формат ошибок

```json
{
  "success": false,
  "error": {
    "message": "Описание ошибки",
    "code": "ERROR_CODE",
    "details": {
      "field": "Описание проблемы с полем"
    }
  }
}
```

### Типичные ошибки

#### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Неверные данные запроса",
    "code": "VALIDATION_ERROR",
    "details": {
      "phone": "Неверный формат телефона",
      "email": "Email обязателен"
    }
  }
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Неверные учетные данные",
    "code": "INVALID_CREDENTIALS"
  }
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Недостаточно прав для выполнения операции",
    "code": "INSUFFICIENT_PERMISSIONS"
  }
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Ресурс не найден",
    "code": "RESOURCE_NOT_FOUND"
  }
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": {
    "message": "Превышен лимит запросов, попробуйте позже",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

### Коды ошибок

| Код | Описание |
|-----|----------|
| `VALIDATION_ERROR` | Ошибка валидации данных |
| `INVALID_CREDENTIALS` | Неверные учетные данные |
| `INSUFFICIENT_PERMISSIONS` | Недостаточно прав |
| `RESOURCE_NOT_FOUND` | Ресурс не найден |
| `DUPLICATE_RESOURCE` | Дублирование ресурса |
| `RATE_LIMIT_EXCEEDED` | Превышен лимит запросов |
| `INTERNAL_SERVER_ERROR` | Внутренняя ошибка сервера |

---

*API документация обновлена: 21 января 2025*
*Версия API: 1.0.0*
