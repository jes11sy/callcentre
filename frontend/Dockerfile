# Dockerfile для frontend
FROM node:18-alpine AS base

# Установка зависимостей только при изменении package.json
FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Переменные окружения для сборки
ENV NEXT_PUBLIC_API_URL=https://apikc.lead-schem.ru
ENV NEXT_PUBLIC_SOCKET_URL=wss://apikc.lead-schem.ru

RUN npm run build

# Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Копируем статические файлы
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
