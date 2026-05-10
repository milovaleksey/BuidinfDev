# 🏢 Building Management System

Веб-портал для управления 5-этажным зданием с авторизацией, ролевой моделью и интеграцией систем СКУД, видеонаблюдения, отопления, освещения и кондиционирования.

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

## 📋 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│              http://localhost:5173                      │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│              Backend (Spring Boot)                      │
│              http://localhost:8080/api                  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│ PostgreSQL  │  │ Node-RED │  │   MQTT   │
│   :5432     │  │  :1880   │  │ Devices  │
└─────────────┘  └──────────┘  └──────────┘
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
POST /api/auth/login       - Вход
POST /api/auth/register    - Регистрация
GET  /api/auth/me          - Текущий пользователь
GET  /api/auth/health      - Проверка работы
```

### Здания
```
GET    /api/buildings           - Список зданий
GET    /api/buildings/{id}      - Детали здания
POST   /api/buildings           - Создать здание
PUT    /api/buildings/{id}      - Обновить здание
DELETE /api/buildings/{id}      - Удалить здание
```

### Устройства
```
GET  /api/devices                       - Все устройства
GET  /api/devices/{id}                  - Устройство
POST /api/devices/{id}/command          - Отправить команду
GET  /api/devices/building/{buildingId} - Устройства здания
```

Полная документация: [backend/README.md](backend/README.md)

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
