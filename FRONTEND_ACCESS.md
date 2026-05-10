# 🌐 Настройка внешнего доступа к Frontend

## Проблема
Frontend запущен на виртуалке, но недоступен по внешнему IP адресу.

## Решение

### 1. Остановить текущий процесс (если запущен)

```bash
# Нажать Ctrl+C в терминале где запущен frontend
# Или найти и убить процесс
ps aux | grep vite
kill -9 <PID>
```

### 2. Запустить frontend с флагом --host

**Вариант А: Через скрипт (рекомендуется)**
```bash
cd ~/building-management
chmod +x start-frontend.sh
./start-frontend.sh
```

**Вариант Б: Вручную**
```bash
cd ~/building-management
pnpm run dev
```

**Вариант В: Прямая команда**
```bash
cd ~/building-management
pnpm vite --host 0.0.0.0
```

### 3. Проверить вывод

Должно показать:
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://10.81.0.60:5173/
```

**Network** адрес - это адрес для доступа извне!

### 4. Проверить Firewall

```bash
# Проверить статус
sudo ufw status

# Если порт 5173 не открыт:
sudo ufw allow 5173/tcp
sudo ufw reload

# Проверить снова
sudo ufw status numbered
```

Должна быть строка:
```
5173                       ALLOW IN    Anywhere
```

### 5. Проверить что порт слушает 0.0.0.0

```bash
sudo netstat -tulpn | grep 5173
```

Должно быть:
```
tcp        0      0 0.0.0.0:5173            0.0.0.0:*               LISTEN      <PID>/node
```

**Важно:** Должно быть `0.0.0.0:5173`, а НЕ `127.0.0.1:5173`

Если видите `127.0.0.1:5173` - значит Vite слушает только localhost.

### 6. Открыть в браузере

```
http://10.81.0.60:5173
```

(Замените 10.81.0.60 на IP вашей виртуалки)

## Траблшутинг

### Не работает после всех шагов

#### 1. Проверить Backend
```bash
curl http://localhost:8080/api/auth/health
```

Должен вернуть JSON. Если нет - сначала запустите backend.

#### 2. Проверить CORS в backend

```bash
cat ~/building-management/backend/src/main/resources/application.properties | grep cors
```

Должно быть:
```
cors.allowed.origins=http://localhost:5173,http://10.81.0.60:5173
```

Если нет вашего IP - добавьте:
```bash
nano ~/building-management/backend/src/main/resources/application.properties
```

Изменить на:
```properties
cors.allowed.origins=http://localhost:5173,http://10.81.0.60:5173,http://YOUR_VM_IP:5173
```

Перезапустить backend.

#### 3. Проверить роутер/сеть

Если виртуалка за NAT или файрволом:

```bash
# Проверить что порт открыт на виртуалке
nc -zv 10.81.0.60 5173

# Или с другой машины в сети
telnet 10.81.0.60 5173
```

Если не подключается - проблема в сетевой конфигурации (NAT, firewall роутера, и т.д.)

#### 4. Временно отключить firewall для теста

```bash
# ТОЛЬКО ДЛЯ ТЕСТА!
sudo ufw disable

# Попробовать подключиться
# ...

# Включить обратно
sudo ufw enable
```

### Альтернатива: SSH Туннель

Если внешний доступ заблокирован сетью, используйте SSH туннель:

```bash
# На вашей локальной машине
ssh -L 5173:localhost:5173 srvadmin@10.81.0.60

# Теперь на локальной машине откройте:
# http://localhost:5173
```

Backend туннель:
```bash
ssh -L 8080:localhost:8080 -L 5173:localhost:5173 srvadmin@10.81.0.60
```

## Постоянный доступ

### Вариант 1: Screen (простой)

```bash
# Запустить frontend в screen
screen -S frontend
cd ~/building-management
./start-frontend.sh

# Отключиться: Ctrl+A, затем D
# Вернуться: screen -r frontend
```

### Вариант 2: Systemd сервис (рекомендуется для production)

```bash
sudo nano /etc/systemd/system/building-frontend.service
```

Содержимое:
```ini
[Unit]
Description=Building Management Frontend
After=network.target

[Service]
Type=simple
User=srvadmin
WorkingDirectory=/home/srvadmin/building-management
ExecStart=/usr/bin/pnpm run dev
Restart=on-failure
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

Активировать:
```bash
sudo systemctl daemon-reload
sudo systemctl enable building-frontend
sudo systemctl start building-frontend

# Проверить статус
sudo systemctl status building-frontend

# Логи
sudo journalctl -u building-frontend -f
```

### Вариант 3: PM2 (для Node.js приложений)

```bash
# Установить PM2
npm install -g pm2

# Запустить
cd ~/building-management
pm2 start "pnpm run dev" --name building-frontend

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Управление
pm2 status
pm2 logs building-frontend
pm2 restart building-frontend
pm2 stop building-frontend
```

## Быстрая проверка

```bash
# 1. Frontend запущен?
ps aux | grep vite

# 2. Порт слушает?
sudo netstat -tulpn | grep 5173

# 3. Firewall открыт?
sudo ufw status | grep 5173

# 4. Доступен локально?
curl http://localhost:5173

# 5. Backend работает?
curl http://localhost:8080/api/auth/health
```

Если все 5 пунктов ✅ - должно работать по http://VM_IP:5173
