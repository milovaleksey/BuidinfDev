-- ПОЛНОЕ ИСПРАВЛЕНИЕ РОЛИ АДМИНИСТРАТОРА
-- Этот скрипт гарантированно создаст/обновит пользователя admin с ролью ADMIN

BEGIN;

\echo '════════════════════════════════════════════════════════════'
\echo 'НАЧАЛО ИСПРАВЛЕНИЯ АДМИНИСТРАТОРА'
\echo '════════════════════════════════════════════════════════════'

-- ШАГ 1: Убедиться что все роли существуют
\echo ''
\echo 'Шаг 1: Создание ролей если их нет...'

INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Full system access'),
    ('MANAGER', 'Building management access'),
    ('OPERATOR', 'Device control access'),
    ('VIEWER', 'Read-only access')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description;

\echo '✅ Роли проверены/созданы'

-- ШАГ 2: Удалить старого админа и создать заново
\echo ''
\echo 'Шаг 2: Удаление старого admin...'

-- Удаляем все связи пользователя admin
DELETE FROM user_roles 
WHERE user_id IN (SELECT id FROM users WHERE username = 'admin');

-- Удаляем самого пользователя admin
DELETE FROM users WHERE username = 'admin';

\echo '✅ Старые данные удалены'

-- ШАГ 3: Создать нового пользователя admin
\echo ''
\echo 'Шаг 3: Создание нового пользователя admin...'

-- Создать пользователя admin
-- Пароль: password (BCrypt hash: $2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK)
INSERT INTO users (username, password_hash, email, full_name, enabled, created_at, updated_at) 
VALUES (
    'admin', 
    '$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK', 
    'admin@building.com', 
    'Администратор Системы', 
    true,
    NOW(),
    NOW()
);

\echo '✅ Пользователь admin создан'

-- ШАГ 4: Назначить роль ADMIN
\echo ''
\echo 'Шаг 4: Назначение роли ADMIN...'

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' AND r.name = 'ADMIN';

\echo '✅ Роль ADMIN назначена'

-- ШАГ 5: Проверка результата
\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo 'ПРОВЕРКА РЕЗУЛЬТАТА'
\echo '════════════════════════════════════════════════════════════'

SELECT 
    u.id as "ID",
    u.username as "Username",
    u.email as "Email",
    u.full_name as "Full Name",
    u.enabled as "Enabled",
    r.name as "Role"
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

-- ШАГ 6: Создать других тестовых пользователей если их нет
\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo 'СОЗДАНИЕ ДРУГИХ ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ'
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

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'manager' AND r.name = 'MANAGER'
ON CONFLICT DO NOTHING;

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

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'operator' AND r.name = 'OPERATOR'
ON CONFLICT DO NOTHING;

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

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'viewer' AND r.name = 'VIEWER'
ON CONFLICT DO NOTHING;

\echo '✅ Тестовые пользователи созданы'

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

COMMIT;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '✅ ГОТОВО!'
\echo '════════════════════════════════════════════════════════════'
\echo ''
\echo 'Учетные данные для входа:'
\echo '  Username: admin'
\echo '  Password: password'
\echo ''
\echo '⚠️  ВАЖНО: Перезайдите в систему для получения нового токена!'
\echo ''
