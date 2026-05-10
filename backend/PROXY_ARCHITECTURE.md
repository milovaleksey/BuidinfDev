# 🔐 Proxy Architecture - API Gateway Pattern

## Архитектура

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ HTTP + JWT
       ▼
┌──────────────────────────────────────────┐
│   Java Backend (API Gateway)             │
│   - Авторизация (JWT)                    │
│   - Проверка ролей                       │
│   - Proxy к Node-RED                     │
└──────┬───────────────────────────────────┘
       │ HTTP + X-User-* заголовки
       ▼
┌──────────────────────────────────────────┐
│   Node-RED                               │
│   - Вся бизнес-логика                    │
│   - CRUD операции                        │
│   - MQTT интеграция                      │
│   - Хранение данных                      │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│   База данных / MQTT / Устройства        │
└──────────────────────────────────────────┘
```

## Как работает

### 1. Frontend делает запрос
```javascript
GET /api/buildings
Headers: Authorization: Bearer <JWT_TOKEN>
```

### 2. Java Backend проверяет авторизацию
- Проверяет JWT токен
- Извлекает пользователя и роли
- Проверяет права доступа

### 3. Backend проксирует на Node-RED
```
GET http://localhost:1880/buildings
Headers:
  X-User-Id: 123
  X-User-Name: admin
  X-User-Roles: ADMIN,MANAGER
```

### 4. Node-RED обрабатывает запрос
- Получает данные о пользователе из заголовков
- Выполняет бизнес-логику
- Возвращает данные

### 5. Backend возвращает ответ Frontend
```json
{
  "buildings": [...]
}
```

## Роли и права

### Права на чтение (GET)
- ✅ VIEWER - только чтение
- ✅ OPERATOR - чтение и управление устройствами
- ✅ MANAGER - чтение и управление зданиями
- ✅ ADMIN - полный доступ

### Права на запись (POST, PUT)
- ❌ VIEWER - запрещено
- ✅ OPERATOR - разрешено
- ✅ MANAGER - разрешено
- ✅ ADMIN - разрешено

### Права на удаление (DELETE)
- ❌ VIEWER - запрещено
- ❌ OPERATOR - запрещено
- ❌ MANAGER - запрещено
- ✅ ADMIN - разрешено

## Endpoints

### Проксируемые на Node-RED

Все эти запросы проверяются и проксируются:

**Buildings:**
```
GET    /api/buildings
GET    /api/buildings/{id}
POST   /api/buildings
PUT    /api/buildings/{id}
DELETE /api/buildings/{id}
```

**Floors:**
```
GET    /api/floors
GET    /api/floors/{id}
POST   /api/floors
PUT    /api/floors/{id}
DELETE /api/floors/{id}
```

**Rooms:**
```
GET    /api/rooms
GET    /api/rooms/{id}
POST   /api/rooms
PUT    /api/rooms/{id}
DELETE /api/rooms/{id}
```

**Devices:**
```
GET    /api/devices
GET    /api/devices/{id}
POST   /api/devices/{id}/command
PUT    /api/devices/{id}
DELETE /api/devices/{id}
```

### Обрабатываемые Backend напрямую

Эти endpoints НЕ проксируются:

**Auth:**
```
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
GET  /api/auth/health
```

## Node-RED Flow Пример

```javascript
// В Node-RED создать HTTP endpoints:

// GET /buildings
[
  {
    "id": "http-in-buildings",
    "type": "http in",
    "url": "/buildings",
    "method": "get"
  },
  {
    "id": "get-user-info",
    "type": "function",
    "func": `
      // Получить информацию о пользователе из заголовков
      const userId = msg.req.headers['x-user-id'];
      const userName = msg.req.headers['x-user-name'];
      const userRoles = msg.req.headers['x-user-roles'];
      
      msg.payload = {
        userId: userId,
        userName: userName,
        roles: userRoles ? userRoles.split(',') : []
      };
      
      return msg;
    `
  },
  {
    "id": "get-buildings",
    "type": "function",
    "func": `
      // Получить здания из контекста или базы
      const buildings = flow.get('buildings') || [];
      
      // Фильтровать по правам пользователя
      // (опционально - можно просто вернуть все)
      
      msg.payload = buildings;
      return msg;
    `
  },
  {
    "id": "http-response",
    "type": "http response",
    "statusCode": "200"
  }
]
```

## Преимущества

### ✅ Безопасность
- Централизованная авторизация
- Node-RED не нужно знать про JWT
- Невозможно обойти проверку прав

### ✅ Гибкость
- Node-RED фокусируется на бизнес-логике
- Легко добавить другие источники данных
- Можно заменить Node-RED на другой сервис

### ✅ Масштабируемость
- Можно добавить кэширование в proxy
- Rate limiting на уровне API Gateway
- Load balancing между несколькими Node-RED

### ✅ Мониторинг
- Все запросы логируются в одном месте
- Легко добавить метрики
- Централизованная обработка ошибок

## Настройка

### Backend

**application.properties:**
```properties
# Node-RED URL
nodered.base.url=http://localhost:1880

# Таймаут для proxy запросов
nodered.api.timeout=5000
```

### Node-RED

**Установка:**
```bash
npm install -g node-red
node-red
```

**Создать flows для:**
- `/buildings` - CRUD операции
- `/floors` - CRUD операции
- `/rooms` - CRUD операции
- `/devices` - CRUD операции + команды

**Читать заголовки пользователя:**
```javascript
const userId = msg.req.headers['x-user-id'];
const userName = msg.req.headers['x-user-name'];
const userRoles = msg.req.headers['x-user-roles'].split(',');
```

## База данных в Node-RED

### Вариант 1: Context Storage
Хранить в памяти Node-RED (для разработки):

```javascript
// Сохранить
flow.set('buildings', buildings);

// Получить
const buildings = flow.get('buildings') || [];
```

### Вариант 2: File System
Хранить в JSON файлах:

```javascript
const fs = require('fs');

// Сохранить
fs.writeFileSync('/data/buildings.json', JSON.stringify(buildings));

// Получить
const buildings = JSON.parse(fs.readFileSync('/data/buildings.json'));
```

### Вариант 3: PostgreSQL
Подключить PostgreSQL к Node-RED:

```bash
cd ~/.node-red
npm install node-red-contrib-postgres
```

В flow использовать postgres node для SQL запросов.

### Вариант 4: MongoDB
```bash
cd ~/.node-red
npm install node-red-node-mongodb
```

## Миграция данных

Если нужно перенести данные из Java в Node-RED:

### 1. Экспорт из Java
```bash
curl http://localhost:8080/api/export/all > data.json
```

### 2. Импорт в Node-RED
```bash
curl -X POST http://localhost:1880/import \
  -H "Content-Type: application/json" \
  -d @data.json
```

## Траблшутинг

### Frontend получает 503
- Node-RED не запущен
- Неверный `nodered.base.url` в application.properties

### Frontend получает 401
- JWT токен невалидный или истек
- Проблема с авторизацией в Backend

### Frontend получает 403
- Недостаточно прав для операции
- Проверить роль пользователя

### Node-RED не получает заголовки
- Проверить что ProxyController добавляет заголовки
- Проверить логи Backend

## Monitoring

Все proxy запросы логируются:

```
INFO  ProxyController - Proxying GET /buildings to Node-RED for user admin
DEBUG ProxyController - Node-RED response: 200 OK
ERROR ProxyController - Error proxying to Node-RED: Connection refused
```

## Что дальше

1. ✅ Установить Node-RED
2. ✅ Создать flows для CRUD операций
3. ✅ Протестировать проксирование
4. ⬜ Добавить кэширование (опционально)
5. ⬜ Добавить rate limiting (опционально)
6. ⬜ Настроить MQTT в Node-RED
