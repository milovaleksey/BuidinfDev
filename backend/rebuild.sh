#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔨 Перекомпиляция бэкенда...${NC}"

# Остановить текущий процесс если запущен
pkill -f "building-management"

# Компиляция
echo -e "${YELLOW}📦 Maven clean install...${NC}"
./mvnw clean install -DskipTests

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Компиляция успешна!${NC}"
    echo -e "${YELLOW}🚀 Запуск приложения...${NC}"
    java -jar target/building-management-0.0.1-SNAPSHOT.jar &
    echo -e "${GREEN}✅ Приложение запущено в фоне${NC}"
else
    echo -e "${RED}❌ Ошибка компиляции${NC}"
    exit 1
fi
