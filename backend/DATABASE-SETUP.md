# Настройка PostgreSQL для Building Management System

## Быстрый старт

### Шаг 1: Настройка базы данных

```bash
cd backend
chmod +x setup-db.sh
./setup-db.sh
```

Этот скрипт:
- ✅ Проверит и запустит PostgreSQL
- ✅ Создаст базу данных `building_management`
- ✅ Настроит пользователя `postgres` с паролем `postgres`
- ✅ Проверит подключение

### Шаг 2: Запуск приложения (таблицы создадутся автоматически)

```bash
./start.sh
```

Spring Boot с Hibernate автоматически создаст все таблицы при первом запуске благодаря настройке:
```
spring.jpa.hibernate.ddl-auto=update
```

### Шаг 3 (Опционально): Загрузка демо-данных

После первого успешного запуска приложения (когда таблицы уже созданы), можно загрузить демо-данные:

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d building_management -f init-data.sql
```

Демо-данные включают:
- 4 пользователя (admin, manager, operator, viewer) - все с паролем `password`
- 1 здание "Главный офис"
- 2 этажа
- 2 помещения
- 9 устройств (СКУД, камеры, освещение, отопление, кондиционирование)

---

## Настройки по умолчанию

### База данных
- **Имя БД**: `building_management`
- **Пользователь**: `postgres`
- **Пароль**: `postgres`
- **Хост**: `localhost`
- **Порт**: `5432`

### Пользователи приложения (после загрузки init-data.sql)
| Логин    | Пароль   | Роль     |
|----------|----------|----------|
| admin    | password | ADMIN    |
| manager  | password | MANAGER  |
| operator | password | OPERATOR |
| viewer   | password | VIEWER   |

---

## Изменение настроек

Если вы хотите использовать другие учетные данные:

### 1. Измените `application.properties`

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/your_database_name
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 2. Измените `setup-db.sh`

```bash
DB_NAME="your_database_name"
DB_USER="your_username"
DB_PASSWORD="your_password"
```

---

## Проверка установки

### Проверить статус PostgreSQL
```bash
sudo systemctl status postgresql
```

### Подключиться к БД вручную
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d building_management
```

### Посмотреть созданные таблицы
```sql
\dt
```

Должны быть таблицы:
- `users`
- `buildings`
- `floors`
- `rooms`
- `devices`

### Посмотреть пользователей
```sql
SELECT username, role, email FROM users;
```

---

## Устранение проблем

### Ошибка: "peer authentication failed"

Отредактируйте `/etc/postgresql/*/main/pg_hba.conf`:

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Найдите строку:
```
local   all   postgres   peer
```

Измените на:
```
local   all   postgres   md5
```

Перезапустите PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### Ошибка: "password authentication failed"

Сбросьте пароль:
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

### PostgreSQL не запускается

Проверьте логи:
```bash
sudo journalctl -u postgresql -n 50
```

Переустановите (только в крайнем случае):
```bash
sudo apt-get purge postgresql*
sudo apt-get install postgresql postgresql-contrib
```

---

## Полная очистка данных

⚠️ **ВНИМАНИЕ**: Это удалит ВСЕ данные!

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d building_management -c "
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS floors CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
"
```

После этого перезапустите приложение, чтобы Hibernate пересоздал таблицы.

---

## Бэкап и восстановление

### Создать бэкап
```bash
PGPASSWORD=postgres pg_dump -h localhost -U postgres building_management > backup.sql
```

### Восстановить из бэкапа
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d building_management < backup.sql
```
