# Docker Rate Limit Solutions

## Проблема
```
failed to resolve source metadata for docker.io/library/node/manifests/sha256:...: 429 Too Many Requests
toomanyrequests: You have reached your unauthenticated pull rate limit
```

## Решения

### 1. 🏆 Рекомендуемое: Аутентификация в Docker Hub

#### Шаг 1: Создать аккаунт Docker Hub
- Перейти на https://hub.docker.com/
- Зарегистрироваться (бесплатно)

#### Шаг 2: Добавить credentials в GitHub Secrets
```bash
# Перейти в настройки репозитория:
# https://github.com/jes11sy/callcentre/settings/secrets/actions

# Добавить секреты:
DOCKER_USERNAME=your_docker_hub_username
DOCKER_PASSWORD=your_docker_hub_password
```

#### Шаг 3: Лимиты после авторизации
- **Бесплатный аккаунт**: 200 pulls за 6 часов
- **Pro аккаунт ($5/месяц)**: без ограничений

### 2. 🔄 Альтернативные Docker Registry

#### GitHub Container Registry
```dockerfile
# В Dockerfile заменить:
FROM ghcr.io/library/node:18-alpine
FROM ghcr.io/library/nginx:alpine
FROM ghcr.io/library/redis:7-alpine
```

#### Yandex Container Registry
```dockerfile
FROM cr.yandex/mirror/node:18-alpine
FROM cr.yandex/mirror/nginx:alpine
FROM cr.yandex/mirror/redis:7-alpine
```

### 3. 🏠 Локальная сборка образов

#### На сервере:
```bash
# Создать свои образы
docker build -t my-node:18-alpine .
docker build -t my-nginx:alpine .

# Использовать в docker-compose.yml
services:
  backend:
    image: my-node:18-alpine
```

### 4. 💾 Docker Layer Caching

#### Оптимизация Dockerfile:
```dockerfile
# Кешировать зависимости отдельно
COPY package*.json ./
RUN npm ci --only=production

# Кешировать Prisma генерацию
COPY prisma ./prisma/
RUN npx prisma generate

# Только потом копировать код
COPY . .
```

### 5. 📦 Использование Docker Buildx с кешем

```bash
# Включить buildx
docker buildx create --use

# Сборка с кешем
docker buildx build --cache-from=type=gha --cache-to=type=gha .
```

### 6. ⏰ Retry механизм

```bash
# В CI/CD добавить retry:
for i in {1..3}; do
  docker-compose up -d --build && break
  echo "Retry $i failed, waiting 60 seconds..."
  sleep 60
done
```

## Текущая настройка в проекте

Workflow уже настроен для автоматической авторизации:
- Если есть `DOCKER_USERNAME` и `DOCKER_PASSWORD` - авторизация
- Если нет - работает без авторизации (с лимитами)

## Рекомендация

**Самое простое решение**: добавить Docker Hub credentials в GitHub Secrets.
Это решит проблему на 99% случаев и не требует изменения кода.
