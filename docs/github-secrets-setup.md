# 🔐 GitHub Secrets Setup Guide - Call Centre CRM

## 📋 Обзор

Данное руководство описывает настройку GitHub Secrets для безопасного CI/CD развертывания Call Centre CRM без использования .env файлов в репозитории.

## 🎯 Преимущества GitHub Secrets

- ✅ **Безопасность**: Секреты зашифрованы и доступны только во время выполнения
- ✅ **Аудит**: История использования секретов отслеживается
- ✅ **Гибкость**: Разные значения для staging и production
- ✅ **Централизованность**: Все секреты в одном месте
- ✅ **Командная работа**: Безопасное разделение секретов между разработчиками

## 🔧 Настройка GitHub Secrets

### 1. Доступ к настройкам

1. Перейдите в ваш GitHub репозиторий
2. Откройте **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**

### 2. Production Secrets

#### 🗃️ База данных
```
DATABASE_URL
postgresql://callcentre_user:SECURE_PASSWORD@postgres:5432/callcentre_crm

POSTGRES_USER
callcentre_user

POSTGRES_PASSWORD
SECURE_DB_PASSWORD_HERE

POSTGRES_DB
callcentre_crm

REDIS_URL
redis://redis:6379
```

#### 🔑 Аутентификация
```
JWT_SECRET
super_secure_jwt_secret_minimum_32_characters_long

JWT_EXPIRES_IN
7d
```

#### 🏢 Mango Office API
```
MANGO_OFFICE_API_KEY
your_production_mango_api_key

MANGO_OFFICE_API_SALT
your_production_mango_api_salt

MANGO_API_KEY
your_production_mango_key

MANGO_API_ID
your_production_mango_id
```

#### 🏠 Avito API
```
AVITO_CLIENT_ID
your_production_avito_client_id

AVITO_CLIENT_SECRET
your_production_avito_client_secret
```

#### 🤖 Bot Integration
```
BOT_WEBHOOK_URL
http://your-bot-server:3001

WEBHOOK_TOKEN
your_webhook_secret_token
```

#### 🚀 Production Server
```
PRODUCTION_HOST
your.production.server.ip

PRODUCTION_USERNAME
your_ssh_username

PRODUCTION_SSH_KEY
-----BEGIN OPENSSH PRIVATE KEY-----
your_private_ssh_key_content_here
-----END OPENSSH PRIVATE KEY-----

PRODUCTION_SSH_PORT
22
```

### 3. Staging Secrets

#### 🗃️ Staging Database
```
STAGING_DATABASE_URL
postgresql://staging_user:STAGING_PASSWORD@postgres:5432/staging_db

STAGING_POSTGRES_USER
staging_user

STAGING_POSTGRES_PASSWORD
STAGING_DB_PASSWORD_HERE

STAGING_POSTGRES_DB
staging_db

STAGING_REDIS_URL
redis://:STAGING_REDIS_PASSWORD@redis:6379

STAGING_REDIS_PASSWORD
staging_redis_password
```

#### 🔑 Staging Authentication
```
STAGING_JWT_SECRET
staging_jwt_secret_different_from_production
```

#### 🏢 Staging Mango Office
```
STAGING_MANGO_OFFICE_API_KEY
test_mango_api_key

STAGING_MANGO_OFFICE_API_SALT
test_mango_api_salt

STAGING_MANGO_API_KEY
test_mango_key

STAGING_MANGO_API_ID
test_mango_id
```

#### 🏠 Staging Avito
```
STAGING_AVITO_CLIENT_ID
test_avito_client_id

STAGING_AVITO_CLIENT_SECRET
test_avito_client_secret
```

#### 🚀 Staging Server
```
STAGING_HOST
your.staging.server.ip

STAGING_USERNAME
staging_ssh_username

STAGING_SSH_KEY
-----BEGIN OPENSSH PRIVATE KEY-----
staging_private_ssh_key_content
-----END OPENSSH PRIVATE KEY-----

STAGING_SSH_PORT
22
```

### 4. Notification Secrets

#### 📧 Telegram Notifications
```
TELEGRAM_BOT_TOKEN
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

TELEGRAM_CHAT_ID
-1001234567890
```

#### 🛡️ Security Scanning
```
SNYK_TOKEN
your_snyk_api_token_for_security_scanning
```

## 📝 Environment-Specific Secrets

### Production Environment

```bash
# Создайте environment "production" в Settings → Environments
# Добавьте следующие secrets:

DATABASE_URL=postgresql://callcentre_user:PROD_PASSWORD@postgres:5432/callcentre_crm
JWT_SECRET=production_jwt_secret_32_chars_min
MANGO_OFFICE_API_KEY=prod_mango_key
AVITO_CLIENT_ID=prod_avito_id
PRODUCTION_HOST=123.456.789.012
```

### Staging Environment

```bash
# Создайте environment "staging" в Settings → Environments  
# Добавьте следующие secrets:

STAGING_DATABASE_URL=postgresql://staging_user:STAGING_PASSWORD@postgres:5432/staging_db
STAGING_JWT_SECRET=staging_jwt_secret_different
STAGING_MANGO_OFFICE_API_KEY=test_mango_key
STAGING_AVITO_CLIENT_ID=test_avito_id
STAGING_HOST=123.456.789.013
```

## 🔐 Генерация SSH ключей

### 1. Создание SSH ключей для развертывания

```bash
# Генерация SSH ключей
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Копирование публичного ключа на сервер
ssh-copy-id -i ~/.ssh/github_deploy.pub user@your-server.com

# Получение приватного ключа для GitHub Secret
cat ~/.ssh/github_deploy
```

### 2. Настройка SSH на сервере

```bash
# На продакшн сервере
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp /home/your-user/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Права на директорию проекта
sudo mkdir -p /opt/callcentre-crm
sudo chown deploy:deploy /opt/callcentre-crm

# Для staging
sudo mkdir -p /opt/callcentre-crm-staging
sudo chown deploy:deploy /opt/callcentre-crm-staging
```

## 📋 Полный список всех Secrets

### Repository Secrets

```bash
# Database
DATABASE_URL
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
REDIS_URL

# JWT
JWT_SECRET

# Mango Office
MANGO_OFFICE_API_KEY
MANGO_OFFICE_API_SALT
MANGO_API_KEY
MANGO_API_ID

# Avito
AVITO_CLIENT_ID
AVITO_CLIENT_SECRET

# Bot
BOT_WEBHOOK_URL
WEBHOOK_TOKEN

# Production Server
PRODUCTION_HOST
PRODUCTION_USERNAME
PRODUCTION_SSH_KEY
PRODUCTION_SSH_PORT

# Staging Database
STAGING_DATABASE_URL
STAGING_POSTGRES_USER
STAGING_POSTGRES_PASSWORD
STAGING_POSTGRES_DB
STAGING_REDIS_URL
STAGING_REDIS_PASSWORD

# Staging JWT
STAGING_JWT_SECRET

# Staging Mango Office
STAGING_MANGO_OFFICE_API_KEY
STAGING_MANGO_OFFICE_API_SALT
STAGING_MANGO_API_KEY
STAGING_MANGO_API_ID

# Staging Avito
STAGING_AVITO_CLIENT_ID
STAGING_AVITO_CLIENT_SECRET

# Staging Server
STAGING_HOST
STAGING_USERNAME
STAGING_SSH_KEY
STAGING_SSH_PORT

# Notifications
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID

# Security
SNYK_TOKEN
```

## 🛠️ Скрипт для массового добавления secrets

```bash
#!/bin/bash
# add-github-secrets.sh

REPO="your-username/callcentre_crm"

# Функция для добавления secret
add_secret() {
    local name=$1
    local value=$2
    echo "Adding secret: $name"
    gh secret set "$name" --body "$value" --repo "$REPO"
}

# Production secrets
add_secret "DATABASE_URL" "postgresql://callcentre_user:SECURE_PASSWORD@postgres:5432/callcentre_crm"
add_secret "JWT_SECRET" "your_super_secure_jwt_secret_here"
add_secret "MANGO_OFFICE_API_KEY" "your_mango_api_key"
# ... добавьте остальные secrets

echo "All secrets added successfully!"
```

## 🧪 Тестирование Secrets

### 1. Проверка в GitHub Actions

```yaml
# .github/workflows/test-secrets.yml
name: Test Secrets
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test Database URL
        run: |
          if [ -z "${{ secrets.DATABASE_URL }}" ]; then
            echo "❌ DATABASE_URL secret not set"
            exit 1
          else
            echo "✅ DATABASE_URL secret is set"
          fi
          
      - name: Test JWT Secret Length
        run: |
          if [ ${#JWT_SECRET} -lt 32 ]; then
            echo "❌ JWT_SECRET too short (minimum 32 characters)"
            exit 1
          else
            echo "✅ JWT_SECRET length is sufficient"
          fi
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### 2. Локальное тестирование

```bash
# Создание локального .env для тестирования
cat > .env.test << EOF
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/test_db
JWT_SECRET=test_jwt_secret_for_local_testing_only
EOF

# Запуск тестов
npm run test
```

## 🔄 Обновление Secrets

### 1. Ротация паролей

```bash
# Обновление JWT Secret
gh secret set JWT_SECRET --body "new_jwt_secret_32_characters_min" --repo your-username/callcentre_crm

# Обновление Database Password
gh secret set POSTGRES_PASSWORD --body "new_secure_password" --repo your-username/callcentre_crm
```

### 2. Автоматическое обновление

```yaml
# .github/workflows/rotate-secrets.yml
name: Rotate Secrets
on:
  schedule:
    - cron: '0 2 1 * *'  # Monthly on 1st at 2 AM

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate new JWT Secret
        run: |
          NEW_JWT=$(openssl rand -base64 48)
          gh secret set JWT_SECRET --body "$NEW_JWT" --repo ${{ github.repository }}
```

## 🚨 Troubleshooting

### Проблема: Secret не найден

**Решения:**
1. Проверьте правильность имени secret
2. Убедитесь что secret добавлен в правильный repository
3. Проверьте права доступа к repository

### Проблема: SSH подключение не работает

**Решения:**
1. Проверьте формат SSH ключа (включая заголовки)
2. Убедитесь что публичный ключ добавлен на сервер
3. Проверьте права доступа к файлам SSH

### Проблема: Environment secrets не работают

**Решения:**
1. Создайте environment в Settings → Environments
2. Добавьте secrets на уровне environment, не repository
3. Убедитесь что workflow указывает правильный environment

## 📚 Дополнительные ресурсы

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI for Secrets Management](https://cli.github.com/manual/gh_secret)
- [Best Practices for GitHub Actions Security](https://docs.github.com/en/actions/security-guides)

---

**🔐 Важно**: Никогда не коммитьте реальные секреты в репозиторий! Используйте только GitHub Secrets для хранения конфиденциальной информации.
