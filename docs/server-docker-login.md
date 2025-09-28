# Авторизация Docker на сервере

## Способ 1: Авторизация на сервере (Самый простой)

### Подключись к серверу:
```bash
ssh root@92.51.22.226
```

### Авторизуйся в Docker Hub:
```bash
# Создай аккаунт на https://hub.docker.com (если нет)
# Затем выполни на сервере:
docker login

# Введи свой логин и пароль от Docker Hub
# Docker запомнит credentials и будет использовать их автоматически
```

### Проверь авторизацию:
```bash
docker info | grep Username
# Должно показать твой username, если авторизация прошла
```

## Способ 2: Через переменные окружения на сервере

```bash
# На сервере создай файл с credentials:
echo "your_docker_username" > ~/.docker_username
echo "your_docker_password" > ~/.docker_password

# Добавь в ~/.bashrc автологин:
echo 'cat ~/.docker_password | docker login -u $(cat ~/.docker_username) --password-stdin' >> ~/.bashrc
```

## Способ 3: Системный сервис для авторизации

```bash
# Создай systemd сервис для автологина:
sudo tee /etc/systemd/system/docker-login.service > /dev/null <<EOF
[Unit]
Description=Docker Hub Login
After=docker.service
Wants=docker.service

[Service]
Type=oneshot
ExecStart=/bin/bash -c 'echo "your_password" | docker login -u your_username --password-stdin'
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# Включи сервис:
sudo systemctl enable docker-login.service
sudo systemctl start docker-login.service
```

## Проверка лимитов

После авторизации проверь лимиты:
```bash
# Получи информацию о rate limits:
TOKEN=$(curl -s "https://auth.docker.io/token?service=registry.docker.io&scope=repository:ratelimitpreview/test:pull" | jq -r .token)
curl -H "Authorization: Bearer $TOKEN" https://registry-1.docker.io/v2/ratelimitpreview/test/manifests/latest -I

# В ответе будет:
# ratelimit-limit: 200;w=21600      (200 pulls за 6 часов)
# ratelimit-remaining: 199          (осталось pulls)
```

## Рекомендация

**Самый простой способ**:
1. Зарегистрируйся на https://hub.docker.com
2. Подключись к серверу: `ssh root@92.51.22.226`  
3. Выполни: `docker login`
4. Введи логин/пароль
5. Готово! Теперь Docker будет работать без лимитов

После этого можно повторить деплой из GitHub Actions.
