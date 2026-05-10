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
    POSTGRES_OK=1
else
    echo -e "${RED}❌ Остановлен${NC}"
    POSTGRES_OK=0
fi

# Проверка БД
if [ $POSTGRES_OK -eq 1 ]; then
    echo -n "📊 БД building_management: "
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw building_management; then
        echo -e "${GREEN}✅ Существует${NC}"
        DB_EXISTS=1
        
        # Проверка пользователей
        echo -n "👥 Пользователи в БД: "
        USER_COUNT=$(sudo -u postgres psql -d building_management -tAc "SELECT COUNT(*) FROM users;")
        if [ "$USER_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ $USER_COUNT${NC}"
            USERS_OK=1
        else
            echo -e "${RED}❌ 0 (нужно загрузить демо-данные)${NC}"
            USERS_OK=0
        fi
    else
        echo -e "${RED}❌ Не существует${NC}"
        DB_EXISTS=0
        USERS_OK=0
    fi
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
if [ $POSTGRES_OK -eq 1 ] && [ $DB_EXISTS -eq 1 ] && [ $USERS_OK -eq 1 ] && [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ]; then
    echo -e "${GREEN}✅ Система полностью готова!${NC}"
    echo ""
    echo -e "${YELLOW}🌐 Откройте в браузере:${NC}"
    echo -e "   ${BLUE}http://$MY_IP:5173${NC}"
    echo ""
    echo -e "${YELLOW}👤 Учетные данные:${NC}"
    echo "   Логин: admin"
    echo "   Пароль: password"
    echo ""
    echo -e "${YELLOW}📖 Другие пользователи:${NC}"
    echo "   manager/password (MANAGER)"
    echo "   operator/password (OPERATOR)"
    echo "   viewer/password (VIEWER)"
else
    echo -e "${RED}❌ Система работает не полностью${NC}"
    echo ""
    echo -e "${YELLOW}Рекомендации:${NC}"
    
    if [ $POSTGRES_OK -eq 0 ]; then
        echo "   • Запустите PostgreSQL: sudo systemctl start postgresql"
    fi
    
    if [ $DB_EXISTS -eq 0 ]; then
        echo "   • Создайте БД: cd backend && ./setup-db.sh"
    fi
    
    if [ $USERS_OK -eq 0 ]; then
        echo "   • Загрузите демо-данные: cd backend && ./load-demo-data.sh"
    fi
    
    if [ $BACKEND_OK -eq 0 ]; then
        echo "   • Запустите бэкенд: cd backend && ./start.sh"
    fi
    
    if [ $FRONTEND_OK -eq 0 ]; then
        echo "   • Запустите фронтенд: ./start-frontend.sh"
    fi
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Полезные команды:${NC}"
echo "   ./check-system.sh          - эта проверка"
echo "   cd backend && ./check-db.sh - подробная информация о БД"
echo "   cd backend && ./load-demo-data.sh - загрузить демо-данные"
echo ""