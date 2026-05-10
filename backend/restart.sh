#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔄 Перезапуск Backend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Остановка старого процесса
echo -n "🛑 Остановка старого процесса... "
pkill -f "spring-boot:run" 2>/dev/null
pkill -f "building-management" 2>/dev/null
sleep 2
echo -e "${GREEN}✅${NC}"

# Запуск нового
echo ""
echo -e "${YELLOW}🚀 Запуск Backend...${NC}"
echo ""

./start.sh
