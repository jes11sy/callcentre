# Dockerfile для backend
# Try alternative registries to avoid Docker Hub rate limits
FROM node:18-alpine

# Устанавливаем OpenSSL для Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем ВСЕ зависимости для сборки
RUN npm ci

# Генерируем Prisma клиент
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Удаляем dev зависимости после сборки
RUN npm ci --only=production && npm cache clean --force

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Создаем директории для логов и загрузок
RUN mkdir -p logs uploads/recordings
RUN chown -R nodeuser:nodejs logs uploads

USER nodeuser

EXPOSE 5000

# Команда для запуска
CMD ["npm", "start"]
