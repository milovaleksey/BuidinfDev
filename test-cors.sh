#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MY_IP=$(hostname -I | awk '{print $1}')

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Тестирование CORS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📍 IP сервера:${NC} $MY_IP"
echo ""

# Тест 1: Preflight OPTIONS запрос
echo -e "${YELLOW}Тест 1: OPTIONS (Preflight запрос)${NC}"
echo "curl -X OPTIONS http://$MY_IP:8080/api/auth/login \\"
echo "  -H 'Origin: http://$MY_IP:5173' \\"
echo "  -H 'Access-Control-Request-Method: POST' \\"
echo "  -H 'Access-Control-Request-Headers: Content-Type' \\"
echo "  -v"
echo ""

RESPONSE=$(curl -X OPTIONS "http://$MY_IP:8080/api/auth/login" \
  -H "Origin: http://$MY_IP:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1)

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ CORS заголовки присутствуют${NC}"
    echo "$RESPONSE" | grep "Access-Control"
else
    echo -e "${RED}❌ CORS заголовки отсутствуют${NC}"
    echo "$RESPONSE"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Тест 2: Health check с CORS
echo ""
echo -e "${YELLOW}Тест 2: GET /api/auth/health с CORS${NC}"
echo ""

RESPONSE=$(curl -X GET "http://$MY_IP:8080/api/auth/health" \
  -H "Origin: http://$MY_IP:5173" \
  -v 2>&1)

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✅ CORS заголовки присутствуют${NC}"
    echo "$RESPONSE" | grep "Access-Control"
else
    echo -e "${RED}❌ CORS заголовки отсутствуют${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Тест 3: POST login
echo ""
echo -e "${YELLOW}Тест 3: POST /api/auth/login${NC}"
echo ""

curl -X POST "http://$MY_IP:8080/api/auth/login" \
  -H "Origin: http://$MY_IP:5173" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -v 2>&1 | grep -E "(HTTP|Access-Control|Content-Type|< {)"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
