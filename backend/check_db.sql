-- Проверяем всех пользователей
SELECT 'Все пользователи:' as info;
SELECT id, username, email, full_name FROM users;

-- Проверяем все роли
SELECT 'Все роли:' as info;
SELECT id, name, description FROM roles;

-- Проверяем связи пользователей и ролей
SELECT 'Текущие назначения ролей:' as info;
SELECT u.username, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
