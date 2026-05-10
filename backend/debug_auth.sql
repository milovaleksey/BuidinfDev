-- Полная диагностика проблемы авторизации

\echo '════════════════════════════════════════════════════════════'
\echo '1. ПРОВЕРКА ТАБЛИЦЫ USERS'
\echo '════════════════════════════════════════════════════════════'
SELECT 
    id,
    username,
    email,
    full_name,
    enabled,
    created_at
FROM users
ORDER BY id;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '2. ПРОВЕРКА ТАБЛИЦЫ ROLES'
\echo '════════════════════════════════════════════════════════════'
SELECT 
    id,
    name,
    description,
    created_at
FROM roles
ORDER BY id;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '3. ПРОВЕРКА ТАБЛИЦЫ USER_ROLES'
\echo '════════════════════════════════════════════════════════════'
SELECT 
    ur.id,
    ur.user_id,
    ur.role_id,
    u.username,
    r.name as role_name
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.username, r.name;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '4. ВСЕ ПОЛЬЗОВАТЕЛИ С ИХ РОЛЯМИ (АГРЕГИРОВАННЫЕ)'
\echo '════════════════════════════════════════════════════════════'
SELECT 
    u.id,
    u.username,
    u.email,
    u.enabled,
    STRING_AGG(r.name, ', ' ORDER BY r.name) as roles,
    COUNT(r.id) as roles_count
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.email, u.enabled
ORDER BY u.username;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '5. СПЕЦИАЛЬНАЯ ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ ADMIN'
\echo '════════════════════════════════════════════════════════════'
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.enabled,
    u.password_hash,
    ur.id as user_role_id,
    ur.role_id,
    r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '6. ПРОВЕРКА СУЩЕСТВОВАНИЯ СВЯЗЕЙ'
\echo '════════════════════════════════════════════════════════════'
\echo 'Количество пользователей:'
SELECT COUNT(*) FROM users;

\echo ''
\echo 'Количество ролей:'
SELECT COUNT(*) FROM roles;

\echo ''
\echo 'Количество связей пользователь-роль:'
SELECT COUNT(*) FROM user_roles;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo '7. ПОЛЬЗОВАТЕЛИ БЕЗ РОЛЕЙ'
\echo '════════════════════════════════════════════════════════════'
SELECT 
    u.id,
    u.username,
    u.email
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL;

\echo ''
\echo '════════════════════════════════════════════════════════════'
\echo 'ГОТОВО'
\echo '════════════════════════════════════════════════════════════'
