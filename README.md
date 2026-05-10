# 🏢 Building Management System

Веб-портал для управления зданиями с авторизацией, ролевой моделью и интеграцией систем СКУД, видеонаблюдения, отопления, освещения и кондиционирования. Поддержка неограниченного количества зданий с иерархической структурой.

## 🎯 Новая архитектура

Система построена по принципу разделения ответственности:

- **Backend (Spring Boot + PostgreSQL)** - "Охранник" и хранитель структуры
  - Авторизация, пользователи, роли
  - Структура проекта (здания, этажи, помещения, устройства)
  - Логирование всех действий
  - Проксирование команд на Node-RED

- **Node-RED** - Исполнитель команд и аналитик
  - Управление устройствами через MQTT
  - Интеграция с закрытыми сетями
  - Генерация отчетов и аналитика

📖 **Подробнее**: [ARCHITECTURE.md](backend/ARCHITECTURE.md)

## 🚀 Быстрый старт

### Автоматическая установка на Linux

```bash
chmod +x install-linux.sh
./install-linux.sh
```

### Ручная установка

См. подробные инструкции:
- **Linux**: [LINUX_SETUP.md](LINUX_SETUP.md)
- **Быстрый старт**: [QUICKSTART.md](QUICKSTART.md)
- **Интеграция с Node-RED**: [QUICK_INTEGRATION_GUIDE.md](QUICK_INTEGRATION_GUIDE.md)

## 📋 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                       │
│            http://localhost:5173                        │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API + JWT
┌──────────────────────▼──────────────────────────────────┐
│           Backend (Spring Boot)                         │
│         http://localhost:8080/api                       │
│  • Авторизация • Структура • Логирование               │
└─────────────┬────────────────────────┬──────────────────┘
              │                        │ Proxy
     ┌────────▼────────┐      ┌────────▼────────┐
     │   PostgreSQL    │      │    Node-RED     │
     │     :5432       │      │     :1880       │
     │  • Users        │      │  • MQTT Control │
     │  • Buildings    │      │  • Reports      │
     │  • Devices      │      │  • Analytics    │
     │  • Audit Log    │      └────────┬────────┘
     └─────────────────┘               │
                                       │ MQTT
                              ┌────────▼────────┐
                              │  MQTT Broker    │
                              │  Mosquitto      │
                              └────────┬────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         │                           │
                    ┌────▼────┐                ┌────▼────┐
                    │ Cameras │                │ Sensors │
                    │ Lights  │                │ HVAC    │
                    └─────────┘                └─────────┘
```

## 🛠️ Технологии

### Frontend
- React 18 + TypeScript
- React Router 7
- Tailwind CSS 4
- Material UI
- Axios для API
- Lucide Icons

### Backend
- Java 17
- Spring Boot 3.2.5
- Spring Security + JWT
- PostgreSQL
- WebClient (Node-RED интеграция)

### Интеграция
- Node-RED для MQTT
- WebSocket для real-time

## 📦 Установка

### Требования

- **Java**: 17+
- **Maven**: 3.6+
- **Node.js**: 20+
- **PostgreSQL**: 12+
- **pnpm**: latest

### 1. PostgreSQL

```bash
# Создать базу
createdb building_management

# Или настроить через psql (см. LINUX_SETUP.md)
```

### 2. Backend

```bash
cd backend

# Настроить application.properties
nano src/main/resources/application.properties

# Изменить:
# - spring.datasource.password
# - jwt.secret

# Запустить
./start.sh
```

### 3. Frontend

```bash
# Установить зависимости
pnpm install

# Запустить dev сервер
pnpm run dev
```

### 4. Создать пользователя

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@building.com","password":"admin123","fullName":"Admin"}'
```

### 5. Войти

Откройте `http://localhost:5173`

Логин: `admin` / Пароль: `admin123`

## 🔐 Роли пользователей

- **ADMIN** - полный доступ ко всей системе
- **MANAGER** - управление зданиями и конфигурацией
- **OPERATOR** - управление устройствами
- **VIEWER** - только просмотр

Права доступа настраиваются:
- По зданиям
- По этажам
- По помещениям
- По системам (СКУД, видео, отопление, освещение, HVAC)

## 📊 Возможности

### Управление объектами
- ✅ Неограниченное количество зданий
- ✅ Иерархическая структура (здание → этаж → помещение)
- ✅ Конструктор планов этажей
- ✅ Прямоугольные помещения с изменяемыми размерами

### Системы здания
- 🔐 **СКУД** - контроль доступа
- 📹 **Видеонаблюдение** - камеры и мониторинг
- 🔥 **Отопление** - управление температурой
- 💡 **Освещение** - управление светом
- ❄️ **Кондиционирование** - климат-контроль

### Устройства
- ✅ Размещение на плане этажа
- ✅ Визуализация по категориям (10 групп)
- ✅ Фильтрация по системам
- ✅ Контекстное меню управления
- ✅ MQTT интеграция (State/Set топики)

### Импорт/Экспорт
- 📥 Экспорт конфигурации в JSON
- 📤 Импорт конфигурации
- 💾 Сохранение в localStorage
- 🔄 Синхронизация с backend

## 🔧 Разработка

### Backend

```bash
cd backend

# Сборка
mvn clean install

# Запуск
mvn spring-boot:run

# Тесты
mvn test

# API документация
http://localhost:8080/api/auth/health
```

### Frontend

```bash
# Dev сервер
pnpm run dev

# Сборка
pnpm run build

# Доступ извне
pnpm run dev -- --host 0.0.0.0
```

### Тестирование backend

```bash
./test-backend.sh
```

## 📝 API Endpoints

### Авторизация
```
POST /auth/login           - Вход
POST /auth/register        - Регистрация
GET  /auth/me              - Текущий пользователь
```

### Структура проекта (Backend)

#### Здания
```
GET    /buildings              - Список зданий
GET    /buildings/{id}         - Детали здания
POST   /buildings              - Создать здание (ADMIN, MANAGER)
PUT    /buildings/{id}         - Обновить здание (ADMIN, MANAGER)
DELETE /buildings/{id}         - Удалить здание (ADMIN)
GET    /buildings/{id}/export  - Экспорт в JSON (ADMIN, MANAGER)
POST   /buildings/import       - Импорт из JSON (ADMIN, MANAGER)
```

#### Этажи
```
GET    /api/floors/building/{buildingId}  - Список этажей
GET    /api/floors/{id}                   - Детали этажа
POST   /api/floors/building/{buildingId}  - Создать этаж (ADMIN, MANAGER)
PUT    /api/floors/{id}                   - Обновить этаж (ADMIN, MANAGER)
DELETE /api/floors/{id}                   - Удалить этаж (ADMIN)
```

#### Помещения
```
GET    /api/rooms/floor/{floorId}  - Список помещений
GET    /api/rooms/{id}             - Детали помещения
POST   /api/rooms/floor/{floorId}  - Создать помещение (ADMIN, MANAGER)
PUT    /api/rooms/{id}             - Обновить помещение (ADMIN, MANAGER)
DELETE /api/rooms/{id}             - Удалить помещение (ADMIN)
```

#### Устройства
```
GET    /api/devices/room/{roomId}  - Список устройств
GET    /api/devices/{id}           - Детали устройства
POST   /api/devices/room/{roomId}  - Создать устройство (ADMIN, MANAGER)
PUT    /api/devices/{id}           - Обновить устройство (ADMIN, MANAGER, OPERATOR)
DELETE /api/devices/{id}           - Удалить устройство (ADMIN)
PUT    /api/devices/{id}/state     - Обновить состояние (для Node-RED)
```

### Управление и отчеты (Node-RED через Backend Proxy)

```
POST /api/nodered/control/device/{deviceId}         - Управление устройством
GET  /api/nodered/state/device/{deviceId}           - Получить состояние
GET  /api/nodered/report/building/{buildingId}      - Отчет по зданию
GET  /api/nodered/report/system/{systemType}        - Отчет по системе
```

### Логирование

```
GET /api/audit/recent                      - Последние 100 логов (ADMIN, MANAGER)
GET /api/audit/user/{userId}               - Логи пользователя (ADMIN, MANAGER)
GET /api/audit/entity/{type}/{id}          - Логи сущности (ADMIN, MANAGER)
GET /api/audit/period?start=...&end=...    - Логи за период (ADMIN, MANAGER)
```

Полная документация:
- [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md) - Архитектура системы
- [QUICK_INTEGRATION_GUIDE.md](QUICK_INTEGRATION_GUIDE.md) - Интеграция с Node-RED
- [NODE_RED_EXAMPLES.md](NODE_RED_EXAMPLES.md) - Примеры Node-RED flows

## 🐳 Docker (TODO)

```bash
# Запуск всего стека
docker-compose up -d

# Остановка
docker-compose down
```

## 📚 Документация

- [QUICKSTART.md](QUICKSTART.md) - Быстрый старт
- [LINUX_SETUP.md](LINUX_SETUP.md) - Установка на Linux
- [backend/README.md](backend/README.md) - Backend документация
- [.env.example](.env.example) - Пример конфигурации

## 🐛 Отладка

### Backend не стартует

```bash
# Проверить PostgreSQL
sudo systemctl status postgresql

# Проверить порт
lsof -i :8080

# Логи
tail -f backend/logs/spring-boot.log
```

### Frontend не подключается

1. Открыть DevTools → Network
2. Проверить запросы к backend
3. Проверить CORS в `application.properties`
4. Проверить `src/app/config/api.ts`

### База пустая

```bash
# Проверить таблицы
psql -U building_user -d building_management -c "\dt"

# Пересоздать схему
psql -U building_user -d building_management -f backend/src/main/resources/schema.sql
```

## 🤝 Разработка

### Структура проекта

```
building-management/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/      # Java код
│   ├── src/main/resources/ # Конфигурация
│   └── pom.xml             # Maven dependencies
├── src/                    # React frontend
│   ├── app/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы
│   │   ├── services/       # API сервисы
│   │   └── types/          # TypeScript типы
│   └── styles/             # Стили
├── QUICKSTART.md           # Быстрый старт
├── LINUX_SETUP.md          # Linux установка
└── install-linux.sh        # Автоустановка
```

## 📄 Лицензия

MIT

## 👥 Контакты

Вопросы и предложения: [GitHub Issues](https://github.com/your-repo/issues)