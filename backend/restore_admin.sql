-- Скрипт для восстановления админа и проверки данных

\echo '════════════════════════════════════════'
\echo 'ПРОВЕРКА ТЕКУЩЕГО СОСТОЯНИЯ'
\echo '════════════════════════════════════════'

\echo ''
\echo 'Пользователи в базе:'
SELECT id, username, email FROM users;

\echo ''
\echo 'Роли в базе:'
SELECT id, name FROM roles;

\echo ''
\echo 'Текущие назначения ролей:'
SELECT u.username, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id;

\echo ''
\echo '════════════════════════════════════════'
\echo 'СОЗДАНИЕ/ОБНОВЛЕНИЕ РОЛЕЙ'
\echo '════════════════════════════════════════'

-- Убедимся что все роли существуют
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Full system access'),
    ('MANAGER', 'Building management access'),
    ('OPERATOR', 'Device control access'),
    ('VIEWER', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

\echo 'Роли созданы/обновлены'

\echo ''
\echo '════════════════════════════════════════'
\echo 'СОЗДАНИЕ/ОБНОВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ ADMIN'
\echo '════════════════════════════════════════'

-- Проверим существует ли пользователь admin
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE username = 'admin') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Создать пользователя admin если его нет
        -- Пароль: password (BCrypt hash)
        INSERT INTO users (username, password_hash, email, full_name, enabled) 
        VALUES ('admin', '$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK', 
                'admin@building.com', 'Администратор Системы', true);
        RAISE NOTICE 'Пользователь admin создан';
    ELSE
        RAISE NOTICE 'Пользователь admin уже существует';
    END IF;
END $$;

\echo ''
\echo '════════════════════════════════════════'
\echo 'НАЗНАЧЕНИЕ РОЛИ ADMIN'
\echo '════════════════════════════════════════'

-- Удалить все текущие роли admin
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE username = 'admin');

\echo 'Старые роли удалены'

-- Добавить роль ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' AND r.name = 'ADMIN';

\echo 'Роль ADMIN назначена'

\echo ''
\echo '════════════════════════════════════════'
\echo 'ПРОВЕРКА РЕЗУЛЬТАТА'
\echo '════════════════════════════════════════'

\echo ''
\echo 'Пользователь admin с ролями:'
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.enabled,
    r.name as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

\echo ''
\echo '════════════════════════════════════════'
\echo 'ВСЕ ПОЛЬЗОВАТЕЛИ С РОЛЯМИ'
\echo '════════════════════════════════════════'

SELECT 
    u.username,
    u.email,
    u.enabled,
    STRING_AGG(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.email, u.enabled
ORDER BY u.username;

\echo ''
\echo '✅ Готово! Перезайдите в систему.'
