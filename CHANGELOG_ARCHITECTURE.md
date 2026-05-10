# Changelog - Модернизация архитектуры Backend

## 🎯 Что было сделано

Реализована полная модернизация архитектуры с разделением ответственности между Backend и Node-RED.

## ✅ Новые компоненты Backend

### 1. Entity (Сущности)
- ✅ `AuditLog.java` - Логирование всех действий пользователей

### 2. Repository (Репозитории)
- ✅ `AuditLogRepository.java` - Работа с логами

### 3. Services (Сервисы)
- ✅ `AuditLogService.java` - Сервис логирования (асинхронный)
- ✅ `BuildingService.java` - Сервис управления зданиями
- ✅ `FloorService.java` - Сервис управления этажами
- ✅ `RoomService.java` - Сервис управления помещениями
- ✅ `DeviceService.java` - Сервис управления устройствами

### 4. Controllers (Контроллеры)
- ✅ `BuildingController.java` - ОБНОВЛЕН: добавлены экспорт/импорт, логирование
- ✅ `FloorController.java` - НОВЫЙ: CRUD для этажей
- ✅ `RoomController.java` - НОВЫЙ: CRUD для помещений
- ✅ `DeviceController.java` - НОВЫЙ: CRUD для устройств
- ✅ `AuditLogController.java` - НОВЫЙ: просмотр логов
- ✅ `ProxyController.java` - ОБНОВЛЕН: проксирование только команд управления на Node-RED

### 5. DTO (Data Transfer Objects)
- ✅ `FloorDto.java` - DTO для этажей
- ✅ `RoomDto.java` - DTO для помещений
- ✅ `DeviceDto.java` - DTO для устройств

### 6. Конфигурация
- ✅ `BuildingManagementApplication.java` - ОБНОВЛЕН: добавлен `@EnableAsync`

## 📋 Новая архитектура

### Backend отвечает за:
1. **Авторизация** - JWT, управление пользователями и ролями
2. **Структура проекта** - хранение зданий, этажей, помещений, устройств в PostgreSQL
3. **CRUD операции** - создание, чтение, обновление, удаление структуры
4. **Логирование** - все действия записываются в audit_log
5. **Безопасность** - проверка прав доступа
6. **Проксирование** - передача команд управления на Node-RED

### Node-RED отвечает за:
1. **Управление устройствами** - отправка команд через MQTT
2. **Чтение состояний** - подписка на MQTT топики
3. **Отчеты** - генерация аналитики
4. **Интеграция** - подключение к закрытым сетям и шлюзам

## 🔄 API Изменения

### Новые endpoints для структуры

#### Этажи
```
GET    /api/floors/building/{buildingId}
POST   /api/floors/building/{buildingId}
PUT    /api/floors/{id}
DELETE /api/floors/{id}
```

#### Помещения
```
GET    /api/rooms/floor/{floorId}
POST   /api/rooms/floor/{floorId}
PUT    /api/rooms/{id}
DELETE /api/rooms/{id}
```

#### Устройства
```
GET    /api/devices/room/{roomId}
POST   /api/devices/room/{roomId}
PUT    /api/devices/{id}
DELETE /api/devices/{id}
PUT    /api/devices/{id}/state
```

### Новые endpoints для логирования
```
GET /api/audit/recent
GET /api/audit/user/{userId}
GET /api/audit/entity/{type}/{id}
GET /api/audit/period?start=...&end=...
```

### Обновленные endpoints для проксирования
```
POST /api/nodered/control/device/{deviceId}
GET  /api/nodered/state/device/{deviceId}
GET  /api/nodered/report/building/{buildingId}
GET  /api/nodered/report/system/{systemType}
ANY  /api/nodered/**  (для расширяемости)
```

## 📚 Новая документация

### Основная документация
- ✅ `/backend/ARCHITECTURE.md` - Детальное описание архитектуры
- ✅ `/NODE_RED_EXAMPLES.md` - Примеры Node-RED flows с JSON для импорта
- ✅ `/QUICK_INTEGRATION_GUIDE.md` - Быстрый гайд по интеграции
- ✅ `/CHANGELOG_ARCHITECTURE.md` - Этот файл

### Обновленная документация
- ✅ `/README.md` - Обновлена диаграмма архитектуры и API endpoints

## 🔐 Безопасность

### Логирование включает:
- Имя пользователя
- Действие (CREATE, UPDATE, DELETE, CONTROL)
- Тип сущности (Building, Floor, Room, Device)
- ID сущности
- IP адрес пользователя
- Временная метка
- Дополнительные детали (JSON)

### Права доступа по действиям:

| Действие                  | ADMIN | MANAGER | OPERATOR | VIEWER |
|---------------------------|-------|---------|----------|--------|
| Создание зданий           | ✅     | ✅       | ❌        | ❌      |
| Изменение структуры       | ✅     | ✅       | ❌        | ❌      |
| Удаление                  | ✅     | ❌       | ❌        | ❌      |
| Управление устройствами   | ✅     | ✅       | ✅        | ❌      |
| Просмотр структуры        | ✅     | ✅       | ✅        | ✅      |
| Просмотр логов            | ✅     | ✅       | ❌        | ❌      |

## 💡 Примеры использования

### 1. Создание структуры через Backend

```bash
# Авторизация
TOKEN=$(curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

# Создание здания
curl -X POST http://localhost:8080/buildings \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Офис","address":"Москва","floorsCount":5}'

# Создание этажа
curl -X POST http://localhost:8080/api/floors/building/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"floorNumber":1,"name":"Первый этаж"}'

# Создание помещения
curl -X POST http://localhost:8080/api/rooms/floor/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"101","roomType":"office","x":100,"y":100,"width":300,"height":200}'

# Создание устройства
curl -X POST http://localhost:8080/api/devices/room/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Лампа 1","deviceType":"light","systemTypeId":4,"mqttTopic":"building/1/device/1"}'
```

### 2. Управление устройством через Node-RED

```bash
# Отправка команды
curl -X POST http://localhost:8080/api/nodered/control/device/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"command":"on","brightness":80}'
```

### 3. Просмотр логов

```bash
# Последние действия
curl http://localhost:8080/api/audit/recent \
  -H "Authorization: Bearer $TOKEN"

# Логи устройства
curl http://localhost:8080/api/audit/entity/Device/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 🚀 Что дальше?

### Рекомендации для разработки:

1. **Настройка Node-RED**
   - Импортировать примеры flows из `/NODE_RED_EXAMPLES.md`
   - Настроить MQTT broker (Mosquitto)
   - Протестировать интеграцию

2. **Развертывание**
   - Настроить production базу данных
   - Настроить SSL сертификаты
   - Настроить Node-RED аутентификацию

3. **Мониторинг**
   - Настроить логирование в файлы
   - Добавить метрики (Prometheus/Grafana)
   - Настроить алерты

4. **Frontend интеграция**
   - Обновить API клиенты для новых endpoints
   - Добавить UI для просмотра логов
   - Добавить UI для экспорта/импорта

5. **Расширение**
   - Добавить WebSocket для real-time обновлений
   - Добавить кастомные отчеты в Node-RED
   - Добавить интеграцию с внешними системами

## 🔧 Миграция данных

Если у вас есть существующие данные:

1. Backend автоматически создаст новые таблицы при запуске
2. Существующие данные в `buildings`, `floors`, `rooms`, `devices` останутся
3. Новая таблица `audit_log` будет создана автоматически
4. Все новые действия будут логироваться автоматически

## 📞 Поддержка

Для вопросов и помощи:
- Архитектура: `/backend/ARCHITECTURE.md`
- Интеграция: `/QUICK_INTEGRATION_GUIDE.md`
- Node-RED примеры: `/NODE_RED_EXAMPLES.md`
