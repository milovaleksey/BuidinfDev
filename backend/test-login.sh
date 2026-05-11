#!/bin/bash

echo "🧪 Тестирование API логина..."
echo ""

echo "1️⃣ Проверка доступности бэкенда:"
if curl -s --connect-timeout 2 http://localhost:8080/api/health > /dev/null; then
    echo "✅ Бэкенд доступен"
else
    echo "❌ Бэкенд недоступен на порту 8080"
    exit 1
fi
echo ""

echo "2️⃣ Попытка логина admin/admin:"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo "HTTP статус: $HTTP_CODE"
echo "Ответ: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Логин успешен!"
    TOKEN=$(echo "$BODY" | jq -r '.token' 2>/dev/null)
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo "🔑 Токен получен: ${TOKEN:0:20}..."
        echo ""
        echo "3️⃣ Проверка доступа к данным с токеном:"
        curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/buildings | jq '. | length' 2>/dev/null && echo "✅ Данные получены"
    fi
else
    echo "❌ Логин не удался (код $HTTP_CODE)"
    if [ "$HTTP_CODE" = "403" ]; then
        echo ""
        echo "🔍 Проблема: Spring Security блокирует запрос"
        echo "Возможные причины:"
        echo "  - Бэкенд не перезапустился после изменения SecurityConfig.java"
        echo "  - CSRF токен требуется (хотя должен быть отключен)"
        echo "  - Путь /api/auth/login не в списке permitAll()"
        echo ""
        echo "📋 Проверьте логи бэкенда:"
        echo "  tail -50 logs/app.log"
    fi
fi
