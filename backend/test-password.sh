#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 Проверка паролей в БД${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}👥 Пользователи и их пароли:${NC}"
echo ""

sudo -u postgres psql -d building_management << 'EOF'
\pset border 2

SELECT 
    u.id,
    u.username as "Логин",
    u.email as "Email",
    CASE 
        WHEN u.password_hash LIKE '$2a$%' OR u.password_hash LIKE '$2b$%' 
        THEN '✅ BCrypt хеш'
        ELSE '❌ Не BCrypt'
    END as "Тип пароля",
    LEFT(u.password_hash, 30) || '...' as "Начало хеша",
    u.enabled as "Активен"
FROM users u
ORDER BY u.username;

EOF

echo ""
echo -e "${YELLOW}🎭 Роли пользователей:${NC}"
echo ""

sudo -u postgres psql -d building_management << 'EOF'
\pset border 2

SELECT 
    u.username as "Логин",
    STRING_AGG(r.name, ', ') as "Роли"
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.username
ORDER BY u.username;

EOF

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}🧪 Тест пароля:${NC}"
echo ""
echo "Ожидаемый BCrypt хеш для пароля 'password':"
echo "\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
echo ""

ACTUAL_HASH=$(sudo -u postgres psql -d building_management -t -A -c "SELECT password_hash FROM users WHERE username='admin' LIMIT 1;")

echo "Реальный хеш в БД для admin:"
echo "$ACTUAL_HASH"
echo ""

if [ "$ACTUAL_HASH" = "\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" ]; then
    echo -e "${GREEN}✅ Хеши совпадают!${NC}"
else
    echo -e "${RED}❌ Хеши НЕ совпадают!${NC}"
    echo ""
    echo -e "${YELLOW}Решение: Перезагрузите демо-данные:${NC}"
    echo "cd backend"
    echo "./load-demo-data.sh"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
