# Подключение pgAdmin к PostgreSQL

## Быстрая настройка

### 1. Разрешить доступ к PostgreSQL

```bash
cd backend
chmod +x enable-remote-access.sh
./enable-remote-access.sh
```

Скрипт автоматически:
- Создаст резервные копии конфигураций
- Настроит `postgresql.conf` (listen_addresses)
- Настроит `pg_hba.conf` (разрешения подключений)
- Перезапустит PostgreSQL

### 2. Параметры подключения

В pgAdmin создайте новое подключение со следующими параметрами:

| Параметр | Значение |
|----------|----------|
| **Host** | `localhost` или `127.0.0.1` |
| **Port** | `5432` |
| **Database** | `building_management` |
| **Username** | `postgres` |
| **Password** | `postgres` |

### 3. Создание подключения в pgAdmin

1. Откройте pgAdmin
2. Правой кнопкой мыши на **"Servers"** → **"Register"** → **"Server"**
3. **Вкладка "General":**
   - Name: `Building Management System`
4. **Вкладка "Connection":**
   - Host name/address: `localhost`
   - Port: `5432`
   - Maintenance database: `building_management`
   - Username: `postgres`
   - Password: `postgres`
   - ✅ Save password
5. Нажмите **"Save"**

### 4. Исправление роли admin

После подключения выполните SQL:

```sql
-- Удаляем старые роли admin
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE username = 'admin');

-- Добавляем роль ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ADMIN';

-- Проверяем результат
SELECT u.username, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';
```

## Ручная настройка (если скрипт не работает)

### Найти конфигурационные файлы:

```bash
sudo find /etc/postgresql -name postgresql.conf
sudo find /etc/postgresql -name pg_hba.conf
```

### Отредактировать postgresql.conf:

```bash
sudo nano /etc/postgresql/[VERSION]/main/postgresql.conf
```

Найдите и измените:
```
listen_addresses = '*'
```

### Отредактировать pg_hba.conf:

```bash
sudo nano /etc/postgresql/[VERSION]/main/pg_hba.conf
```

Добавьте в конец файла:
```
# Локальный доступ с паролем
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### Перезапустить PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Проверить статус:

```bash
sudo systemctl status postgresql
sudo netstat -tulpn | grep 5432
```

## Структура базы данных

После подключения вы увидите следующие таблицы:

- `users` - пользователи системы
- `roles` - роли (ADMIN, MANAGER, OPERATOR, VIEWER)
- `user_roles` - связь пользователей и ролей
- `buildings` - здания
- `floors` - этажи
- `rooms` - помещения
- `devices` - устройства
- `system_types` - типы систем
- `audit_logs` - журнал аудита

## Полезные запросы

### Просмотр всех пользователей с ролями:

```sql
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.enabled,
    STRING_AGG(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.email, u.full_name, u.enabled
ORDER BY u.id;
```

### Просмотр структуры здания:

```sql
SELECT 
    b.name as building,
    f.number as floor,
    r.number as room,
    r.name as room_name
FROM buildings b
LEFT JOIN floors f ON b.id = f.building_id
LEFT JOIN rooms r ON f.id = r.floor_id
ORDER BY b.id, f.number, r.number;
```

### Просмотр всех устройств:

```sql
SELECT 
    d.name as device,
    st.name as system,
    r.number as room,
    f.number as floor,
    d.mqtt_topic,
    d.state
FROM devices d
LEFT JOIN system_types st ON d.system_type_id = st.id
LEFT JOIN rooms r ON d.room_id = r.id
LEFT JOIN floors f ON r.floor_id = f.id
ORDER BY st.name, f.number, r.number;
```
