# 🐧 Установка на чистой Linux системе

Пошаговая инструкция для установки всего стека на Ubuntu/Debian.

## Шаг 1: Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
```

## Шаг 2: Установка Java 17

```bash
# Установка OpenJDK 17
sudo apt install openjdk-17-jdk -y

# Проверка
java -version
# Должно вывести: openjdk version "17.x.x"
```

## Шаг 3: Установка Maven

```bash
# Установка Maven
sudo apt install maven -y

# Проверка
mvn -version
# Должно вывести: Apache Maven 3.x.x
```

## Шаг 4: Установка PostgreSQL

```bash
# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Запуск сервиса
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Проверка статуса
sudo systemctl status postgresql
```

### Настройка PostgreSQL

```bash
# Переключиться на пользователя postgres
sudo -i -u postgres

# Создать пользователя и базу данных
psql

# В psql консоли:
CREATE USER building_user WITH PASSWORD 'building_pass';
CREATE DATABASE building_management OWNER building_user;
GRANT ALL PRIVILEGES ON DATABASE building_management TO building_user;
\q

# Выйти из пользователя postgres
exit
```

### Настройка удаленного доступа (опционально)

```bash
# Редактировать postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf
# Раскомментировать и изменить:
# listen_addresses = '*'

# Редактировать pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Добавить строку:
# host    all             all             0.0.0.0/0               md5

# Перезапустить PostgreSQL
sudo systemctl restart postgresql
```

## Шаг 5: Установка Node.js и pnpm (для фронтенда)

```bash
# Установка Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Проверка
node -v   # v20.x.x
npm -v    # 10.x.x

# Установка pnpm
npm install -g pnpm

# Проверка
pnpm -v
```

## Шаг 6: Установка Git

```bash
sudo apt install git -y

# Проверка
git --version
```

## Шаг 7: Клонирование проекта

```bash
# Создать директорию для проектов
mkdir -p ~/projects
cd ~/projects

# Если проект в Git репозитории:
# git clone <your-repo-url>
# cd <project-name>

# Или скопировать файлы проекта на виртуалку
# Например через scp:
# scp -r /local/path/to/project user@vm-ip:~/projects/
```

## Шаг 8: Настройка Backend

```bash
cd ~/projects/building-management/backend

# Отредактировать application.properties
nano src/main/resources/application.properties
```

Изменить:
```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/building_management
spring.datasource.username=building_user
spring.datasource.password=building_pass

# JWT Secret (ВАЖНО: Изменить для production!)
jwt.secret=your-secret-key-change-this-in-production-minimum-256-bits-long-random-string

# Node-RED (если используется)
nodered.base.url=http://localhost:1880

# CORS - IP вашей виртуалки или *
cors.allowed.origins=http://localhost:5173,http://<VM_IP>:5173
```

## Шаг 9: Запуск Backend

```bash
cd ~/projects/building-management/backend

# Сборка и запуск
./start.sh

# Или вручную:
mvn clean install
mvn spring-boot:run

# Backend запустится на порту 8080
```

### Запуск backend в фоне (опционально)

```bash
# Установка screen для фоновых процессов
sudo apt install screen -y

# Запуск в screen сессии
screen -S backend
cd ~/projects/building-management/backend
mvn spring-boot:run

# Отключиться: Ctrl+A, затем D
# Вернуться: screen -r backend
```

## Шаг 10: Создание тестового пользователя

```bash
# Дождаться запуска backend (логи покажут "Started BuildingManagementApplication")

# В новом терминале:
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@building.com",
    "password": "admin123",
    "fullName": "Администратор"
  }'
```

## Шаг 11: Настройка Frontend

```bash
cd ~/projects/building-management

# Установка зависимостей
pnpm install

# Обновить API URL если нужно
nano src/app/config/api.ts
```

Изменить если backend на другом хосте:
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',  // или http://<VM_IP>:8080/api
  TIMEOUT: 10000,
};
```

## Шаг 12: Запуск Frontend

```bash
cd ~/projects/building-management

# Запуск dev сервера
pnpm run dev

# Фронтенд запустится на порту 5173
```

### Доступ к фронтенду снаружи

По умолчанию Vite слушает только localhost. Для доступа извне:

```bash
# Отредактировать package.json
nano package.json
```

Изменить scripts:
```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0"
  }
}
```

```bash
# Перезапустить
pnpm run dev
```

Теперь доступно по `http://<VM_IP>:5173`

## Шаг 13: Настройка Firewall (если нужен внешний доступ)

```bash
# Установка ufw
sudo apt install ufw -y

# Разрешить SSH
sudo ufw allow 22/tcp

# Разрешить порты приложения
sudo ufw allow 8080/tcp  # Backend
sudo ufw allow 5173/tcp  # Frontend
sudo ufw allow 5432/tcp  # PostgreSQL (если нужен удаленный доступ)

# Включить firewall
sudo ufw enable

# Проверить статус
sudo ufw status
```

## Шаг 14: Проверка работы

```bash
# Установить curl и jq
sudo apt install curl jq -y

# Тест backend
curl http://localhost:8080/api/auth/health

# Должен вернуть:
# {"success":true,"message":"Backend is running"}

# Запустить тестовый скрипт
cd ~/projects/building-management
chmod +x test-backend.sh
./test-backend.sh
```

## Опционально: Установка Node-RED

```bash
# Установка Node-RED
sudo npm install -g --unsafe-perm node-red

# Запуск
node-red

# Доступ к Node-RED: http://localhost:1880
# или http://<VM_IP>:1880

# Разрешить порт в firewall
sudo ufw allow 1880/tcp
```

### Запуск Node-RED как сервис

```bash
# Создать systemd сервис
sudo nano /etc/systemd/system/nodered.service
```

Содержимое:
```ini
[Unit]
Description=Node-RED
After=syslog.target network.target

[Service]
ExecStart=/usr/bin/node-red
Restart=on-failure
KillSignal=SIGINT

# Пользователь (замените на вашего)
User=your-username
Group=your-username

[Install]
WantedBy=multi-user.target
```

```bash
# Активировать сервис
sudo systemctl daemon-reload
sudo systemctl enable nodered
sudo systemctl start nodered

# Проверка
sudo systemctl status nodered
```

## Автозапуск всех сервисов при перезагрузке

### Backend как systemd сервис

```bash
sudo nano /etc/systemd/system/building-backend.service
```

Содержимое:
```ini
[Unit]
Description=Building Management Backend
After=postgresql.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/projects/building-management/backend
ExecStart=/usr/bin/mvn spring-boot:run
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable building-backend
sudo systemctl start building-backend
```

## Полезные команды

```bash
# Проверка портов
sudo netstat -tulpn | grep LISTEN

# Логи PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Логи systemd сервисов
sudo journalctl -u building-backend -f
sudo journalctl -u nodered -f

# Перезапуск сервисов
sudo systemctl restart postgresql
sudo systemctl restart building-backend
sudo systemctl restart nodered

# Остановка сервисов
sudo systemctl stop building-backend
sudo systemctl stop nodered
```

## Траблшутинг

### Backend не подключается к PostgreSQL

```bash
# Проверить что PostgreSQL запущен
sudo systemctl status postgresql

# Проверить что база создана
psql -U building_user -d building_management -h localhost

# Проверить логи
sudo journalctl -u postgresql -n 50
```

### Frontend не подключается к Backend

```bash
# Проверить что backend запущен
curl http://localhost:8080/api/auth/health

# Проверить CORS настройки
cat backend/src/main/resources/application.properties | grep cors

# Проверить firewall
sudo ufw status
```

### Нет памяти для Maven

```bash
# Увеличить память для Maven
export MAVEN_OPTS="-Xmx1024m"

# Или добавить в ~/.bashrc
echo 'export MAVEN_OPTS="-Xmx1024m"' >> ~/.bashrc
source ~/.bashrc
```

## Итоговая проверка

После всех установок должно работать:

1. ✅ PostgreSQL на порту 5432
2. ✅ Backend на порту 8080
3. ✅ Frontend на порту 5173
4. ✅ (Опционально) Node-RED на порту 1880

```bash
# Проверка всех сервисов
curl http://localhost:8080/api/auth/health  # Backend
curl http://localhost:5173                   # Frontend
curl http://localhost:1880                   # Node-RED (если установлен)
```

**Готово!** Откройте браузер: `http://<VM_IP>:5173` и войдите с `admin` / `admin123`
