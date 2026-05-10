-- БЕЗОПАСНОЕ ИСПРАВЛЕНИЕ РОЛИ АДМИНИСТРАТОРА
-- Обновляет роли без удаления пользователя (сохраняет audit_log)

\echo '════════════════════════════════════════════════════════════'
\echo 'ИСПРАВЛЕНИЕ РОЛИ АДМИНИСТРАТОРА'
\echo '════════════════════════════════════════════════════════════'

-- ШАГ 1: Убедиться что все роли существуют
\echo ''
\echo 'Шаг 1: Проверка ролей...'

INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Full system access'),
    ('MANAGER', 'Building management access'),
    ('OPERATOR', 'Device control access'),
    ('VIEWER', 'Read-only access')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

\echo '✅ Роли проверены'

-- ШАГ 2: Проверить существует ли пользователь admin
\echo ''
\echo 'Шаг 2: Проверка пользователя admin...'

DO $$
DECLARE
    admin_user_id BIGINT;
BEGIN
    -- Найти или создать пользователя admin
    SELECT id INTO admin_user_id FROM users WHERE username = 'admin';
    
    IF admin_user_id IS NULL THEN
        -- Создать пользователя admin если его нет
        INSERT INTO users (username, password_hash, email, full_name, enabled, created_at, updated_at) 
        VALUES (
            'admin', 
            '$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK', 
            'admin@building.com', 
            'Администратор Системы', 
            true,
            NOW(),
            NOW()
        )
        RETURNING id INTO admin_user_id;
        
        RAISE NOTICE 'Пользователь admin создан с ID: %', admin_user_id;
    ELSE
        -- Обновить пароль и данные существующего пользователя
        UPDATE users 
        SET 
            password_hash = '$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK',
            email = 'admin@building.com',
            full_name = 'Администратор Системы',
            enabled = true,
            updated_at = NOW()
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'Пользователь admin обновлен. ID: %', admin_user_id;
    END IF;
END $$;

\echo '✅ Пользователь admin готов'

-- ШАГ 3: Удалить все старые роли пользователя admin
\echo ''
\echo 'Шаг 3: Очистка старых ролей admin...'

DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE username = 'admin');

\echo '✅ Старые роли удалены'

-- ШАГ 4: Назначить роль ADMIN
\echo ''
\echo 'Шаг 4: Назначение роли ADMIN...'

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' AND r.name = 'ADMIN';

\echo '✅ Роль ADMIN назначена'

-- ШАГ 5: Проверка результата для admin
\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo 'ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ ADMIN'
\echo '════════════════════════════════════════════════════════════'

SELECT 
    u.id as "ID",
    u.username as "Username",
    u.email as "Email",
    u.full_name as "Full Name",
    u.enabled as "Enabled",
    STRING_AGG(r.name, ', ') as "Roles"
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin'
GROUP BY u.id, u.username, u.email, u.full_name, u.enabled;

-- ШАГ 6: Проверить/создать других пользователей
\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo 'ПРОВЕРКА ДРУГИХ ПОЛЬЗОВАТЕЛЕЙ'
\echo '════════════════════════════════════════════════════════════'

-- Manager
INSERT INTO users (username, password_hash, email, full_name, enabled, created_at, updated_at) 
VALUES (
    'manager', 
    '$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK', 
    'manager@building.com', 
    'Менеджер Здания', 
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE username = 'manager');
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'manager' AND r.name = 'MANAGER';

-- Operator
INSERT INTO users (username, password_hash, email, full_name, enabled, created_at, updated_at) 
VALUES (
    'operator', 
    '$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK', 
    'operator@building.com', 
    'Оператор Систем', 
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE username = 'operator');
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'operator' AND r.name = 'OPERATOR';

-- Viewer
INSERT INTO users (username, password_hash, email, full_name, enabled, created_at, updated_at) 
VALUES (
    'viewer', 
    '$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK', 
    'viewer@building.com', 
    'Наблюдатель', 
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;

DELETE FROM user_roles WHERE user_id = (SELECT id FROM users WHERE username = 'viewer');
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'viewer' AND r.name = 'VIEWER';

\echo '✅ Все пользователи обновлены'

-- ШАГ 7: Финальная проверка всех пользователей
\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo 'ВСЕ ПОЛЬЗОВАТЕЛИ С РОЛЯМИ'
\echo '════════════════════════════════════════════════════════════'

SELECT 
    u.username as "Username",
    u.email as "Email",
    u.enabled as "Active",
    STRING_AGG(r.name, ', ' ORDER BY r.name) as "Roles"
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.email, u.enabled
ORDER BY u.username;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '✅ ГОТОВО!'
\echo '════════════════════════════════════════════════════════════'
\echo ''
\echo 'Учетные данные для входа:'
\echo '  Username: admin'
\echo '  Password: password'
\echo ''
\echo '⚠️  ВАЖНО: Выйдите и войдите снова для получения нового токена!'
\echo ''
