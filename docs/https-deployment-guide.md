# 🔒 HTTPS Deployment Guide - Call Centre CRM

## 📋 Обзор

Данное руководство описывает настройку HTTPS для Call Centre CRM в продакшен среде с использованием SSL/TLS сертификатов.

## 🏗️ Архитектура HTTPS

```
Internet → Nginx (HTTPS) → Backend (Node.js) → Database
                ↓
          Frontend (Next.js)
```

## 🚀 Быстрый старт

### 1. Подготовка SSL сертификатов

#### Вариант A: Let's Encrypt (Рекомендуется для продакшена)

```bash
# Установка Certbot
sudo apt update
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com

# Копирование сертификатов
sudo mkdir -p /etc/ssl/certs/callcentre
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /etc/ssl/certs/callcentre/certificate.crt
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /etc/ssl/certs/callcentre/private.key
sudo cp /etc/letsencrypt/live/your-domain.com/chain.pem /etc/ssl/certs/callcentre/ca_bundle.crt
```

#### Вариант B: Самоподписанный сертификат (Для разработки)

```bash
# Запуск скрипта генерации SSL
./scripts/generate-ssl.sh your-domain.com

# Выберите опцию 1 для самоподписанного сертификата
```

### 2. Настройка переменных окружения

Создайте файл `.env.production`:

```env
# SSL Configuration
SSL_ENABLED=true
SSL_CERT_DIR=/etc/ssl/certs/callcentre
HTTPS_PORT=443
HTTP_PORT=80
NODE_ENV=production

# Обязательно измените в продакшене!
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
```

### 3. Запуск с HTTPS

```bash
# Развертывание с Docker
docker-compose -f docker-compose.prod.yml up -d

# Или запуск без Docker
npm run build
npm run start:prod
```

## 🔧 Детальная настройка

### SSL конфигурация

Backend автоматически определяет наличие SSL сертификатов и настраивает HTTPS:

- **Продакшен** (`NODE_ENV=production`): HTTPS обязателен
- **Разработка**: HTTP с опциональным HTTPS

### Структура SSL файлов

```
/etc/ssl/certs/callcentre/
├── certificate.crt     # SSL сертификат
├── private.key         # Приватный ключ
└── ca_bundle.crt       # Цепочка сертификатов (опционально)
```

### Nginx конфигурация

Nginx автоматически настроен для:
- Redirect HTTP → HTTPS
- SSL best practices
- Security headers
- Rate limiting
- Gzip compression

### Безопасность

Автоматически применяются security headers:
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (CSP)
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`

## 🧪 Тестирование HTTPS

### 1. Проверка SSL сертификата

```bash
# Проверка сертификата
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Проверка срока действия
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 2. Тестирование редиректа

```bash
# HTTP должен перенаправлять на HTTPS
curl -I http://your-domain.com
# Ожидаем: 301 Moved Permanently, Location: https://your-domain.com
```

### 3. Онлайн инструменты

- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/

## 🔄 Автоматическое обновление Let's Encrypt

### Настройка автообновления

```bash
# Создание скрипта обновления
sudo crontab -e

# Добавить строку для ежемесячного обновления
0 2 1 * * certbot renew --quiet && systemctl reload nginx
```

### Скрипт обновления с Docker

```bash
#!/bin/bash
# /usr/local/bin/renew-ssl.sh

certbot renew --quiet
if [ $? -eq 0 ]; then
    # Копирование обновленных сертификатов
    cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /etc/ssl/certs/callcentre/certificate.crt
    cp /etc/letsencrypt/live/your-domain.com/privkey.pem /etc/ssl/certs/callcentre/private.key
    cp /etc/letsencrypt/live/your-domain.com/chain.pem /etc/ssl/certs/callcentre/ca_bundle.crt
    
    # Перезагрузка контейнеров
    docker-compose -f /path/to/docker-compose.prod.yml restart nginx backend
fi
```

## 🚨 Troubleshooting

### Проблема: "SSL certificates are required in production"

**Решение:**
1. Убедитесь что файлы сертификатов существуют
2. Проверьте пути в переменных окружения
3. Проверьте права доступа к файлам

```bash
ls -la /etc/ssl/certs/callcentre/
# Должны быть файлы certificate.crt и private.key
```

### Проблема: "ERR_CERT_AUTHORITY_INVALID"

**Для самоподписанных сертификатов:**
1. Добавьте исключение в браузере
2. Или добавьте сертификат в доверенные

**Для Let's Encrypt:**
1. Проверьте что домен правильно настроен
2. Убедитесь что сертификат не истек

### Проблема: Mixed content warnings

**Решение:**
1. Убедитесь что все ресурсы загружаются через HTTPS
2. Обновите настройки CSP
3. Проверьте конфигурацию Next.js

## 📊 Мониторинг SSL

### Логи

```bash
# Логи Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Логи приложения
tail -f backend/logs/combined.log
```

### Мониторинг истечения сертификата

```bash
#!/bin/bash
# Проверка срока действия сертификата
DOMAIN="your-domain.com"
EXPIRY_DATE=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt 30 ]; then
    echo "WARNING: SSL certificate expires in $DAYS_LEFT days!"
fi
```

## 🔐 Security Best Practices

### 1. Сертификат
- ✅ Используйте 2048-bit RSA или 256-bit ECDSA ключи
- ✅ Включите все поддомены в SAN
- ✅ Регулярно обновляйте сертификаты

### 2. TLS конфигурация
- ✅ Только TLS 1.2 и 1.3
- ✅ Сильные шифры
- ✅ HSTS с preload
- ✅ OCSP Stapling

### 3. Headers
- ✅ Content Security Policy
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff

### 4. Мониторинг
- ✅ Certificate Transparency logs
- ✅ Регулярные SSL тесты
- ✅ Alerting на истечение сертификатов

## 📚 Дополнительные ресурсы

- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OWASP HTTPS Guide](https://owasp.org/www-project-cheat-sheets/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**Примечание:** Данная конфигурация обеспечивает A+ рейтинг на SSL Labs тесте и соответствует современным стандартам безопасности.
