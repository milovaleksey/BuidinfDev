# 🚀 Быстрый старт - Система управления зданием

## Архитектура

```
Frontend (React + Vite)  <-->  Java Backend (Spring Boot)  <-->  PostgreSQL
     localhost:5173              localhost:8080                  localhost:5432

                                       ↓
                               Node-RED (localhost:1880)
                                       ↓
                                  MQTT Devices
```

## Шаг 1: Запуск PostgreSQL

```bash
# Установка PostgreSQL (если еще не установлен)
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# MacOS:
brew install postgresql@14
brew services start postgresql

# Создание базы данных
createdb building_management

# Или через psql:
psql -U postgres
CREATE DATABASE building_management;
\q
```

## Шаг 2: Настройка Backend

```bash
cd backend

# Отредактировать src/main/resources/application.properties
# Изменить:
# - spring.datasource.password (пароль PostgreSQL)
# - jwt.secret (для production!)

# Запуск backend
./start.sh

# Или вручную:
mvn spring-boot:run
```

Backend будет доступен на `http://localhost:8080/api`

**Первый запуск создаст:**
- Все таблицы в БД
- 4 роли (ADMIN, MANAGER, OPERATOR, VIEWER)
- 5 типов систем (СКУД, Видео, Отопление, Освещение, HVAC)

## Шаг 3: Создание тестового пользователя

```bash
# Через curl (или Postman)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@building.com",
    "password": "admin123",
    "fullName": "Администратор"
  }'
```

## Шаг 4: Тестирование Backend

```bash
# В корне проекта
./test-backend.sh
```

Должно вывести: ✅ Backend доступен

## Шаг 5: Запуск Frontend

```bash
# В корне проекта
pnpm install  # если еще не установлены зависимости
pnpm run dev
```

Frontend будет доступен на `http://localhost:5173`

## Шаг 6: Вход в систему

Откройте `http://localhost:5173` и войдите:

**Тестовые данные (после регистрации):**
- **admin** / admin123 - полный доступ
- **manager** / manager123 - управление зданиями
- **operator** / operator123 - управление устройствами
- **viewer** / viewer123 - только просмотр

## Проверка работы

### Backend
```bash
# Health check
curl http://localhost:8080/api/auth/health

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Должен вернуть JWT token
```

### Frontend
1. Откройте `http://localhost:5173`
2. Войдите как admin/admin123
3. Вы должны попасть в раздел "Объекты"

## Отладка

### Backend не стартует

```bash
# Проверка PostgreSQL
psql -U postgres -l

# Проверка порта 8080
lsof -i :8080

# Логи backend
cd backend
tail -f logs/spring-boot-application.log
```

### Frontend не подключается к Backend

1. Откройте DevTools (F12) → Network
2. Проверьте запросы к `http://localhost:8080/api`
3. Если CORS ошибка - проверьте `backend/src/main/resources/application.properties`:
   ```properties
   cors.allowed.origins=http://localhost:5173
   ```

### База данных пустая

```bash
# Проверить таблицы
psql -U postgres -d building_management -c "\dt"

# Проверить роли
psql -U postgres -d building_management -c "SELECT * FROM roles;"

# Пересоздать схему (ОСТОРОЖНО - удалит все данные!)
cd backend
psql -U postgres -d building_management -f src/main/resources/schema.sql
```

## Следующие шаги

1. **Настроить Node-RED:**
   - Установить Node-RED: `npm install -g node-red`
   - Запустить: `node-red`
   - Создать flows для MQTT интеграции

2. **Создать здание в системе:**
   - Войти как admin
   - Создать новое здание через UI
   - Добавить этажи и помещения

3. **Настроить устройства:**
   - Добавить устройства на плане этажа
   - Настроить MQTT топики
   - Протестировать управление

## Полезные команды

```bash
# Backend
cd backend
mvn clean install      # Сборка
mvn spring-boot:run    # Запуск
mvn test              # Тесты

# Frontend
pnpm run dev          # Запуск dev сервера
pnpm run build        # Сборка для production

# База данных
psql -U postgres -d building_management  # Подключиться к БД
```

## Порты

- **Frontend**: 5173
- **Backend**: 8080
- **PostgreSQL**: 5432
- **Node-RED**: 1880 (опционально)

Все порты должны быть свободны перед запуском!
