#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 Срочное исправление пароля admin${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Правильный хеш для пароля "password"
CORRECT_HASH='$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK'

echo -e "${YELLOW}Текущий хеш в БД:${NC}"
CURRENT_HASH=$(sudo -u postgres psql -d building_management -t -A -c "SELECT password_hash FROM users WHERE username='admin';")
echo "$CURRENT_HASH"
echo ""

echo -e "${YELLOW}Правильный хеш (для пароля 'password'):${NC}"
echo "$CORRECT_HASH"
echo ""

if [ "$CURRENT_HASH" = "$CORRECT_HASH" ]; then
    echo -e "${GREEN}✅ Хеш уже правильный! Проблема в чём-то другом.${NC}"
    echo ""
    echo "Проверяем статус пользователя..."
    
    sudo -u postgres psql -d building_management << 'EOF'
\pset border 2
SELECT 
    id,
    username,
    enabled,
    LEFT(password_hash, 30) || '...' as password_start
FROM users 
WHERE username='admin';
EOF
    
else
    echo -e "${RED}❌ Хеш неправильный!${NC}"
    echo ""
    echo -e "${YELLOW}Обновляю пароль прямо в БД...${NC}"
    
    sudo -u postgres psql -d building_management << EOF
UPDATE users 
SET password_hash = '$CORRECT_HASH'
WHERE username = 'admin';

SELECT 'Обновлено строк: ' || COUNT(*) as result
FROM users 
WHERE username = 'admin' AND password_hash = '$CORRECT_HASH';
EOF
    
    echo ""
    echo -e "${GREEN}✅ Пароль обновлен!${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}🧪 Тестируем авторизацию...${NC}"
echo ""

MY_IP=$(hostname -I | awk '{print $1}')

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://$MY_IP:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP код: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅✅✅ УСПЕХ! Авторизация работает!${NC}"
    echo ""
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Всё ещё ошибка${NC}"
    echo ""
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo -e "${YELLOW}Дополнительная диагностика...${NC}"
    echo ""
    
    # Проверяем включен ли пользователь
    ENABLED=$(sudo -u postgres psql -d building_management -t -A -c "SELECT enabled FROM users WHERE username='admin';")
    echo "Пользователь активен (enabled): $ENABLED"
    
    # Проверяем роли
    echo ""
    echo "Роли пользователя:"
    sudo -u postgres psql -d building_management -t -A -c "SELECT r.name FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.username='admin';"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
