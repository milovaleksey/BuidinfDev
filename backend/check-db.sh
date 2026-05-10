#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Проверка базы данных${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Проверка PostgreSQL
echo -n "🗄️  PostgreSQL: "
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ Запущен${NC}"
else
    echo -e "${RED}❌ Остановлен${NC}"
    exit 1
fi

# Проверка существования БД
echo -n "📊 БД building_management: "
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw building_management; then
    echo -e "${GREEN}✅ Существует${NC}"
else
    echo -e "${RED}❌ Не существует${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📈 Статистика данных:${NC}"
echo ""

# Запрос к БД
sudo -u postgres psql -d building_management << 'EOF'
\pset border 2

SELECT 'Пользователи' as "Таблица", COUNT(*) as "Количество" FROM users
UNION ALL
SELECT 'Здания', COUNT(*) FROM buildings
UNION ALL
SELECT 'Этажи', COUNT(*) FROM floors
UNION ALL
SELECT 'Помещения', COUNT(*) FROM rooms
UNION ALL
SELECT 'Устройства', COUNT(*) FROM devices;

EOF

echo ""
echo -e "${YELLOW}👥 Список пользователей:${NC}"
echo ""

sudo -u postgres psql -d building_management << 'EOF'
\pset border 2
SELECT username as "Логин", role as "Роль", email as "Email", enabled as "Активен" FROM users ORDER BY username;
EOF

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
