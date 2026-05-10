# Быстрый гайд по интеграции Backend + Node-RED

## Что изменилось?

### ✅ Backend теперь отвечает за:
1. **Авторизацию** - JWT токены, управление пользователями
2. **Структуру проекта** - здания, этажи, помещения, устройства хранятся в PostgreSQL
3. **CRUD операции** - создание, чтение, обновление, удаление структуры
4. **Логирование** - все действия записываются в audit_log
5. **Проксирование** - передает команды управления и запросы отчетов на Node-RED

### ✅ Node-RED отвечает за:
1. **Управление устройствами** - отправка команд через MQTT
2. **Чтение состояний** - подписка на MQTT топики устройств
3. **Отчеты** - генерация аналитики и отчетов
4. **Интеграция** - подключение к закрытым сетям и шлюзам

## Новые API endpoints Backend

### Структура проекта

#### Здания
```bash
# Получить все здания
GET /buildings

# Создать здание
POST /buildings
{
  "name": "Главный офис",
  "address": "Москва, ул. Ленина, 1",
  "floorsCount": 5
}

# Экспорт/импорт
GET /buildings/1/export
POST /buildings/import
```

#### Этажи
```bash
# Получить этажи здания
GET /api/floors/building/1

# Создать этаж
POST /api/floors/building/1
{
  "floorNumber": 1,
  "name": "Первый этаж"
}
```

#### Помещения
```bash
# Получить помещения этажа
GET /api/rooms/floor/1

# Создать помещение
POST /api/rooms/floor/1
{
  "name": "Кабинет 101",
  "roomType": "office",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 150
}
```

#### Устройства
```bash
# Получить устройства помещения
GET /api/devices/room/1

# Создать устройство
POST /api/devices/room/1
{
  "name": "Камера 1",
  "deviceType": "camera",
  "systemTypeId": 2,
  "mqttTopic": "building/1/device/1",
  "x": 50,
  "y": 50
}
```

### Проксирование на Node-RED

```bash
# Управление устройством
POST /api/nodered/control/device/1
{
  "command": "on",
  "value": 100
}

# Получение состояния
GET /api/nodered/state/device/1

# Отчеты
GET /api/nodered/report/building/1?reportType=energy&startDate=...&endDate=...
```

### Логирование

```bash
# Последние 100 записей
GET /api/audit/recent

# Логи пользователя
GET /api/audit/user/1

# Логи устройства
GET /api/audit/entity/Device/1
```

## Запуск системы

### 1. Запуск PostgreSQL
```bash
# Убедитесь, что PostgreSQL запущен
sudo systemctl start postgresql
```

### 2. Запуск Backend
```bash
cd backend
./start.sh
# Backend будет доступен на http://localhost:8080
```

### 3. Запуск Node-RED
```bash
# Установка (если еще не установлен)
npm install -g --unsafe-perm node-red

# Запуск
node-red

# Node-RED будет доступен на http://localhost:1880
```

### 4. Запуск MQTT Broker (Mosquitto)
```bash
sudo systemctl start mosquitto
```

### 5. Запуск Frontend
```bash
npm run dev
# Frontend будет доступен на http://localhost:5173
```

## Импорт Node-RED flows

1. Откройте http://localhost:1880
2. Меню → Import → вставьте JSON из `/NODE_RED_EXAMPLES.md`
3. Deploy

## Тестирование интеграции

### Сценарий 1: Создание структуры через Backend

```bash
# 1. Авторизация
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Сохраните токен из ответа
TOKEN="eyJhbGc..."

# 2. Создание здания
curl -X POST http://localhost:8080/buildings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Офисное здание",
    "address": "Москва",
    "floorsCount": 5
  }'

# 3. Создание этажа
curl -X POST http://localhost:8080/api/floors/building/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "floorNumber": 1,
    "name": "Первый этаж"
  }'

# 4. Создание помещения
curl -X POST http://localhost:8080/api/rooms/floor/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Офис 101",
    "roomType": "office",
    "x": 100,
    "y": 100,
    "width": 300,
    "height": 200
  }'

# 5. Создание устройства
curl -X POST http://localhost:8080/api/devices/room/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Лампа освещения",
    "deviceType": "light",
    "systemTypeId": 4,
    "mqttTopic": "building/1/device/1",
    "x": 150,
    "y": 150,
    "enabled": true
  }'
```

### Сценарий 2: Управление устройством через Node-RED

```bash
# Отправка команды через Backend
curl -X POST http://localhost:8080/api/nodered/control/device/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"on","brightness":80}'

# Backend проверит права доступа и отправит запрос в Node-RED
# Node-RED отправит команду в MQTT топик building/1/device/1/set
```

### Сценарий 3: Чтение состояния устройства

```bash
# Подписка на MQTT топик (в отдельном терминале)
mosquitto_sub -h localhost -t "building/1/device/1/state" -v

# Публикация состояния (симуляция устройства)
mosquitto_pub -h localhost -t "building/1/device/1/state" \
  -m '{"status":"on","brightness":80,"temperature":22.5}'

# Node-RED получит это состояние и закэширует
# Backend сможет его прочитать:
curl http://localhost:8080/api/nodered/state/device/1 \
  -H "Authorization: Bearer $TOKEN"
```

### Сценарий 4: Просмотр логов

```bash
# Последние действия
curl http://localhost:8080/api/audit/recent \
  -H "Authorization: Bearer $TOKEN"

# Логи конкретного устройства
curl http://localhost:8080/api/audit/entity/Device/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Конфигурация Node-RED для работы с Backend

### application.properties (Backend)
```properties
# Node-RED URL
nodered.url=http://localhost:1880
```

### Node-RED settings.js
```javascript
module.exports = {
    // Разрешить CORS для backend
    httpNodeCors: {
        origin: "*",
        methods: "GET,PUT,POST,DELETE"
    },
    
    // Порт Node-RED
    uiPort: process.env.PORT || 1880,
    
    // Логирование
    logging: {
        console: {
            level: "info",
            metrics: false,
            audit: true
        }
    }
}
```

## MQTT топики

### Структура топиков

```
building/{buildingId}/device/{deviceId}/state    # Состояние устройства (чтение)
building/{buildingId}/device/{deviceId}/set      # Команды устройству (запись)
building/{buildingId}/system/{systemType}/state  # Состояние системы
building/{buildingId}/events                     # События здания
building/{buildingId}/alerts                     # Алерты и предупреждения
```

### Пример публикации состояния

```bash
# Термостат отправляет текущую температуру
mosquitto_pub -h localhost \
  -t "building/1/device/5/state" \
  -m '{"temperature":22.5,"humidity":45,"mode":"heating"}'

# Камера отправляет статус
mosquitto_pub -h localhost \
  -t "building/1/device/10/state" \
  -m '{"status":"recording","resolution":"1080p","fps":30}'
```

### Пример команды устройству

```bash
# Включить свет
mosquitto_pub -h localhost \
  -t "building/1/device/1/set" \
  -m '{"command":"on","brightness":80}'

# Установить температуру
mosquitto_pub -h localhost \
  -t "building/1/device/5/set" \
  -m '{"command":"set_temperature","value":23}'
```

## Роли и доступ

| Действие                          | ADMIN | MANAGER | OPERATOR | VIEWER |
|-----------------------------------|-------|---------|----------|--------|
| Создание/удаление зданий          | ✅     | ✅       | ❌        | ❌      |
| Изменение структуры               | ✅     | ✅       | ❌        | ❌      |
| Управление устройствами           | ✅     | ✅       | ✅        | ❌      |
| Просмотр состояния устройств      | ✅     | ✅       | ✅        | ✅      |
| Просмотр отчетов                  | ✅     | ✅       | ❌        | ❌      |
| Просмотр логов                    | ✅     | ✅       | ❌        | ❌      |
| Управление пользователями         | ✅     | ❌       | ❌        | ❌      |

## Следующие шаги

1. ✅ Импортируйте примеры Node-RED flows
2. ✅ Настройте MQTT broker
3. ✅ Создайте структуру здания через API
4. ✅ Протестируйте управление устройствами
5. ✅ Настройте реальные MQTT устройства
6. ✅ Разработайте кастомные отчеты в Node-RED
7. ✅ Настройте интеграцию с закрытыми сетями

## Полезные команды

```bash
# Просмотр логов Backend
tail -f backend/logs/application.log

# Просмотр логов Node-RED
tail -f ~/.node-red/node-red.log

# Просмотр MQTT трафика
mosquitto_sub -h localhost -t "#" -v

# Тест подключения к PostgreSQL
psql -U buildingmgmt -d buildingmgmt_db
```

## Поддержка и документация

- Backend API: `/backend/ARCHITECTURE.md`
- Node-RED примеры: `/NODE_RED_EXAMPLES.md`
- Полная документация: `/README.md`
