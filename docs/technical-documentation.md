# Техническая документация CRM системы колл-центра

## 📋 Содержание

1. [Обзор системы](#обзор-системы)
2. [Архитектура](#архитектура)
3. [Технологический стек](#технологический-стек)
4. [Структура проекта](#структура-проекта)
5. [База данных](#база-данных)
6. [API](#api)
7. [Безопасность](#безопасность)
8. [Производительность](#производительность)
9. [Развертывание](#развертывание)
10. [Мониторинг](#мониторинг)

## 🎯 Обзор системы

CRM система колл-центра предназначена для управления звонками, заказами и операторами. Система обеспечивает:

- **Управление звонками**: прием, обработка и классификация входящих звонков
- **Управление заказами**: создание, отслеживание и выполнение заказов
- **Управление операторами**: учет рабочего времени и производительности
- **Аналитика**: статистика и отчеты по всем аспектам работы
- **Интеграции**: подключение к внешним системам (Avito, Mango Office)

## 🏗️ Архитектура

### Общая архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - React         │    │ - Express       │    │ - Prisma ORM    │
│ - TypeScript    │    │ - TypeScript    │    │ - Индексы       │
│ - Tailwind CSS  │    │ - JWT Auth      │    │ - Миграции      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Внешние API   │    │   Middleware    │    │   Кэширование   │
│                 │    │                 │    │                 │
│ - Avito API     │    │ - Auth          │    │ - In-memory     │
│ - Mango Office  │    │ - Validation    │    │ - TTL           │
│ - SIP сервер    │    │ - Security      │    │ - Инвалидация   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Микросервисная архитектура (планируется)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │   Auth Service  │    │   Call Service  │
│                 │    │                 │    │                 │
│ - Маршрутизация │    │ - JWT токены    │    │ - Обработка     │
│ - Rate Limiting │    │ - Роли          │    │   звонков       │
│ - Логирование   │    │ - Сессии        │    │ - Статистика    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Order Service  │    │  Stats Service  │    │  Notification   │
│                 │    │                 │    │     Service     │
│ - Заказы        │    │ - Аналитика     │    │                 │
│ - Мастера       │    │ - Отчеты        │    │ - Email         │
│ - Статусы       │    │ - Дашборды      │    │ - SMS           │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Технологический стек

### Frontend
- **Next.js 14** - React фреймворк с SSR/SSG
- **TypeScript** - типизированный JavaScript
- **Tailwind CSS** - utility-first CSS фреймворк
- **React Query** - управление состоянием сервера
- **React Hook Form** - управление формами
- **Zustand** - управление состоянием клиента
- **Lucide React** - иконки
- **Sonner** - уведомления

### Backend
- **Node.js** - серверная платформа
- **Express.js** - веб-фреймворк
- **TypeScript** - типизированный JavaScript
- **Prisma** - ORM для работы с базой данных
- **JWT** - аутентификация
- **Winston** - логирование
- **Helmet** - безопасность
- **CORS** - межсайтовые запросы

### База данных
- **PostgreSQL** - основная база данных
- **Prisma Migrate** - миграции схемы
- **Индексы** - оптимизация запросов
- **Транзакции** - целостность данных

### DevOps и инфраструктура
- **Docker** - контейнеризация
- **Docker Compose** - оркестрация
- **Nginx** - веб-сервер и прокси
- **PM2** - менеджер процессов
- **Git** - контроль версий

## 📁 Структура проекта

```
callcentre_crm/
├── frontend/                 # Frontend приложение
│   ├── src/
│   │   ├── app/             # App Router (Next.js 14)
│   │   │   ├── admin/       # Админ панель
│   │   │   ├── auth/        # Аутентификация
│   │   │   ├── calls/       # Управление звонками
│   │   │   ├── orders/      # Управление заказами
│   │   │   ├── stats/       # Статистика
│   │   │   └── telephony/   # Телефония
│   │   ├── components/      # React компоненты
│   │   │   ├── ui/          # UI компоненты
│   │   │   ├── forms/       # Формы
│   │   │   ├── tables/      # Таблицы
│   │   │   └── charts/      # Графики
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Утилиты
│   │   ├── services/        # API сервисы
│   │   └── types/           # TypeScript типы
│   ├── public/              # Статические файлы
│   └── package.json
├── backend/                 # Backend приложение
│   ├── src/
│   │   ├── controllers/     # Контроллеры
│   │   ├── middleware/      # Middleware
│   │   ├── routes/          # Маршруты
│   │   ├── services/        # Бизнес-логика
│   │   ├── utils/           # Утилиты
│   │   ├── config/          # Конфигурация
│   │   └── index.ts         # Точка входа
│   ├── prisma/              # База данных
│   │   ├── schema.prisma    # Схема БД
│   │   └── migrations/      # Миграции
│   ├── load-testing/        # Нагрузочное тестирование
│   └── package.json
├── docs/                    # Документация
├── docker-compose.yml       # Docker конфигурация
└── README.md
```

## 🗄️ База данных

### Основные таблицы

#### `callcentre_operator`
```sql
CREATE TABLE callcentre_operator (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  login VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  status_work VARCHAR(20) DEFAULT 'offline',
  sip_address VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `call`
```sql
CREATE TABLE call (
  id SERIAL PRIMARY KEY,
  rk VARCHAR(50),
  city VARCHAR(100),
  phone_client VARCHAR(20),
  phone_ats VARCHAR(20),
  date_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  operator_id INTEGER REFERENCES callcentre_operator(id),
  status VARCHAR(20) DEFAULT 'new',
  avito_name VARCHAR(255),
  avito_id INTEGER REFERENCES avito(id),
  mango_id INTEGER REFERENCES mango(id)
);
```

#### `order`
```sql
CREATE TABLE "order" (
  id SERIAL PRIMARY KEY,
  rk VARCHAR(50),
  city VARCHAR(100),
  phone VARCHAR(20),
  type_order VARCHAR(20),
  client_name VARCHAR(255),
  address TEXT,
  date_meeting TIMESTAMP,
  type_equipment VARCHAR(10),
  problem TEXT,
  status_order VARCHAR(20) DEFAULT 'new',
  master_id INTEGER,
  result DECIMAL(10,2),
  expenditure DECIMAL(10,2),
  clean DECIMAL(10,2),
  operator_name_id INTEGER REFERENCES callcentre_operator(id),
  create_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closing_data TIMESTAMP
);
```

### Индексы для оптимизации

```sql
-- Индексы для таблицы calls
CREATE INDEX idx_calls_operator_date ON calls(operator_id, date_create);
CREATE INDEX idx_calls_status_date ON calls(status, date_create);
CREATE INDEX idx_calls_city_date ON calls(city, date_create);

-- Индексы для таблицы orders
CREATE INDEX idx_orders_operator_date ON orders(operator_name_id, create_date);
CREATE INDEX idx_orders_status_date ON orders(status_order, create_date);
CREATE INDEX idx_orders_phone ON orders(phone);

-- Составные индексы
CREATE INDEX idx_calls_operator_status_date ON calls(operator_id, status, date_create);
CREATE INDEX idx_orders_operator_status_date ON orders(operator_name_id, status_order, create_date);
```

## 🔌 API

### Аутентификация

#### POST `/api/auth/login`
```json
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

### Управление звонками

#### GET `/api/calls`
**Параметры:**
- `page` - номер страницы (по умолчанию 1)
- `limit` - количество записей (по умолчанию 20)
- `dateFrom` - дата начала фильтрации
- `dateTo` - дата окончания фильтрации
- `operatorId` - ID оператора
- `status` - статус звонка
- `city` - город

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
      "dateCreate": "2025-01-21T10:00:00Z",
      "status": "answered",
      "operator": {
        "id": 1,
        "name": "Иван Иванов"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Управление заказами

#### POST `/api/orders`
```json
{
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
}
```

### Статистика

#### GET `/api/stats/my`
**Параметры:**
- `startDate` - дата начала периода
- `endDate` - дата окончания периода

**Ответ:**
```json
{
  "success": true,
  "data": {
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
        "in_progress": 15,
        "completed": 20
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

## 🔒 Безопасность

### Аутентификация и авторизация

- **JWT токены** с истечением срока действия
- **Роли пользователей**: admin, operator
- **Middleware для проверки прав доступа**
- **Rate limiting** для предотвращения атак

### Защита данных

- **Хеширование паролей** с bcrypt
- **Валидация входных данных** с express-validator
- **Санитизация данных** для предотвращения XSS
- **CORS настройки** для контроля доступа
- **Security headers** с Helmet

### Аудит и логирование

- **Логирование всех действий пользователей**
- **Отслеживание неудачных попыток входа**
- **Мониторинг подозрительной активности**
- **Ротация логов**

## ⚡ Производительность

### Оптимизация базы данных

- **Индексы** для часто используемых запросов
- **Оптимизированные запросы** с Prisma
- **Connection pooling** для управления соединениями
- **Кэширование** часто запрашиваемых данных

### Оптимизация фронтенда

- **Виртуализация списков** для больших наборов данных
- **Ленивая загрузка** компонентов
- **Дебаунсинг** для поиска
- **Мемоизация** для предотвращения лишних рендеров

### Кэширование

- **In-memory кэш** для API ответов
- **TTL (Time To Live)** для автоматического обновления
- **Инвалидация кэша** при изменениях данных
- **Стратегии кэширования** для разных типов данных

## 🚀 Развертывание

### Docker

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api
  
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/crm
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=crm
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Переменные окружения

#### Backend (.env)
```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/crm"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# Сервер
PORT=5000
NODE_ENV=production

# Логирование
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME="CRM Колл-центра"
```

### Процесс развертывания

1. **Подготовка сервера**
   ```bash
   # Установка Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Установка Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Клонирование репозитория**
   ```bash
   git clone https://github.com/your-org/callcentre-crm.git
   cd callcentre-crm
   ```

3. **Настройка переменных окружения**
   ```bash
   cp .env.example .env
   # Отредактировать .env файл
   ```

4. **Запуск приложения**
   ```bash
   docker-compose up -d
   ```

5. **Инициализация базы данных**
   ```bash
   docker-compose exec backend npm run db:migrate
   docker-compose exec backend npm run create-admin
   ```

## 📊 Мониторинг

### Логирование

- **Winston** для структурированного логирования
- **Ротация логов** для управления размером файлов
- **Уровни логирования**: error, warn, info, debug
- **Централизованное логирование** в продакшене

### Метрики производительности

- **Время ответа API** для каждого эндпоинта
- **Использование памяти** и CPU
- **Количество запросов** в секунду
- **Ошибки** и их частота

### Алерты

- **Высокое использование ресурсов** (>80% CPU/RAM)
- **Медленные запросы** (>1 секунды)
- **Высокий процент ошибок** (>5%)
- **Недоступность сервисов**

### Инструменты мониторинга

- **PM2** для управления процессами Node.js
- **Nginx** для мониторинга веб-сервера
- **PostgreSQL** встроенные метрики
- **Custom dashboard** для бизнес-метрик

## 🔧 Обслуживание

### Регулярные задачи

- **Бэкапы базы данных** (ежедневно)
- **Ротация логов** (еженедельно)
- **Обновление зависимостей** (ежемесячно)
- **Мониторинг производительности** (постоянно)

### Масштабирование

- **Горизонтальное масштабирование** через Docker Swarm
- **Вертикальное масштабирование** увеличение ресурсов сервера
- **Кэширование** для снижения нагрузки на БД
- **CDN** для статических ресурсов

### Резервное копирование

```bash
# Бэкап базы данных
pg_dump -h localhost -U user -d crm > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
psql -h localhost -U user -d crm < backup_20250121_120000.sql
```

## 📞 Поддержка

### Контакты

- **Техническая поддержка**: support@company.com
- **Документация**: https://docs.company.com
- **GitHub Issues**: https://github.com/your-org/callcentre-crm/issues

### Процедуры

1. **Сообщение об ошибке** через GitHub Issues
2. **Описание проблемы** с логами и шагами воспроизведения
3. **Приоритизация** по критичности
4. **Исправление** и тестирование
5. **Развертывание** обновления

---

*Документация обновлена: 21 января 2025*
*Версия системы: 1.0.0*
