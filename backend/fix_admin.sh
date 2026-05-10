#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Исправление роли администратора...${NC}"

# Выполнить SQL скрипт
docker exec -i building-postgres psql -U building_user -d building_management < fix_admin_role.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Роль администратора исправлена!${NC}"
    echo -e "${YELLOW}Перезайдите в систему для применения изменений${NC}"
else
    echo -e "${RED}❌ Ошибка при выполнении SQL скрипта${NC}"
    exit 1
fi
