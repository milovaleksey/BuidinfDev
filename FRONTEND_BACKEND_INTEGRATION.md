# Интеграция Фронтенда с Бэкендом

## Архитектура

Проект использует разделение ответственности между фронтендом и бэкендом:

### Бэкенд (Spring Boot + PostgreSQL)
- **Хранение данных**: Структура зданий, этажей, помещений и устройств хранится в PostgreSQL
- **Авторизация**: JWT-based аутентификация с ролевой моделью
- **CRUD API**: RESTful endpoints для управления сущностями
- **Аудит**: Логирование всех действий пользователей
- **Проксирование**: ProxyController для передачи команд управления в Node-RED

### Фронтенд (React + TypeScript)
- **UI/UX**: Пользовательский интерфейс
- **Кэширование**: Локальный кэш данных для быстрого доступа
- **Оффлайн режим**: Работа с localStorage при отсутствии подключения к бэкенду

### Node-RED
- **Бизнес-логика**: Обработка команд управления устройствами
- **MQTT**: Взаимодействие с физическими устройствами
- **Отчеты**: Генерация отчетов и аналитики

## Сервисы Фронтенда

### 1. IntegratedBuildingService
**Основной сервис для работы с данными зданий**

```typescript
import { integratedBuildingService } from './services/IntegratedBuildingService';

// Инициализация (загрузка данных из бэкенда)
await integratedBuildingService.init();

// Получение всех зданий
const buildings = integratedBuildingService.getAllBuildings();

// Создание нового здания
const building = await integratedBuildingService.createBuilding('Офис', 'Москва, ул. Ленина 1');

// Добавление этажа
const floor = await integratedBuildingService.addFloor(buildingId, 'Этаж 1', 1);

// Удаление
await integratedBuildingService.deleteBuilding(buildingId);
await integratedBuildingService.deleteFloor(floorId);
```

**Особенности:**
- Автоматическая загрузка данных из бэкенда при старте
- Кэширование в памяти для быстрого доступа
- Сохранение в localStorage для оффлайн работы
- Асинхронная синхронизация изменений с бэкендом

### 2. BackendApiService
**Low-level сервис для прямого взаимодействия с REST API бэкенда**

```typescript
import { backendApiService } from './services/BackendApiService';

// CRUD операции для зданий
const buildings = await backendApiService.getAllBuildings();
const building = await backendApiService.getBuilding(id);
const newBuilding = await backendApiService.createBuilding({ name, address });
await backendApiService.updateBuilding(id, updates);
await backendApiService.deleteBuilding(id);

// Экспорт/Импорт
const data = await backendApiService.exportBuilding(id);
await backendApiService.importBuilding(data);

// Аналогичные методы для Floors, Rooms, Devices
```

### 3. NodeRedService
**Сервис для управления устройствами через Node-RED**

```typescript
import { nodeRedService } from './services/NodeRedService';

// Отправка команды устройству
await nodeRedService.sendDeviceCommand(deviceId, {
  action: 'turn_on',
  parameters: { brightness: 80 }
});

// Получение состояния устройства
const state = await nodeRedService.getDeviceState(deviceId);

// Получение отчетов
const report = await nodeRedService.getBuildingReport(buildingId, {
  reportType: 'energy',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

### 4. ApiClient
**Axios wrapper с автоматической обработкой JWT токенов**

Используется внутри других сервисов. Автоматически:
- Добавляет Authorization header
- Обрабатывает ошибки 401 (перенаправление на логин)
- Управляет токенами в localStorage

## API Endpoints

### Структура URL
```
BASE_URL: http://localhost:8080/api
```

### Здания (Buildings)
```
GET    /buildings           - Получить все здания
GET    /buildings/:id       - Получить здание по ID
POST   /buildings           - Создать здание
PUT    /buildings/:id       - Обновить здание
DELETE /buildings/:id       - Удалить здание
GET    /buildings/:id/export - Экспорт здания в JSON
POST   /buildings/import    - Импорт здания из JSON
```

### Этажи (Floors)
```
GET    /floors/building/:buildingId - Получить все этажи здания
GET    /floors/:id                  - Получить этаж по ID
POST   /floors/building/:buildingId - Создать этаж
PUT    /floors/:id                  - Обновить этаж
DELETE /floors/:id                  - Удалить этаж
```

### Помещения (Rooms)
```
GET    /rooms/floor/:floorId - Получить все помещения этажа
GET    /rooms/:id            - Получить помещение по ID
POST   /rooms/floor/:floorId - Создать помещение
PUT    /rooms/:id            - Обновить помещение
DELETE /rooms/:id            - Удалить помещение
```

### Устройства (Devices)
```
GET    /devices/room/:roomId      - Получить все устройства помещения
GET    /devices/:id               - Получить устройство по ID
POST   /devices/room/:roomId      - Создать устройство
PUT    /devices/:id               - Обновить устройство
PUT    /devices/:id/state         - Обновить состояние устройства
DELETE /devices/:id               - Удалить устройство
GET    /devices/building/:buildingId - Получить все устройства здания
```

### Node-RED Proxy
```
POST   /proxy/control/:deviceId         - Отправить команду устройству
GET    /proxy/state/:deviceId           - Получить состояние устройства
GET    /proxy/reports/building/:id      - Отчет по зданию
GET    /proxy/reports/system/:type      - Отчет по системе
```

### Аудит
```
GET    /audit/logs    - Получить лог действий
GET    /audit/logs/:id - Получить запись лога по ID
```

## Компоненты

### DataLoader
HOC компонент для инициализации данных при старте приложения.

Используется в `routes.tsx` для оборачивания защищенных маршрутов:
```typescript
<ProtectedRoute>
  <DataLoader>
    <YourComponent />
  </DataLoader>
</ProtectedRoute>
```

**Функционал:**
- Загрузка данных из бэкенда при монтировании
- Показ экрана загрузки
- Обработка ошибок с возможностью повторной попытки

## Поток Данных

### При запуске приложения
1. Пользователь логинится → получает JWT токен
2. DataLoader инициализирует IntegratedBuildingService
3. IntegratedBuildingService загружает данные из бэкенда:
   - Все здания
   - Для каждого здания - все этажи
   - Для каждого этажа - все помещения
   - Для каждого помещения - все устройства
4. Данные кэшируются в памяти и сохраняются в localStorage
5. UI отображает загруженные данные

### При изменении данных
1. Пользователь вносит изменения в UI
2. IntegratedBuildingService обновляет локальный кэш (мгновенно)
3. Асинхронно отправляет изменения в бэкенд через BackendApiService
4. Бэкенд сохраняет в БД и логирует действие
5. При ошибке - показывается уведомление

### Управление устройствами
1. Пользователь нажимает кнопку управления устройством
2. NodeRedService отправляет команду через ProxyController бэкенда
3. Бэкенд логирует действие и проксирует запрос в Node-RED
4. Node-RED обрабатывает логику и отправляет MQTT команду
5. Устройство меняет состояние
6. Node-RED отправляет обратно новое состояние
7. Фронтенд обновляет UI

## Оффлайн Режим

Если бэкенд недоступен:
1. Используются данные из localStorage
2. Изменения сохраняются локально
3. Показывается предупреждение о работе в оффлайн режиме
4. При восстановлении связи - данные можно синхронизировать

## Типы Данных

Все TypeScript типы определены в `/src/app/types/index.ts`:
- `Building` - Здание
- `Floor` - Этаж
- `Room` - Помещение
- `Device` - Устройство
- `User` - Пользователь
- `DeviceData` - Данные устройства
- И другие...

## Безопасность

- JWT токены хранятся в localStorage
- Все API запросы содержат Authorization header
- При 401 ошибке - автоматический редирект на /login
- Ролевая модель на бэкенде (admin, manager, operator, viewer)
- CORS настроен для localhost:5173 и localhost:3000

## Разработка

### Запуск бэкенда
```bash
cd backend
./start.sh
```

### Запуск фронтенда
```bash
./start-frontend.sh
```

### Структура проекта
```
/backend/               - Spring Boot бэкенд
  /src/main/java/       - Java код
  /src/main/resources/  - Конфигурация
/src/app/               - React фронтенд
  /services/            - Сервисы
  /components/          - Компоненты
  /pages/               - Страницы
  /types/               - TypeScript типы
```

## Отладка

### Логи бэкенда
```bash
tail -f backend/logs/application.log
```

### Логи фронтенда
Открыть DevTools в браузере (F12) → Console

### Проверка API
```bash
# Получить токен
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Использовать токен
curl http://localhost:8080/api/buildings \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### Ошибка "401 Unauthorized"
- Проверьте, что вы авторизованы
- Проверьте срок действия JWT токена (24 часа)
- Перелогиньтесь

### Ошибка "Cannot load data from backend"
- Проверьте, что бэкенд запущен на http://localhost:8080
- Проверьте PostgreSQL: `psql -U postgres -d building_management`
- Проверьте логи бэкенда

### Пустой список зданий
- Создайте первое здание через UI
- Или импортируйте из JSON файла
- Или используйте дефолтные данные (автоматически создаются)

## Будущие улучшения

- [ ] WebSocket для real-time обновлений состояний устройств
- [ ] Batch синхронизация изменений при восстановлении связи
- [ ] Оптимистичные обновления UI
- [ ] Кэширование с TTL
- [ ] Pagination для больших списков
- [ ] GraphQL вместо REST API
