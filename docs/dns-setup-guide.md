# 🌐 DNS Setup Guide - Call Centre CRM

## 📋 Обзор

Данное руководство описывает настройку DNS записей для доменов Call Centre CRM:
- **Backend API**: `apikc.lead-schem.ru`
- **Frontend**: `callcentre.lead-schem.ru`

## 🎯 Требуемые DNS записи

### A записи (IPv4)

```dns
; Основные домены
apikc.lead-schem.ru.        IN A    YOUR_SERVER_IP
callcentre.lead-schem.ru.   IN A    YOUR_SERVER_IP

; Опционально: www редиректы
www.callcentre.lead-schem.ru. IN CNAME callcentre.lead-schem.ru.
```

### AAAA записи (IPv6, если используется)

```dns
apikc.lead-schem.ru.        IN AAAA YOUR_SERVER_IPv6
callcentre.lead-schem.ru.   IN AAAA YOUR_SERVER_IPv6
```

### CNAME записи (альтернативный вариант)

Если используется CDN или load balancer:

```dns
apikc.lead-schem.ru.        IN CNAME your-server.provider.com.
callcentre.lead-schem.ru.   IN CNAME your-server.provider.com.
```

## 🔧 Настройка DNS провайдеров

### Cloudflare

1. Войдите в панель управления Cloudflare
2. Выберите домен `lead-schem.ru`
3. Перейдите в раздел **DNS** → **Records**
4. Добавьте записи:

```
Type: A
Name: apikc
Content: YOUR_SERVER_IP
Proxy status: DNS only (серый облачок)
TTL: Auto

Type: A  
Name: callcentre
Content: YOUR_SERVER_IP
Proxy status: DNS only (серый облачок)
TTL: Auto
```

**Важно**: Для SSL сертификатов отключите Cloudflare Proxy (серый облачок)

### Route 53 (AWS)

1. Войдите в AWS Console → Route 53
2. Выберите hosted zone `lead-schem.ru`
3. Создайте записи:

```json
{
    "Name": "apikc.lead-schem.ru",
    "Type": "A",
    "TTL": 300,
    "ResourceRecords": [
        {
            "Value": "YOUR_SERVER_IP"
        }
    ]
}

{
    "Name": "callcentre.lead-schem.ru", 
    "Type": "A",
    "TTL": 300,
    "ResourceRecords": [
        {
            "Value": "YOUR_SERVER_IP"
        }
    ]
}
```

### Google Cloud DNS

```bash
# Создание A записей
gcloud dns record-sets transaction start --zone=lead-schem-ru

gcloud dns record-sets transaction add YOUR_SERVER_IP \
    --name=apikc.lead-schem.ru. \
    --ttl=300 \
    --type=A \
    --zone=lead-schem-ru

gcloud dns record-sets transaction add YOUR_SERVER_IP \
    --name=callcentre.lead-schem.ru. \
    --ttl=300 \
    --type=A \
    --zone=lead-schem-ru

gcloud dns record-sets transaction execute --zone=lead-schem-ru
```

### Другие провайдеры

Создайте аналогичные A записи в панели управления вашего DNS провайдера.

## 🧪 Проверка DNS

### Команды для проверки

```bash
# Проверка A записей
nslookup apikc.lead-schem.ru
nslookup callcentre.lead-schem.ru

# Проверка через dig
dig apikc.lead-schem.ru A
dig callcentre.lead-schem.ru A

# Проверка распространения DNS
dig @8.8.8.8 apikc.lead-schem.ru A
dig @1.1.1.1 callcentre.lead-schem.ru A
```

### Онлайн инструменты

- **DNS Checker**: https://dnschecker.org/
- **What's My DNS**: https://www.whatsmydns.net/
- **DNS Propagation**: https://dnspropagation.net/

### Ожидаемые результаты

```bash
$ nslookup apikc.lead-schem.ru
Server:    8.8.8.8
Address:   8.8.8.8#53

Non-authoritative answer:
Name:    apikc.lead-schem.ru
Address: YOUR_SERVER_IP

$ nslookup callcentre.lead-schem.ru  
Server:    8.8.8.8
Address:   8.8.8.8#53

Non-authoritative answer:
Name:    callcentre.lead-schem.ru
Address: YOUR_SERVER_IP
```

## ⏱️ Время распространения DNS

- **TTL 300 секунд**: ~5 минут
- **Большинство провайдеров**: 15-60 минут
- **Полное распространение**: до 48 часов

## 🔒 SSL сертификаты

### Let's Encrypt с DNS валидацией

```bash
# Wildcard сертификат для *.lead-schem.ru
sudo certbot certonly \
    --manual \
    --preferred-challenges=dns \
    -d '*.lead-schem.ru' \
    -d 'lead-schem.ru'
```

### Let's Encrypt с HTTP валидацией

```bash
# Отдельные сертификаты для каждого домена
sudo certbot certonly \
    --standalone \
    -d apikc.lead-schem.ru \
    -d callcentre.lead-schem.ru
```

## 🚀 Развертывание

### 1. Проверьте DNS

```bash
# Запустите скрипт проверки доменов
./scripts/generate-ssl-domains.sh
# Выберите опцию 4: Test domain configuration
```

### 2. Настройте SSL

```bash
# Для продакшена с Let's Encrypt
./scripts/generate-ssl-domains.sh
# Выберите опцию 2: Prepare for Let's Encrypt certificates

# Для разработки с самоподписанным сертификатом
./scripts/generate-ssl-domains.sh  
# Выберите опцию 1: Wildcard self-signed certificate
```

### 3. Обновите конфигурацию

```bash
# Скопируйте настройки из ssl/domains.env в ваши .env файлы
cp ssl/domains.env backend/.env.production
# Отредактируйте и добавьте недостающие переменные
```

## 🔧 Nginx конфигурация

Убедитесь что в `/etc/nginx/sites-available/callcentre-crm` указаны правильные домены:

```nginx
server_name apikc.lead-schem.ru;        # Backend API
server_name callcentre.lead-schem.ru;   # Frontend
```

## 📊 Мониторинг

### Health Check endpoints

- **Backend**: https://apikc.lead-schem.ru/health
- **Frontend**: https://callcentre.lead-schem.ru/

### Автоматическая проверка

```bash
#!/bin/bash
# check-domains.sh - Скрипт мониторинга доменов

BACKEND_DOMAIN="apikc.lead-schem.ru"
FRONTEND_DOMAIN="callcentre.lead-schem.ru"

# Проверка DNS
echo "Checking DNS resolution..."
nslookup $BACKEND_DOMAIN
nslookup $FRONTEND_DOMAIN

# Проверка HTTPS
echo "Checking HTTPS endpoints..."
curl -I https://$BACKEND_DOMAIN/health
curl -I https://$FRONTEND_DOMAIN/

# Проверка SSL сертификатов
echo "Checking SSL certificates..."
echo | openssl s_client -connect $BACKEND_DOMAIN:443 -servername $BACKEND_DOMAIN 2>/dev/null | openssl x509 -noout -dates
echo | openssl s_client -connect $FRONTEND_DOMAIN:443 -servername $FRONTEND_DOMAIN 2>/dev/null | openssl x509 -noout -dates
```

## 🚨 Troubleshooting

### Проблема: DNS не резолвится

**Решения:**
1. Проверьте правильность записей в DNS провайдере
2. Дождитесь распространения DNS (до 48 часов)
3. Проверьте TTL значения
4. Очистите DNS кеш локально: `ipconfig /flushdns` (Windows) или `sudo systemctl flush-dns` (Linux)

### Проблема: SSL сертификат не работает

**Решения:**
1. Убедитесь что DNS резолвится корректно
2. Проверьте что домены указаны в Subject Alternative Names сертификата
3. Для Let's Encrypt убедитесь что порты 80/443 доступны

### Проблема: CORS ошибки

**Решения:**
1. Проверьте что FRONTEND_URL в backend .env указывает на правильный домен
2. Убедитесь что домены добавлены в allowedOrigins в backend/src/index.ts

## 📝 Чек-лист развертывания

- [ ] DNS записи созданы и распространились
- [ ] SSL сертификаты получены и установлены  
- [ ] Nginx конфигурация обновлена с правильными доменами
- [ ] Backend .env содержит правильные FRONTEND_URL и домены
- [ ] Frontend .env содержит правильный NEXT_PUBLIC_API_URL
- [ ] Health check endpoints отвечают
- [ ] HTTPS редиректы работают
- [ ] CORS настроен правильно
- [ ] Mango Office webhook URL обновлен

---

**Важно**: После изменения DNS записей обязательно дождитесь их распространения перед получением SSL сертификатов!
