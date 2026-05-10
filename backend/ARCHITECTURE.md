# Архитектура системы управления зданиями

## Общая концепция

Система построена по принципу разделения ответственности между двумя компонентами:

### Backend (Java Spring Boot + PostgreSQL)
**Роль: "Охранник" и хранитель структуры**

Отвечает за:
- ✅ Авторизация и аутентификация (JWT)
- ✅ Управление пользователями и ролями (ADMIN, MANAGER, OPERATOR, VIEWER)
- ✅ Хранение структуры проекта (здания, этажи, помещения, устройства)
- ✅ CRUD операции над структурой
- ✅ Логирование всех действий (Audit Log)
- ✅ Проверка прав доступа
- ✅ Проксирование запросов управления на Node-RED
- ✅ Экспорт/импорт конфигурации зданий

### Node-RED
**Роль: Исполнитель команд и аналитик**

Отвечает за:
- 🔄 Управление устройствами через MQTT
- 🔄 Интеграция с закрытыми сетями и шлюзами
- 🔄 Генерация отчетов и аналитика
- 🔄 Обработка событий от устройств
- 🔄 Бизнес-логика управления

## Поток данных

### 1. Авторизация
```
Фронтенд → Backend (AuthController) → JWT Token → Фронтенд
```

### 2. Получение структуры проекта
```
Фронтенд → Backend (BuildingController/FloorController/RoomController/DeviceController) → PostgreSQL → Фронтенд
```

### 3. Управление устройством
```
Фронтенд → Backend (ProxyController) → проверка прав → Node-RED → MQTT → Устройство
                                     ↓
                              Audit Log
```

### 4. Получение отчетов
```
Фронтенд → Backend (ProxyController) → проверка прав → Node-RED → генерация отчета → Фронтенд
```

## API Endpoints

### Backend Endpoints

#### Авторизация
- `POST /auth/login` - Вход в систему
- `POST /auth/register` - Регистрация пользователя (только для ADMIN)

#### Структура проекта
- `GET /buildings` - Список всех зданий
- `GET /buildings/{id}` - Информация о здании
- `POST /buildings` - Создание здания (ADMIN, MANAGER)
- `PUT /buildings/{id}` - Обновление здания (ADMIN, MANAGER)
- `DELETE /buildings/{id}` - Удаление здания (ADMIN)
- `GET /buildings/{id}/export` - Экспорт здания в JSON (ADMIN, MANAGER)
- `POST /buildings/import` - Импорт здания из JSON (ADMIN, MANAGER)

- `GET /api/floors/building/{buildingId}` - Список этажей здания
- `POST /api/floors/building/{buildingId}` - Создание этажа (ADMIN, MANAGER)
- `PUT /api/floors/{id}` - Обновление этажа (ADMIN, MANAGER)
- `DELETE /api/floors/{id}` - Удаление этажа (ADMIN)

- `GET /api/rooms/floor/{floorId}` - Список помещений этажа
- `POST /api/rooms/floor/{floorId}` - Создание помещения (ADMIN, MANAGER)
- `PUT /api/rooms/{id}` - Обновление помещения (ADMIN, MANAGER)
- `DELETE /api/rooms/{id}` - Удаление помещения (ADMIN)

- `GET /api/devices/room/{roomId}` - Список устройств помещения
- `POST /api/devices/room/{roomId}` - Создание устройства (ADMIN, MANAGER)
- `PUT /api/devices/{id}` - Обновление устройства (ADMIN, MANAGER, OPERATOR)
- `DELETE /api/devices/{id}` - Удаление устройства (ADMIN)
- `PUT /api/devices/{id}/state` - Обновление состояния устройства (для Node-RED)

#### Проксирование на Node-RED
- `POST /api/nodered/control/device/{deviceId}` - Управление устройством (ADMIN, MANAGER, OPERATOR)
- `GET /api/nodered/state/device/{deviceId}` - Получение состояния устройства
- `GET /api/nodered/report/building/{buildingId}` - Отчет по зданию (ADMIN, MANAGER)
- `GET /api/nodered/report/system/{systemType}` - Отчет по системе (ADMIN, MANAGER)
- `ANY /api/nodered/**` - Произвольные запросы к Node-RED

#### Логирование
- `GET /api/audit/recent` - Последние 100 записей лога (ADMIN, MANAGER)
- `GET /api/audit/user/{userId}` - Логи пользователя (ADMIN, MANAGER)
- `GET /api/audit/entity/{entityType}/{entityId}` - Логи сущности (ADMIN, MANAGER)
- `GET /api/audit/period?start=...&end=...` - Логи за период (ADMIN, MANAGER)

### Node-RED Endpoints (примеры)

#### Управление устройствами
- `POST /control/device/{deviceId}` - Отправка команды устройству
  - Body: `{"command": "on", "value": 100}`
  - Результат: отправка команды в MQTT топик `building/{buildingId}/device/{deviceId}/set`

- `GET /state/device/{deviceId}` - Получение состояния устройства
  - Результат: чтение из MQTT топика `building/{buildingId}/device/{deviceId}/state`

#### Отчеты
- `GET /report/building/{buildingId}?reportType=energy&startDate=...&endDate=...`
  - Генерация отчета по потреблению энергии

- `GET /report/system/{systemType}?startDate=...&endDate=...`
  - Генерация отчета по системе (heating, lighting, etc.)

## Базы данных

### PostgreSQL (Backend)
Таблицы:
- `users` - Пользователи
- `roles` - Роли
- `user_roles` - Связь пользователей и ролей
- `buildings` - Здания
- `floors` - Этажи
- `rooms` - Помещения
- `devices` - Устройства
- `system_types` - Типы систем
- `permissions` - Права доступа
- `audit_log` - Журнал аудита

### MQTT (Node-RED)
Топики:
- `building/{buildingId}/device/{deviceId}/state` - Состояние устройства (чтение)
- `building/{buildingId}/device/{deviceId}/set` - Команды устройству (запись)
- `building/{buildingId}/system/{systemType}/state` - Состояние системы
- `building/{buildingId}/events` - События здания

## Безопасность

### Заголовки, передаваемые Node-RED от Backend
Backend добавляет следующие заголовки при проксировании:
- `X-User-Id` - ID пользователя
- `X-User-Name` - Имя пользователя
- `X-User-Roles` - Роли пользователя (через запятую)

Node-RED может использовать эти заголовки для дополнительной проверки прав и логирования.

### Роли и права доступа

| Роль     | Права                                                                 |
|----------|-----------------------------------------------------------------------|
| ADMIN    | Полный доступ ко всем операциям                                       |
| MANAGER  | Управление структурой, просмотр отчетов, управление устройствами      |
| OPERATOR | Управление устройствами, просмотр структуры                           |
| VIEWER   | Только просмотр структуры и состояния устройств                       |

## Логирование

Все действия пользователей логируются в таблицу `audit_log`:
- Создание/изменение/удаление сущностей
- Управление устройствами (через AOP)
- IP адрес пользователя
- Временная метка

## Экспорт/Импорт

Backend поддерживает экспорт и импорт полной конфигурации здания в формате JSON, включая:
- Параметры здания
- Этажи с конфигурацией планов
- Помещения с координатами и размерами
- Устройства с MQTT топиками и настройками

Это позволяет:
- Делать резервные копии конфигурации
- Переносить конфигурацию между инсталляциями
- Шаблонизировать типовые здания
