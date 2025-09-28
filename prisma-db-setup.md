# 🎯 Настройка БД с Prisma для Production

## 📋 Шаги настройки:

### 1️⃣ **Обнови DATABASE_URL локально (для тестирования)**
```bash
# В backend/.env:
DATABASE_URL="postgresql://gen_user:j7X_S9mznbdGHc9P@5.129.247.54:5432/default_db"
```

### 2️⃣ **Создай базу данных на сервере**
```sql
-- Подключись к PostgreSQL:
psql -h 5.129.247.54 -p 5432 -U gen_user -d postgres

-- Создай базу:
CREATE DATABASE default_db;

-- Дай права:
GRANT ALL PRIVILEGES ON DATABASE default_db TO gen_user;
```

### 3️⃣ **Примени миграции Prisma**
```bash
cd backend

# Сгенерируй Prisma клиент:
npx prisma generate

# Примени все миграции к новой БД:
npx prisma db push

# ИЛИ если есть миграции:
npx prisma migrate deploy

# Проверь что всё работает:
npx prisma studio
```

### 4️⃣ **Создай начального админа**
```bash
cd backend
npm run create-admin
```

### 5️⃣ **Тестируй подключение**
```bash
# Запусти бэкенд локально с новой БД:
npm run dev

# Проверь /api/health
curl http://localhost:3001/api/health
```

## ✅ **После успешного тестирования:**

1. **Создай GitHub Secrets** с данными из `production-env-template.txt`
2. **Пуш в main ветку** запустит автодеплой
3. **CI/CD сам выполнит** `prisma migrate deploy` на сервере

---

## 🚨 **Важно:**
- Prisma **сама создаст** все таблицы из `schema.prisma`
- **НЕ нужен** отдельный SQL скрипт
- Все данные **автоматически** мигрируют при деплое
