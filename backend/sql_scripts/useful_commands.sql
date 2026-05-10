-- ============================================
-- Полезные SQL команды для управления
-- ============================================

-- НАЗНАЧЕНИЕ РОЛЕЙ
-- ============================================

-- Дать пользователю роль ADMIN
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'ВАШ_USERNAME' 
  AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Дать пользователю роль MANAGER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'ВАШ_USERNAME' 
  AND r.name = 'MANAGER'
ON CONFLICT DO NOTHING;

-- Дать пользователю роль OPERATOR
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'ВАШ_USERNAME' 
  AND r.name = 'OPERATOR'
ON CONFLICT DO NOTHING;

-- Дать пользователю роль VIEWER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'ВАШ_USERNAME' 
  AND r.name = 'VIEWER'
ON CONFLICT DO NOTHING;


-- УДАЛЕНИЕ РОЛЕЙ
-- ============================================

-- Удалить все роли у пользователя
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE username = 'ВАШ_USERNAME');

-- Удалить конкретную роль у пользователя
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM users WHERE username = 'ВАШ_USERNAME')
  AND role_id = (SELECT id FROM roles WHERE name = 'VIEWER');


-- УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
-- ============================================

-- Активировать пользователя
UPDATE users 
SET enabled = true 
WHERE username = 'ВАШ_USERNAME';

-- Деактивировать пользователя
UPDATE users 
SET enabled = false 
WHERE username = 'ВАШ_USERNAME';

-- Изменить email
UPDATE users 
SET email = 'новый@email.com' 
WHERE username = 'ВАШ_USERNAME';

-- Изменить полное имя
UPDATE users 
SET full_name = 'Новое Имя' 
WHERE username = 'ВАШ_USERNAME';


-- СОЗДАНИЕ ТЕСТОВЫХ ПОЛЬЗОВАТЕЛЕЙ
-- ============================================

-- Создать пользователя (пароль будет хеширован через Spring Security)
-- Используйте лучше API или веб-интерфейс для создания пользователей!

-- Пример для справки:
-- INSERT INTO users (username, email, password_hash, full_name, enabled, created_at, updated_at)
-- VALUES ('test_user', 'test@example.com', '$2a$10$...', 'Test User', true, NOW(), NOW());


-- ПРОВЕРКА ДАННЫХ
-- ============================================

-- Все пользователи
SELECT id, username, email, full_name, enabled FROM users;

-- Все роли
SELECT * FROM roles;

-- Связи пользователей и ролей
SELECT 
    u.username,
    r.name as role
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.username, r.name;
