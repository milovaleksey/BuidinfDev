# 🌐 Доступ к системе по сети

## ✅ Текущая настройка

Система автоматически определяет API URL по адресу браузера:

| Открыто в браузере | API будет использовать |
|-------------------|------------------------|
| `http://192.168.1.100:5173` | `http://192.168.1.100:8080/api` |
| `http://localhost:5173` | `http://localhost:8080/api` |
| `http://10.0.0.50:5173` | `http://10.0.0.50:8080/api` |

**Вам НЕ нужно** ничего настраивать! Просто откройте фронтенд по IP-адресу.

---

## 🚀 Быстрый старт

### 1. Узнайте IP-адрес сервера

```bash
hostname -I | awk '{print $1}'
```

Пример вывода: `192.168.1.100`

### 2. Убедитесь, что сервисы запущены

```bash
# Проверка бэкенда
curl http://localhost:8080/api/auth/health

# Проверка фронтенда
curl http://localhost:5173
```

### 3. Откройте в браузере (с любого устройства в сети)

```
http://192.168.1.100:5173
```

Замените `192.168.1.100` на ваш реальный IP!

---

## 🔍 Проверка доступности

### Проверить с самого сервера

```bash
# Узнать IP
MY_IP=$(hostname -I | awk '{print $1}')

# Проверить фронтенд
curl http://$MY_IP:5173

# Проверить бэкенд
curl http://$MY_IP:8080/api/auth/health
```

### Проверить с другого устройства

На другом компьютере/телефоне в той же сети:

```bash
# Замените на IP вашего сервера
curl http://192.168.1.100:5173
curl http://192.168.1.100:8080/api/auth/health
```

---

## 🛠️ Устранение проблем

### Проблема: Не открывается страница

**1. Проверьте, запущен ли фронтенд:**

```bash
ps aux | grep vite
```

Если не запущен:

```bash
./start-frontend.sh
```

**2. Проверьте, слушает ли Vite на всех интерфейсах:**

```bash
netstat -tuln | grep 5173
```

Должно быть: `0.0.0.0:5173` (не `127.0.0.1:5173`)

Если `127.0.0.1`, проверьте `vite.config.ts`:

```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
}
```

**3. Проверьте firewall:**

```bash
sudo ufw status
```

Если активен, разрешите порты:

```bash
sudo ufw allow 5173/tcp
sudo ufw allow 8080/tcp
```

---

### Проблема: Страница открывается, но ошибка "Network Error" при авторизации

**1. Проверьте консоль браузера (F12):**

Ищите сообщение типа:
```
POST http://localhost:8080/api/auth/login net::ERR_CONNECTION_REFUSED
```

Если видите `localhost` - значит фронтенд открыт через `http://localhost:5173`

**Решение:** Открывайте через IP-адрес, не через localhost!

```
❌ http://localhost:5173
✅ http://192.168.1.100:5173
```

**2. Проверьте, что бэкенд слушает на всех интерфейсах:**

```bash
netstat -tuln | grep 8080
```

Должно быть: `0.0.0.0:8080`

Если нет, проверьте `backend/src/main/resources/application.properties`:

```properties
server.address=0.0.0.0
```

**3. Проверьте CORS настройки:**

В `application.properties` должно быть:

```properties
cors.allowed.origins=*
```

---

### Проблема: Разные устройства в сети не могут подключиться

**1. Проверьте, что устройства в одной подсети:**

На сервере:

```bash
ip addr show | grep "inet "
```

На клиенте (Windows):

```cmd
ipconfig
```

На клиенте (Linux/Mac):

```bash
ifconfig
```

Первые 3 числа IP должны совпадать (например, `192.168.1.x`)

**2. Проверьте ping:**

С клиента пропингуйте сервер:

```bash
ping 192.168.1.100
```

Если не пингуется - проблема в сети/firewall.

**3. Проверьте порты telnet/nc:**

```bash
# Linux/Mac
nc -zv 192.168.1.100 5173
nc -zv 192.168.1.100 8080

# Windows
Test-NetConnection -ComputerName 192.168.1.100 -Port 5173
Test-NetConnection -ComputerName 192.168.1.100 -Port 8080
```

---

## 🔐 Учетные данные

После загрузки демо-данных (`init-data.sql`):

| Логин    | Пароль   | Роль     |
|----------|----------|----------|
| admin    | password | ADMIN    |
| manager  | password | MANAGER  |
| operator | password | OPERATOR |
| viewer   | password | VIEWER   |

---

## 📱 Доступ с мобильных устройств

1. Убедитесь, что телефон/планшет в той же WiFi сети
2. Откройте браузер
3. Введите: `http://192.168.1.100:5173` (замените на ваш IP)

---

## 🔧 Дополнительные настройки

### Фиксированный API URL (если нужно)

Создайте файл `.env`:

```bash
cat > .env << 'EOF'
VITE_API_URL=http://192.168.1.100:8080/api
EOF
```

Перезапустите фронтенд.

### Изменить порт фронтенда

В `vite.config.ts`:

```typescript
server: {
  host: '0.0.0.0',
  port: 3000, // Измените на нужный
}
```

### Изменить порт бэкенда

В `backend/src/main/resources/application.properties`:

```properties
server.port=9090
```

Не забудьте обновить `.env`:

```
VITE_API_URL=http://192.168.1.100:9090/api
```

---

## 📊 Мониторинг

### Логи фронтенда

Смотрите в терминале, где запущен `./start-frontend.sh`

### Логи бэкенда

```bash
tail -f backend/logs/application.log
```

Или в терминале, где запущен `./start.sh`

---

## 🎯 Быстрая проверка всей системы

```bash
#!/bin/bash
MY_IP=$(hostname -I | awk '{print $1}')

echo "🔍 Проверка системы..."
echo "📍 IP сервера: $MY_IP"
echo ""

echo "Frontend (5173):"
curl -s http://$MY_IP:5173 > /dev/null && echo "✅ OK" || echo "❌ FAIL"

echo "Backend (8080):"
curl -s http://$MY_IP:8080/api/auth/health > /dev/null && echo "✅ OK" || echo "❌ FAIL"

echo ""
echo "🌐 Откройте в браузере:"
echo "   http://$MY_IP:5173"
```

Сохраните как `check-system.sh`, сделайте исполняемым и запустите:

```bash
chmod +x check-system.sh
./check-system.sh
```
