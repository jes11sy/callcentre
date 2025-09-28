# 🚀 CI/CD Guide - Call Centre CRM

## 📋 Обзор

Полная система непрерывной интеграции и развертывания (CI/CD) для Call Centre CRM с использованием GitHub Actions и GitHub Secrets для безопасного управления конфиденциальными данными.

## 🎯 Возможности CI/CD

### ✅ **Автоматическая интеграция**
- 🔍 **Линтинг и типизация** - ESLint, TypeScript проверки
- 🧪 **Тестирование** - Unit tests, integration tests
- 🔐 **Безопасность** - Snyk сканирование уязвимостей
- 🐳 **Docker build** - Проверка сборки контейнеров

### ✅ **Автоматическое развертывание**
- 🏭 **Production** - автоматически с main/master ветки
- 🧪 **Staging** - автоматически с pull requests
- 🔧 **Manual deploy** - ручное развертывание с выбором окружения

### ✅ **Безопасность**
- 🔐 **GitHub Secrets** - все чувствительные данные зашифрованы
- 🔑 **SSH развертывание** - безопасное подключение к серверам
- 🛡️ **Environment protection** - защита продакшена

## 📁 Структура CI/CD файлов

```
.github/
├── workflows/
│   ├── deploy.yml           # Основной CI/CD workflow
│   └── manual-deploy.yml    # Ручное развертывание
scripts/
├── deploy-staging.sh        # Скрипт развертывания staging
├── setup-github-secrets.sh  # Настройка GitHub Secrets
└── generate-ssl-domains.sh  # Генерация SSL сертификатов
config/
└── nginx/
    └── staging.conf         # Nginx конфигурация для staging
docker-compose.staging.yml   # Docker Compose для staging
curl-format.txt             # Формат для performance тестов
```

## 🔄 Workflow процессы

### 1. **Main Deploy Workflow** (`.github/workflows/deploy.yml`)

#### **Триггеры:**
- Push в `main`/`master` ветку → Production deploy
- Pull Request → Staging deploy
- Manual trigger → Выбор окружения

#### **Jobs:**
1. **🏗️ Build and Test**
   - Установка зависимостей
   - TypeScript проверки
   - ESLint проверки
   - Docker build тест

2. **🔐 Security Scan**
   - npm audit
   - Snyk security scan

3. **🧪 Deploy Staging** (только PR)
   - SSH подключение к staging серверу
   - Выполнение `deploy-staging.sh`

4. **🏭 Deploy Production** (только main)
   - Создание .env файлов из GitHub Secrets
   - SSH подключение к production серверу
   - Docker Compose развертывание
   - Health checks
   - Telegram уведомления

5. **✅ Post-Deploy Tests**
   - Smoke tests
   - Performance tests
   - Security headers проверка

### 2. **Manual Deploy Workflow** (`.github/workflows/manual-deploy.yml`)

#### **Параметры:**
- **Environment**: staging / production
- **Skip tests**: true / false
- **Force rebuild**: true / false

## 🔐 GitHub Secrets конфигурация

### **Production Secrets**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
POSTGRES_USER=callcentre_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=callcentre_crm
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=super_secure_jwt_secret_32_chars_min

# External APIs
MANGO_OFFICE_API_KEY=prod_mango_key
MANGO_OFFICE_API_SALT=prod_mango_salt
AVITO_CLIENT_ID=prod_avito_id
AVITO_CLIENT_SECRET=prod_avito_secret

# Server Access
PRODUCTION_HOST=123.456.789.012
PRODUCTION_USERNAME=deploy
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
PRODUCTION_SSH_PORT=22
```

### **Staging Secrets**
```bash
# Все аналогично production, но с префиксом STAGING_
STAGING_DATABASE_URL=...
STAGING_JWT_SECRET=...
STAGING_HOST=...
# и т.д.
```

### **Notification Secrets**
```bash
TELEGRAM_BOT_TOKEN=bot_token_for_notifications
TELEGRAM_CHAT_ID=chat_id_for_notifications
SNYK_TOKEN=snyk_token_for_security_scans
```

## 🚀 Настройка CI/CD

### **Шаг 1: Настройка GitHub Secrets**

```bash
# Автоматическая настройка с помощью скрипта
chmod +x scripts/setup-github-secrets.sh
./scripts/setup-github-secrets.sh --repo your-username/callcentre_crm

# Или ручная настройка через GitHub UI
# Settings → Secrets and variables → Actions → New repository secret
```

### **Шаг 2: Настройка серверов**

#### **Production сервер:**
```bash
# Создание пользователя для развертывания
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Настройка SSH
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Директория проекта
sudo mkdir -p /opt/callcentre-crm
sudo chown deploy:deploy /opt/callcentre-crm

# Клонирование репозитория
su - deploy
cd /opt/callcentre-crm
git clone https://github.com/your-username/callcentre_crm.git .
```

#### **Staging сервер:**
```bash
# Аналогично production, но в директории /opt/callcentre-crm-staging
sudo mkdir -p /opt/callcentre-crm-staging
sudo chown deploy:deploy /opt/callcentre-crm-staging
```

### **Шаг 3: SSL сертификаты**

```bash
# На серверах настройте SSL сертификаты
sudo mkdir -p /etc/ssl/certs/callcentre

# Let's Encrypt для продакшена
sudo certbot certonly --standalone \
  -d apikc.lead-schem.ru \
  -d callcentre.lead-schem.ru

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/apikc.lead-schem.ru/fullchain.pem /etc/ssl/certs/callcentre/certificate.crt
sudo cp /etc/letsencrypt/live/apikc.lead-schem.ru/privkey.pem /etc/ssl/certs/callcentre/private.key
```

## 🧪 Тестирование CI/CD

### **1. Тест Pull Request**
```bash
# Создайте feature ветку
git checkout -b feature/test-cicd
git push origin feature/test-cicd

# Создайте Pull Request
# GitHub Actions автоматически запустит staging deploy
```

### **2. Тест Production Deploy**
```bash
# Merge в main ветку
git checkout main
git merge feature/test-cicd
git push origin main

# GitHub Actions автоматически развернет в production
```

### **3. Manual Deploy тест**
```bash
# В GitHub UI: Actions → Manual Deploy → Run workflow
# Выберите environment и параметры
```

## 📊 Мониторинг развертывания

### **GitHub Actions Dashboard**
- **Workflow runs**: https://github.com/your-repo/actions
- **Секреты**: https://github.com/your-repo/settings/secrets/actions
- **Environments**: https://github.com/your-repo/settings/environments

### **Логи развертывания**
```bash
# На сервере
tail -f /var/log/callcentre/deployments.log
tail -f /var/log/callcentre/staging-deploy.log

# Docker логи
docker-compose logs -f backend
docker-compose logs -f frontend
```

### **Health Checks**
```bash
# Production
curl https://apikc.lead-schem.ru/health
curl https://callcentre.lead-schem.ru

# Staging  
curl https://staging-api.lead-schem.ru/health
curl https://staging.callcentre.lead-schem.ru
```

## 🔧 Кастомизация workflows

### **Добавление новых тестов**
```yaml
# В .github/workflows/deploy.yml
- name: 🧪 Custom Tests
  working-directory: ./backend
  run: |
    npm run test:integration
    npm run test:e2e
```

### **Добавление Environment Variables**
```yaml
# В job environment
environment:
  name: production
  CUSTOM_VAR: ${{ secrets.CUSTOM_SECRET }}
```

### **Добавление условий развертывания**
```yaml
# Развертывание только с определенными labels
if: contains(github.event.pull_request.labels.*.name, 'deploy')
```

## 🚨 Troubleshooting

### **Проблема: SSH подключение не работает**
**Решения:**
1. Проверьте SSH ключ в GitHub Secrets
2. Убедитесь что публичный ключ на сервере
3. Проверьте права доступа (600 для приватного ключа)

### **Проблема: Docker build fails**
**Решения:**
1. Проверьте Dockerfile синтаксис
2. Убедитесь что все зависимости установлены
3. Проверьте свободное место на диске

### **Проблема: Secrets не найдены**
**Решения:**
1. Проверьте имена secrets (case-sensitive)
2. Убедитесь что secrets добавлены в правильный repository
3. Проверьте environment settings

### **Проблема: Health check fails**
**Решения:**
1. Проверьте что все сервисы запущены
2. Убедитесь что порты доступны
3. Проверьте SSL сертификаты

## 📈 Оптимизация CI/CD

### **Ускорение builds**
```yaml
# Кэширование зависимостей
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# Параллельные jobs
jobs:
  frontend-test:
    # ...
  backend-test:
    # ...
```

### **Уменьшение времени развертывания**
```bash
# Предварительно собранные образы
docker build --cache-from previous-image
docker-compose pull  # Использование готовых образов
```

## 📚 Дополнительные ресурсы

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets Best Practices](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Docker Compose in Production](https://docs.docker.com/compose/production/)
- [SSL с Let's Encrypt](https://letsencrypt.org/getting-started/)

---

**🎉 Успешное внедрение CI/CD значительно ускорит разработку и повысит качество развертываний Call Centre CRM!**
