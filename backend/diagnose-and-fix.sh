#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 Диагностика и исправление проблем авторизации${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$(dirname "$0")"

# Шаг 1: Проверка PostgreSQL
echo -e "${CYAN}[1/5] Проверка PostgreSQL...${NC}"
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL запущен${NC}"
else
    echo -e "${RED}❌ PostgreSQL остановлен${NC}"
    echo "Запуск PostgreSQL..."
    sudo systemctl start postgresql
    sleep 2
fi
echo ""

# Шаг 2: Проверка БД
echo -e "${CYAN}[2/5] Проверка базы данных...${NC}"
DB_EXISTS=$(sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -w building_management | wc -l)
if [ "$DB_EXISTS" -eq 1 ]; then
    echo -e "${GREEN}✅ БД building_management существует${NC}"
else
    echo -e "${RED}❌ БД building_management не найдена${NC}"
    echo "Нужно создать БД! Запустите: ./init-db.sh"
    exit 1
fi
echo ""

# Шаг 3: Проверка пользователей
echo -e "${CYAN}[3/5] Проверка пользователей...${NC}"
USER_COUNT=$(sudo -u postgres psql -d building_management -t -A -c "SELECT COUNT(*) FROM users;")
echo "Найдено пользователей: $USER_COUNT"

if [ "$USER_COUNT" -eq 0 ]; then
    echo -e "${RED}❌ Пользователей нет в БД${NC}"
    NEED_RELOAD=true
else
    echo -e "${GREEN}✅ Пользователи найдены${NC}"
    
    # Проверка хеша пароля admin
    echo ""
    echo "Проверка хеша пароля admin..."
    ADMIN_HASH=$(sudo -u postgres psql -d building_management -t -A -c "SELECT password_hash FROM users WHERE username='admin' LIMIT 1;")
    EXPECTED_HASH='$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK'
    
    if [ "$ADMIN_HASH" = "$EXPECTED_HASH" ]; then
        echo -e "${GREEN}✅ Хеш пароля корректный${NC}"
        NEED_RELOAD=false
    else
        echo -e "${RED}❌ Хеш пароля некорректный${NC}"
        echo ""
        echo "Ожидается: $EXPECTED_HASH"
        echo "Получено:  $ADMIN_HASH"
        NEED_RELOAD=true
    fi
fi
echo ""

# Шаг 4: Перезагрузка данных если нужно
if [ "$NEED_RELOAD" = true ]; then
    echo -e "${CYAN}[4/5] Перезагрузка демо-данных...${NC}"
    echo ""
    read -p "Перезагрузить демо-данные? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${YELLOW}Загрузка демо-данных...${NC}"
        ./load-demo-data.sh
        echo ""
        echo -e "${GREEN}✅ Демо-данные загружены${NC}"
    else
        echo -e "${YELLOW}⚠️  Пропуск перезагрузки данных${NC}"
    fi
else
    echo -e "${CYAN}[4/5] Демо-данные в порядке${NC}"
    echo -e "${GREEN}✅ Пропуск перезагрузки${NC}"
fi
echo ""

# Шаг 5: Проверка ролей
echo -e "${CYAN}[5/5] Проверка ролей пользователей...${NC}"
echo ""

sudo -u postgres psql -d building_management << 'EOF'
\pset border 2
SELECT 
    u.username as "Логин",
    u.email as "Email",
    STRING_AGG(r.name, ', ') as "Роли",
    u.enabled as "Активен"
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.username, u.email, u.enabled
ORDER BY u.username;
EOF

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}🧪 Тест авторизации:${NC}"
echo ""

MY_IP=$(hostname -I | awk '{print $1}')

echo "Отправка запроса на http://$MY_IP:8080/api/auth/login ..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://$MY_IP:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP код: $HTTP_CODE"
echo "Ответ:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅✅✅ УСПЕХ! Авторизация работает!${NC}"
    echo ""
    echo "Можете войти через фронтенд:"
    echo "  URL: http://$MY_IP:5173"
    echo "  Логин: admin"
    echo "  Пароль: password"
elif [ "$HTTP_CODE" = "403" ] || [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}❌ Ошибка авторизации (неверные учетные данные)${NC}"
    echo ""
    echo -e "${YELLOW}Возможные причины:${NC}"
    echo "1. Неверный хеш пароля в БД"
    echo "2. Пользователь не активирован (enabled=false)"
    echo "3. У пользователя нет ролей"
    echo ""
    echo "Попробуйте перезагрузить демо-данные:"
    echo "  ./load-demo-data.sh"
else
    echo -e "${RED}❌ Ошибка соединения (код $HTTP_CODE)${NC}"
    echo ""
    echo "Проверьте что бэкенд запущен:"
    echo "  ./start.sh"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"