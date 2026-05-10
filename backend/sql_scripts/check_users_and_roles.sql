-- ============================================
-- Проверка всех пользователей и их ролей
-- ============================================

-- 1. Все пользователи с их ролями
SELECT 
    u.id,
    u.username,
    u.email,
    u.full_name,
    u.enabled,
    STRING_AGG(r.name, ', ') as roles,
    u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.email, u.full_name, u.enabled, u.created_at
ORDER BY u.id;

-- 2. Список всех ролей
SELECT * FROM roles ORDER BY id;

-- 3. Пользователи без ролей
SELECT u.id, u.username, u.email
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;

-- 4. Количество пользователей по ролям
SELECT r.name, COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.name
ORDER BY user_count DESC;
