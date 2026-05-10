-- ============================================
-- Исправление роли администратора
-- ============================================

-- Шаг 1: Проверяем текущие роли admin
SELECT 
    u.username,
    u.email,
    STRING_AGG(r.name, ', ') as current_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin'
GROUP BY u.username, u.email;

-- Шаг 2: Удаляем все текущие роли admin
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE username = 'admin');

-- Шаг 3: Добавляем роль ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' 
  AND r.name = 'ADMIN';

-- Шаг 4: Проверяем результат
SELECT 
    u.username,
    u.email,
    STRING_AGG(r.name, ', ') as new_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin'
GROUP BY u.username, u.email;
