#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Загрузка демо-данных в БД${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Проверка PostgreSQL
echo -n "🔍 Проверка PostgreSQL... "
if ! sudo systemctl is-active --quiet postgresql; then
    echo -e "${RED}❌ PostgreSQL не запущен${NC}"
    echo ""
    echo "Запустите PostgreSQL:"
    echo "  sudo systemctl start postgresql"
    exit 1
fi
echo -e "${GREEN}✅${NC}"

# Проверка существования БД
echo -n "🔍 Проверка БД building_management... "
if ! sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw building_management; then
    echo -e "${RED}❌ БД не существует${NC}"
    echo ""
    echo "Создайте БД с помощью:"
    echo "  cd backend && ./setup-db.sh"
    exit 1
fi
echo -e "${GREEN}✅${NC}"

# Загрузка данных
echo ""
echo -e "${YELLOW}📥 Загрузка данных из init-data.sql...${NC}"
echo ""

sudo -u postgres psql -d building_management -f init-data.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Данные успешно загружены!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}👤 Учетные данные пользователей:${NC}"
    echo ""
    echo "  Логин: admin    | Пароль: password | Роль: ADMIN"
    echo "  Логин: manager  | Пароль: password | Роль: MANAGER"
    echo "  Логин: operator | Пароль: password | Роль: OPERATOR"
    echo "  Логин: viewer   | Пароль: password | Роль: VIEWER"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo ""
    echo -e "${RED}❌ Ошибка при загрузке данных${NC}"
    exit 1
fi
