-- Настройка базы данных для Call Centre CRM
-- Выполнить от имени администратора PostgreSQL

-- 1. Создание базы данных
CREATE DATABASE default_db 
    WITH 
    OWNER = gen_user 
    ENCODING = 'UTF8' 
    LC_COLLATE = 'en_US.utf8' 
    LC_CTYPE = 'en_US.utf8' 
    TABLESPACE = pg_default 
    CONNECTION LIMIT = -1;

-- 2. Подключение к новой базе данных
\c default_db;

-- 3. Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 4. Создание схемы (если нужна отдельная схема)
-- CREATE SCHEMA IF NOT EXISTS callcentre AUTHORIZATION gen_user;

-- 5. Предоставление всех прав пользователю
GRANT ALL PRIVILEGES ON DATABASE default_db TO gen_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gen_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gen_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO gen_user;

-- 6. Предоставление прав на будущие объекты
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gen_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gen_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO gen_user;

-- 7. Оптимизация настроек для CRM системы
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Перезагрузка конфигурации
SELECT pg_reload_conf();

-- Проверка подключения
SELECT version();
SELECT current_database();
SELECT current_user;
