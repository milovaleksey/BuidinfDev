# Building Management System - Backend

Spring Boot backend для системы управления 5-этажным зданием с интеграцией Node-RED.

## Технологии

- Java 17
- Spring Boot 3.2.5
- PostgreSQL
- JWT Authentication
- WebSocket для real-time обновлений
- WebClient для Node-RED интеграции

## Требования

- Java 17+
- Maven 3.6+
- PostgreSQL 12+
- Node-RED сервер (для интеграции с устройствами)

## Установка и запуск

### 1. Настройка PostgreSQL

```bash
# Создать базу данных
createdb building_management

# Или через psql
psql -U postgres
CREATE DATABASE building_management;
```

### 2. Конфигурация

Отредактируйте `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/building_management
spring.datasource.username=postgres
spring.datasource.password=your_password

# JWT Secret (измените для production!)
jwt.secret=your-secret-key-change-this-in-production-minimum-256-bits

# Node-RED
nodered.base.url=http://localhost:1880

# CORS
cors.allowed.origins=http://localhost:5173
```

### 3. Сборка и запуск

```bash
# Сборка проекта
mvn clean install

# Запуск
mvn spring-boot:run

# Или через JAR
mvn clean package
java -jar target/building-management-1.0.0.jar
```

Backend будет доступен на `http://localhost:8080/api`

## API Endpoints

### Авторизация

```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
GET  /api/auth/health
```

### Здания

```
GET    /api/buildings
GET    /api/buildings/{id}
POST   /api/buildings
PUT    /api/buildings/{id}
DELETE /api/buildings/{id}
```

### Этажи

```
GET    /api/buildings/{buildingId}/floors
GET    /api/floors/{id}
POST   /api/floors
PUT    /api/floors/{id}
DELETE /api/floors/{id}
```

### Помещения

```
GET    /api/floors/{floorId}/rooms
GET    /api/rooms/{id}
POST   /api/rooms
PUT    /api/rooms/{id}
DELETE /api/rooms/{id}
```

### Устройства

```
GET    /api/devices
GET    /api/devices/{id}
POST   /api/devices/{id}/command
GET    /api/devices/building/{buildingId}
```

## Схема базы данных

Основные таблицы:
- `users` - пользователи системы
- `roles` - роли (ADMIN, MANAGER, OPERATOR, VIEWER)
- `buildings` - здания
- `floors` - этажи
- `rooms` - помещения
- `devices` - устройства (СКУД, видео, отопление, освещение, HVAC)
- `system_types` - типы систем
- `permissions` - права доступа по помещениям и системам
- `audit_log` - аудит действий

Схема автоматически создается при первом запуске через Hibernate DDL.

## Интеграция с Node-RED

Backend взаимодействует с Node-RED через REST API:

**Чтение состояния устройства:**
```
GET http://localhost:1880/device/{deviceId}/state
```

**Отправка команды устройству:**
```
POST http://localhost:1880/device/{deviceId}/command
{
  "command": "turn_on",
  "parameters": {
    "brightness": 100
  }
}
```

Node-RED должен предоставлять эти endpoints и транслировать команды в MQTT топики:
- State: `building/{building_id}/floor/{floor_id}/device/{device_id}/State`
- Set: `building/{building_id}/floor/{floor_id}/device/{device_id}/Set`

## Ролевая модель

- **ADMIN** - полный доступ ко всей системе
- **MANAGER** - управление зданиями и конфигурацией
- **OPERATOR** - управление устройствами
- **VIEWER** - только просмотр

Права доступа настраиваются на уровне:
- Зданий
- Этажей
- Помещений
- Систем (СКУД, видео, отопление и т.д.)

## Тестовые данные

При первом запуске автоматически создаются:
- 4 роли
- 5 типов систем (СКУД, видео, отопление, освещение, HVAC)

Для создания тестового пользователя используйте `/api/auth/register`.

## Разработка

```bash
# Запуск в dev режиме с hot reload
mvn spring-boot:run

# Просмотр логов
tail -f logs/spring-boot-application.log

# Проверка работы
curl http://localhost:8080/api/auth/health
```

## Production

Для production окружения:

1. Измените `jwt.secret` на случайную строку минимум 256 бит
2. Настройте SSL/TLS
3. Используйте переменные окружения для чувствительных данных
4. Настройте connection pooling для PostgreSQL
5. Включите логирование в файл
6. Настройте мониторинг (Actuator endpoints)

```properties
# Production settings
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
logging.level.root=WARN
management.endpoints.web.exposure.include=health,metrics
```
