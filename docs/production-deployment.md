# 🚀 Production Deployment Guide - Call Centre CRM

## 🎯 Обзор развертывания

Данное руководство описывает полное развертывание Call Centre CRM в продакшене с доменами:
- **Backend API**: `apikc.lead-schem.ru`
- **Frontend**: `callcentre.lead-schem.ru`

## 📋 Пре-реквизиты

### Системные требования
- **Сервер**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: минимум 2GB, рекомендуется 4GB+
- **CPU**: минимум 2 cores
- **Диск**: минимум 20GB SSD
- **Домены**: DNS настроен для обоих доменов

### Необходимые порты
- **80**: HTTP (редирект на HTTPS)
- **443**: HTTPS (основной)
- **5432**: PostgreSQL (внутренний)
- **6379**: Redis (внутренний)

## 🔧 Пошаговое развертывание

### Шаг 1: Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Установка дополнительных инструментов
sudo apt install -y nginx certbot python3-certbot-nginx git
```

### Шаг 2: Клонирование и настройка проекта

```bash
# Клонирование репозитория
git clone https://github.com/your-repo/callcentre_crm.git
cd callcentre_crm

# Создание директорий
sudo mkdir -p /etc/ssl/certs/callcentre
sudo mkdir -p /var/log/callcentre
```

### Шаг 3: Настройка DNS

1. **Проверьте DNS записи**:
```bash
nslookup apikc.lead-schem.ru
nslookup callcentre.lead-schem.ru
```

2. **Настройте A записи** (см. [DNS Setup Guide](./dns-setup-guide.md))

### Шаг 4: Получение SSL сертификатов

#### Вариант A: Let's Encrypt (рекомендуется)

```bash
# Остановите временно другие веб-серверы
sudo systemctl stop nginx

# Получение сертификатов
sudo certbot certonly --standalone \
    -d apikc.lead-schem.ru \
    -d callcentre.lead-schem.ru

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/apikc.lead-schem.ru/fullchain.pem /etc/ssl/certs/callcentre/certificate.crt
sudo cp /etc/letsencrypt/live/apikc.lead-schem.ru/privkey.pem /etc/ssl/certs/callcentre/private.key
sudo cp /etc/letsencrypt/live/apikc.lead-schem.ru/chain.pem /etc/ssl/certs/callcentre/ca_bundle.crt

# Установка прав доступа
sudo chmod 600 /etc/ssl/certs/callcentre/private.key
sudo chmod 644 /etc/ssl/certs/callcentre/certificate.crt
sudo chmod 644 /etc/ssl/certs/callcentre/ca_bundle.crt
```

#### Вариант B: Самоподписанный (для тестирования)

```bash
# Генерация wildcard сертификата
./scripts/generate-ssl-domains.sh
# Выберите опцию 1

# Копирование в системную директорию
sudo cp ssl/certificate.crt /etc/ssl/certs/callcentre/
sudo cp ssl/private.key /etc/ssl/certs/callcentre/
sudo chmod 600 /etc/ssl/certs/callcentre/private.key
sudo chmod 644 /etc/ssl/certs/callcentre/certificate.crt
```

### Шаг 5: Настройка переменных окружения

#### Backend (.env)

```bash
# Создание файла конфигурации backend
cat > backend/.env << EOF
# Production Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://callcentre_user:SECURE_PASSWORD@postgres:5432/callcentre_crm
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=SUPER_SECURE_JWT_SECRET_32_CHARACTERS_MIN
JWT_EXPIRES_IN=7d

# Server
PORT=5000
HTTP_PORT=80
HTTPS_PORT=443

# SSL/TLS Configuration
SSL_ENABLED=true
SSL_CERT_DIR=/etc/ssl/certs/callcentre

# Domain Configuration
BACKEND_DOMAIN=apikc.lead-schem.ru
FRONTEND_DOMAIN=callcentre.lead-schem.ru
FRONTEND_URL=https://callcentre.lead-schem.ru

# External APIs
MANGO_OFFICE_API_KEY=your_mango_api_key
MANGO_OFFICE_API_SALT=your_mango_api_salt
MANGO_API_URL=https://app.mango-office.ru/vpbx
MANGO_API_KEY=your_mango_api_key
MANGO_API_ID=your_mango_api_id
MANGO_WEBHOOK_URL=https://apikc.lead-schem.ru/api/webhooks/mango

AVITO_CLIENT_ID=your_avito_client_id
AVITO_CLIENT_SECRET=your_avito_client_secret

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Director Bot Integration
BOT_WEBHOOK_URL=http://localhost:3001
WEBHOOK_TOKEN=your_webhook_secret_token
EOF
```

#### Frontend (.env.local)

```bash
# Создание файла конфигурации frontend
cat > frontend/.env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=https://apikc.lead-schem.ru
NEXT_PUBLIC_SOCKET_URL=wss://apikc.lead-schem.ru

# Domain Configuration
NEXT_PUBLIC_FRONTEND_DOMAIN=callcentre.lead-schem.ru
NEXT_PUBLIC_BACKEND_DOMAIN=apikc.lead-schem.ru

# Application Settings
NEXT_PUBLIC_APP_NAME="Call Centre CRM"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
EOF
```

#### Docker Environment (.env для docker-compose)

```bash
# Создание файла для Docker Compose
cat > .env << EOF
# Database credentials
POSTGRES_USER=callcentre_user
POSTGRES_PASSWORD=SECURE_DB_PASSWORD
POSTGRES_DB=callcentre_crm

# JWT Secret
JWT_SECRET=SUPER_SECURE_JWT_SECRET_32_CHARACTERS_MIN
EOF
```

### Шаг 6: Настройка Nginx

```bash
# Копирование конфигурации Nginx
sudo cp config/nginx/callcentre-crm.conf /etc/nginx/sites-available/callcentre-crm

# Активация сайта
sudo ln -s /etc/nginx/sites-available/callcentre-crm /etc/nginx/sites-enabled/

# Удаление дефолтного сайта
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Шаг 7: Запуск приложения

```bash
# Сборка и запуск контейнеров
docker-compose -f docker-compose.prod.yml up -d --build

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f
```

### Шаг 8: Инициализация базы данных

```bash
# Запуск миграций
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Создание администратора
docker-compose -f docker-compose.prod.yml exec backend npm run create-admin
```

## 🧪 Проверка развертывания

### 1. Проверка доменов и SSL

```bash
# Проверка SSL сертификатов
echo | openssl s_client -connect apikc.lead-schem.ru:443 -servername apikc.lead-schem.ru 2>/dev/null | openssl x509 -noout -dates
echo | openssl s_client -connect callcentre.lead-schem.ru:443 -servername callcentre.lead-schem.ru 2>/dev/null | openssl x509 -noout -dates

# Проверка HTTP → HTTPS редиректов
curl -I http://apikc.lead-schem.ru
curl -I http://callcentre.lead-schem.ru
```

### 2. Проверка API endpoints

```bash
# Health check backend
curl https://apikc.lead-schem.ru/health

# Health check frontend
curl -I https://callcentre.lead-schem.ru/

# API info
curl https://apikc.lead-schem.ru/info
```

### 3. SSL Labs тест

- Откройте https://www.ssllabs.com/ssltest/
- Протестируйте оба домена
- Ожидаемый результат: A или A+

## 🔄 Автоматическое обновление SSL

### Настройка автообновления Let's Encrypt

```bash
# Создание скрипта обновления
sudo tee /usr/local/bin/renew-callcentre-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
if [ $? -eq 0 ]; then
    # Копирование обновленных сертификатов
    cp /etc/letsencrypt/live/apikc.lead-schem.ru/fullchain.pem /etc/ssl/certs/callcentre/certificate.crt
    cp /etc/letsencrypt/live/apikc.lead-schem.ru/privkey.pem /etc/ssl/certs/callcentre/private.key
    cp /etc/letsencrypt/live/apikc.lead-schem.ru/chain.pem /etc/ssl/certs/callcentre/ca_bundle.crt
    
    # Перезагрузка сервисов
    systemctl reload nginx
    docker-compose -f /path/to/callcentre_crm/docker-compose.prod.yml restart backend
fi
EOF

# Установка прав на выполнение
sudo chmod +x /usr/local/bin/renew-callcentre-ssl.sh

# Добавление в crontab
sudo crontab -e
# Добавить строку:
# 0 2 1 * * /usr/local/bin/renew-callcentre-ssl.sh >> /var/log/callcentre/ssl-renew.log 2>&1
```

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Логи приложения
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# Логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Системные логи
sudo journalctl -f -u nginx
sudo journalctl -f -u docker
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Дисковое пространство
df -h

# Мониторинг сертификатов
./scripts/generate-ssl-domains.sh
# Выберите опцию 3: Validate existing certificates
```

## 🔧 Maintenance

### Обновление приложения

```bash
# Пулинг изменений
git pull origin main

# Пересборка и перезапуск
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Бэкап базы данных

```bash
# Создание бэкапа
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U callcentre_user callcentre_crm > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U callcentre_user callcentre_crm < backup_file.sql
```

## 🚨 Troubleshooting

### Проблема: 502 Bad Gateway

**Решения:**
1. Проверьте статус контейнеров: `docker-compose ps`
2. Проверьте логи: `docker-compose logs backend`
3. Проверьте конфигурацию Nginx: `sudo nginx -t`

### Проблема: SSL сертификат недействителен

**Решения:**
1. Проверьте сроки действия: `openssl x509 -in /etc/ssl/certs/callcentre/certificate.crt -noout -dates`
2. Обновите сертификаты: `/usr/local/bin/renew-callcentre-ssl.sh`
3. Перезапустите Nginx: `sudo systemctl restart nginx`

### Проблема: CORS ошибки

**Решения:**
1. Проверьте FRONTEND_URL в backend .env
2. Убедитесь что домены добавлены в allowedOrigins
3. Проверьте Nginx headers для CORS

## 🎯 Финальная проверка

- [ ] Оба домена доступны по HTTPS
- [ ] HTTP редиректится на HTTPS
- [ ] SSL сертификаты валидны
- [ ] API health check отвечает 200
- [ ] Frontend загружается
- [ ] Авторизация работает
- [ ] CORS настроен правильно
- [ ] Логи пишутся корректно
- [ ] Автообновление SSL настроено

---

**🎉 Поздравляем! Call Centre CRM успешно развернут в продакшене!**

Доступ к приложению:
- **Frontend**: https://callcentre.lead-schem.ru
- **Backend API**: https://apikc.lead-schem.ru
- **Health Check**: https://apikc.lead-schem.ru/health
