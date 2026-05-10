#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MY_IP=$(hostname -I | awk '{print $1}')

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Проверка Building Management System${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📍 IP сервера:${NC} $MY_IP"
echo ""

# Проверка PostgreSQL
echo -n "🗄️  PostgreSQL (5432): "
if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ Запущен${NC}"
else
    echo -e "${RED}❌ Остановлен${NC}"
fi

# Проверка Backend
echo -n "⚙️  Backend (8080): "
if curl -s http://$MY_IP:8080/api/auth/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Работает${NC}"
    BACKEND_OK=1
else
    echo -e "${RED}❌ Недоступен${NC}"
    BACKEND_OK=0
fi

# Проверка Frontend
echo -n "🌐 Frontend (5173): "
if curl -s http://$MY_IP:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Работает${NC}"
    FRONTEND_OK=1
else
    echo -e "${RED}❌ Недоступен${NC}"
    FRONTEND_OK=0
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Проверка портов
echo ""
echo -e "${YELLOW}📊 Открытые порты:${NC}"
netstat -tuln 2>/dev/null | grep -E ':(5173|8080|5432)' | awk '{print "   "$4}' || echo "   Команда netstat недоступна"

# Проверка firewall
echo ""
echo -e "${YELLOW}🔥 Firewall:${NC}"
if command -v ufw &> /dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        echo -e "   ${YELLOW}Активен${NC}"
        sudo ufw status | grep -E '(5173|8080)' || echo -e "   ${RED}⚠️  Порты 5173, 8080 не открыты!${NC}"
    else
        echo -e "   ${GREEN}Выключен${NC}"
    fi
else
    echo "   ufw не установлен"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Итоговый статус
echo ""
if [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ]; then
    echo -e "${GREEN}✅ Система полностью готова!${NC}"
    echo ""
    echo -e "${YELLOW}🌐 Откройте в браузере:${NC}"
    echo -e "   ${BLUE}http://$MY_IP:5173${NC}"
    echo ""
    echo -e "${YELLOW}👤 Учетные данные (после загрузки demo-данных):${NC}"
    echo "   Логин: admin"
    echo "   Пароль: password"
else
    echo -e "${RED}❌ Система работает не полностью${NC}"
    echo ""
    echo -e "${YELLOW}Рекомендации:${NC}"
    
    if [ $BACKEND_OK -eq 0 ]; then
        echo "   • Запустите бэкенд: cd backend && ./start.sh"
    fi
    
    if [ $FRONTEND_OK -eq 0 ]; then
        echo "   • Запустите фронтенд: ./start-frontend.sh"
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
