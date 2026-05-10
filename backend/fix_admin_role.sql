-- Проверяем текущие роли admin
SELECT u.id, u.username, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

-- Удаляем все текущие роли admin
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE username = 'admin');

-- Добавляем роль ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' 
AND r.name = 'ADMIN';

-- Проверяем результат
SELECT u.id, u.username, u.email, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';
