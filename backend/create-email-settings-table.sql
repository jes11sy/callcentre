-- Создание таблицы email_settings если её нет
CREATE TABLE IF NOT EXISTS email_settings (
    id SERIAL PRIMARY KEY,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    secure BOOLEAN DEFAULT true,
    "user" VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    mango_email VARCHAR(255) NOT NULL,
    check_interval INTEGER DEFAULT 5,
    enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_email_settings_created_at ON email_settings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_settings_enabled ON email_settings(enabled);
