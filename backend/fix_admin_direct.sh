#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Исправление роли администратора...${NC}"

# Выполнить SQL команды напрямую
docker exec building-postgres psql -U building_user -d building_management <<EOF

-- Показываем текущие роли admin
SELECT 'Текущие роли admin:' as info;
SELECT u.username, r.name as role_name
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
SELECT 'Новые роли admin:' as info;
SELECT u.username, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin';

EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Роль администратора исправлена!${NC}"
    echo -e "${YELLOW}💡 Перезайдите в систему для применения изменений${NC}"
else
    echo -e "${RED}❌ Ошибка при выполнении SQL скрипта${NC}"
    exit 1
fi
