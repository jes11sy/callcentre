# Инструкции по развертыванию CRM системы колл-центра

## 📋 Содержание

1. [Требования к системе](#требования-к-системе)
2. [Подготовка сервера](#подготовка-сервера)
3. [Установка зависимостей](#установка-зависимостей)
4. [Настройка базы данных](#настройка-базы-данных)
5. [Развертывание приложения](#развертывание-приложения)
6. [Настройка веб-сервера](#настройка-веб-сервера)
7. [SSL сертификаты](#ssl-сертификаты)
8. [Мониторинг и логирование](#мониторинг-и-логирование)
9. [Резервное копирование](#резервное-копирование)
10. [Обновление системы](#обновление-системы)

## 💻 Требования к системе

### Минимальные требования
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 20 GB свободного места
- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

### Рекомендуемые требования
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Диск**: 50 GB SSD
- **ОС**: Ubuntu 22.04 LTS

### Программное обеспечение
- **Node.js**: 18.x или выше
- **PostgreSQL**: 13.x или выше
- **Nginx**: 1.18+ (для продакшена)
- **Docker**: 20.x+ (опционально)
- **Git**: 2.x+

## 🖥️ Подготовка сервера

### Ubuntu/Debian

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y curl wget git unzip software-properties-common

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Nginx
sudo apt install -y nginx

# Установка PM2 (менеджер процессов)
sudo npm install -g pm2

# Установка Docker (опционально)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### CentOS/RHEL

```bash
# Обновление системы
sudo yum update -y

# Установка EPEL репозитория
sudo yum install -y epel-release

# Установка Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Установка PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Установка Nginx
sudo yum install -y nginx

# Установка PM2
sudo npm install -g pm2
```

### Windows Server

1. Скачайте и установите Node.js с официального сайта
2. Установите PostgreSQL с официального сайта
3. Установите Nginx для Windows
4. Установите Git для Windows
5. Установите PM2 глобально: `npm install -g pm2`

## 📦 Установка зависимостей

### Клонирование репозитория

```bash
# Создание директории для приложения
sudo mkdir -p /opt/callcentre-crm
sudo chown $USER:$USER /opt/callcentre-crm
cd /opt/callcentre-crm

# Клонирование репозитория
git clone https://github.com/your-org/callcentre-crm.git .

# Или загрузка архива
wget https://github.com/your-org/callcentre-crm/archive/main.zip
unzip main.zip
mv callcentre-crm-main/* .
rm -rf callcentre-crm-main main.zip
```

### Установка зависимостей

```bash
# Backend зависимости
cd backend
npm install --production

# Frontend зависимости
cd ../frontend
npm install --production

# Сборка frontend
npm run build
```

## 🗄️ Настройка базы данных

### Создание базы данных

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# Создание базы данных и пользователя
CREATE DATABASE callcentre_crm;
CREATE USER crm_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE callcentre_crm TO crm_user;
\q
```

### Настройка PostgreSQL

```bash
# Редактирование конфигурации PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf

# Настройки для продакшена
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Настройка аутентификации
sudo nano /etc/postgresql/13/main/pg_hba.conf

# Добавить строку для локальных подключений
local   callcentre_crm   crm_user                    md5
host    callcentre_crm   crm_user    127.0.0.1/32   md5

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
```

### Инициализация базы данных

```bash
cd /opt/callcentre-crm/backend

# Создание файла .env
cat > .env << EOF
DATABASE_URL="postgresql://crm_user:secure_password@localhost:5432/callcentre_crm"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV=production
LOG_LEVEL=info
LOG_FILE=logs/app.log
EOF

# Применение миграций
npm run db:migrate

# Создание администратора
npm run create-admin
```

## 🚀 Развертывание приложения

### Настройка переменных окружения

#### Backend (.env)
```env
# База данных
DATABASE_URL="postgresql://crm_user:secure_password@localhost:5432/callcentre_crm"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"

# Сервер
PORT=5000
NODE_ENV=production
HOST=0.0.0.0

# Логирование
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Безопасность
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Внешние API
AVITO_API_URL="https://api.avito.ru"
MANGO_API_URL="https://api.mango-office.ru"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_APP_NAME="CRM Колл-центра"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Сборка приложения

```bash
# Сборка backend
cd /opt/callcentre-crm/backend
npm run build

# Сборка frontend
cd /opt/callcentre-crm/frontend
npm run build
```

### Настройка PM2

```bash
# Создание конфигурации PM2
cat > /opt/callcentre-crm/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      script: './backend/dist/index.js',
      cwd: '/opt/callcentre-crm',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'crm-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/callcentre-crm/frontend',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    }
  ]
};
EOF

# Создание директории для логов
mkdir -p /opt/callcentre-crm/logs

# Запуск приложения
cd /opt/callcentre-crm
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска
pm2 startup
```

## 🌐 Настройка веб-сервера

### Конфигурация Nginx

```bash
# Создание конфигурации сайта
sudo nano /etc/nginx/sites-available/callcentre-crm
```

```nginx
# /etc/nginx/sites-available/callcentre-crm
upstream backend {
    server 127.0.0.1:5000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Безопасность
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Логирование
    access_log /var/log/nginx/callcentre-crm-access.log;
    error_log /var/log/nginx/callcentre-crm-error.log;
    
    # Сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # API прокси
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Статические файлы
    location /static/ {
        alias /opt/callcentre-crm/frontend/out/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Файлы загрузок
    location /uploads/ {
        alias /opt/callcentre-crm/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

### Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/callcentre-crm /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL сертификаты

### Let's Encrypt (бесплатные сертификаты)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Автоматическое обновление
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Коммерческие сертификаты

```bash
# Загрузка сертификатов в директорию
sudo mkdir -p /etc/ssl/certs/callcentre-crm
sudo cp your-certificate.crt /etc/ssl/certs/callcentre-crm/
sudo cp your-private-key.key /etc/ssl/private/callcentre-crm/
sudo chmod 600 /etc/ssl/private/callcentre-crm/your-private-key.key
```

## 📊 Мониторинг и логирование

### Настройка логирования

```bash
# Создание директории для логов
sudo mkdir -p /var/log/callcentre-crm
sudo chown $USER:$USER /var/log/callcentre-crm

# Настройка ротации логов
sudo nano /etc/logrotate.d/callcentre-crm
```

```bash
# /etc/logrotate.d/callcentre-crm
/var/log/callcentre-crm/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Мониторинг с PM2

```bash
# Установка PM2 мониторинга
pm2 install pm2-logrotate

# Настройка мониторинга
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Просмотр логов
pm2 logs
pm2 logs crm-backend
pm2 logs crm-frontend

# Мониторинг в реальном времени
pm2 monit
```

### Системный мониторинг

```bash
# Установка htop для мониторинга ресурсов
sudo apt install -y htop

# Установка iotop для мониторинга дисков
sudo apt install -y iotop

# Создание скрипта мониторинга
cat > /opt/callcentre-crm/monitor.sh << 'EOF'
#!/bin/bash

# Проверка статуса сервисов
echo "=== Статус сервисов ==="
systemctl is-active postgresql
systemctl is-active nginx
pm2 status

# Проверка использования ресурсов
echo "=== Использование ресурсов ==="
free -h
df -h
top -bn1 | head -20

# Проверка логов на ошибки
echo "=== Последние ошибки ==="
tail -n 20 /var/log/callcentre-crm/error.log
EOF

chmod +x /opt/callcentre-crm/monitor.sh

# Добавление в crontab для регулярной проверки
crontab -e
# Добавить строку:
*/5 * * * * /opt/callcentre-crm/monitor.sh >> /var/log/callcentre-crm/monitor.log
```

## 💾 Резервное копирование

### Автоматическое резервное копирование

```bash
# Создание скрипта резервного копирования
cat > /opt/callcentre-crm/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/callcentre-crm"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="callcentre_crm"
DB_USER="crm_user"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Бэкап файлов приложения
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /opt/callcentre-crm --exclude=node_modules --exclude=logs

# Бэкап конфигурации
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz /etc/nginx/sites-available/callcentre-crm /opt/callcentre-crm/.env

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/callcentre-crm/backup.sh

# Добавление в crontab (ежедневно в 2:00)
crontab -e
# Добавить строку:
0 2 * * * /opt/callcentre-crm/backup.sh >> /var/log/callcentre-crm/backup.log
```

### Восстановление из резервной копии

```bash
# Восстановление базы данных
psql -h localhost -U crm_user -d callcentre_crm < /opt/backups/callcentre-crm/db_backup_20250121_020000.sql

# Восстановление файлов приложения
tar -xzf /opt/backups/callcentre-crm/app_backup_20250121_020000.tar.gz -C /

# Восстановление конфигурации
tar -xzf /opt/backups/callcentre-crm/config_backup_20250121_020000.tar.gz -C /

# Перезапуск сервисов
pm2 restart all
sudo systemctl restart nginx
```

## 🔄 Обновление системы

### Процедура обновления

```bash
# Создание скрипта обновления
cat > /opt/callcentre-crm/update.sh << 'EOF'
#!/bin/bash

echo "Starting system update..."

# Создание резервной копии
/opt/callcentre-crm/backup.sh

# Остановка приложения
pm2 stop all

# Обновление кода
cd /opt/callcentre-crm
git pull origin main

# Обновление зависимостей
cd backend
npm install --production
npm run build

cd ../frontend
npm install --production
npm run build

# Применение миграций базы данных
cd ../backend
npm run db:migrate

# Запуск приложения
cd ..
pm2 start ecosystem.config.js

echo "System update completed!"
EOF

chmod +x /opt/callcentre-crm/update.sh
```

### Откат изменений

```bash
# Откат к предыдущей версии
cd /opt/callcentre-crm
git log --oneline -10  # Просмотр истории коммитов
git checkout <commit-hash>  # Откат к нужному коммиту

# Восстановление базы данных из бэкапа
psql -h localhost -U crm_user -d callcentre_crm < /opt/backups/callcentre-crm/db_backup_YYYYMMDD_HHMMSS.sql

# Перезапуск сервисов
pm2 restart all
```

## 🛠️ Устранение неполадок

### Частые проблемы

#### Приложение не запускается
```bash
# Проверка логов
pm2 logs
tail -f /var/log/callcentre-crm/error.log

# Проверка статуса сервисов
systemctl status postgresql
systemctl status nginx
pm2 status

# Проверка портов
netstat -tlnp | grep :5000
netstat -tlnp | grep :3000
```

#### Проблемы с базой данных
```bash
# Проверка подключения к БД
psql -h localhost -U crm_user -d callcentre_crm -c "SELECT version();"

# Проверка миграций
cd /opt/callcentre-crm/backend
npx prisma migrate status

# Применение миграций
npx prisma migrate deploy
```

#### Проблемы с Nginx
```bash
# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx

# Проверка логов
sudo tail -f /var/log/nginx/error.log
```

### Мониторинг производительности

```bash
# Установка инструментов мониторинга
sudo apt install -y htop iotop nethogs

# Мониторинг в реальном времени
htop  # CPU и память
iotop  # Дисковые операции
nethogs  # Сетевой трафик
```

## 📞 Поддержка

### Контакты
- **Техническая поддержка**: support@company.com
- **Документация**: https://docs.company.com
- **GitHub Issues**: https://github.com/your-org/callcentre-crm/issues

### Логи для диагностики
- **PM2 логи**: `pm2 logs`
- **Nginx логи**: `/var/log/nginx/`
- **PostgreSQL логи**: `/var/log/postgresql/`
- **Системные логи**: `/var/log/syslog`

---

*Инструкции по развертыванию обновлены: 21 января 2025*
*Версия системы: 1.0.0*
