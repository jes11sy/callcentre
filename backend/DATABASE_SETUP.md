# Настройка базы данных PostgreSQL

## 1. Установка PostgreSQL

### Windows:
1. Скачайте PostgreSQL с официального сайта: https://www.postgresql.org/download/windows/
2. Запустите установщик и следуйте инструкциям
3. Запомните пароль для пользователя `postgres`

### Альтернатива - Docker:
```bash
docker run --name callcentre-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14
```

## 2. Создание базы данных

### Через psql:
```bash
psql -U postgres -h localhost
CREATE DATABASE callcentre_crm;
\q
```

### Через pgAdmin:
1. Откройте pgAdmin
2. Создайте новую базу данных `callcentre_crm`

## 3. Настройка подключения

Отредактируйте файл `.env`:
```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/callcentre_crm"
```

Замените `ВАШ_ПАРОЛЬ` на пароль, который вы установили при установке PostgreSQL.

## 4. Применение схемы

После настройки подключения запустите:
```bash
npm run db:push
```

Или:
```bash
npx prisma db push
```

## 5. Проверка

Для проверки схемы используйте Prisma Studio:
```bash
npm run db:studio
```

Или:
```bash
npx prisma studio
```
