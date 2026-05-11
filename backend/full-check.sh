#!/bin/bash

echo "🔍 КОМПЛЕКСНАЯ ПРОВЕРКА СИСТЕМЫ"
echo "================================"
echo ""

# 1. Проверка бэкенда
echo "1️⃣ Проверка бэкенда..."
BACKEND_PID=$(pgrep -f "building-management")
if [ -n "$BACKEND_PID" ]; then
    echo "✅ Бэкенд запущен (PID: $BACKEND_PID)"
else
    echo "❌ Бэкенд не запущен!"
    echo "Запустите: ./restart.sh"
    exit 1
fi

echo ""

# 2. Проверка порта 8080
echo "2️⃣ Проверка порта 8080..."
if netstat -tuln | grep -q ":8080 "; then
    echo "✅ Порт 8080 открыт"
else
    echo "❌ Порт 8080 не открыт!"
fi

echo ""

# 3. Проверка Health endpoint
echo "3️⃣ Проверка Health endpoint..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/auth/health 2>/dev/null)
if [ "$HEALTH" = "200" ]; then
    echo "✅ Health check OK"
else
    echo "⚠️ Health check вернул: $HEALTH"
fi

echo ""

# 4. Проверка данных в БД
echo "4️⃣ Проверка данных в БД..."
sudo -u postgres psql -d building_management -t -c "
    SELECT 
        'Зданий: ' || (SELECT COUNT(*) FROM buildings) || E'\n' ||
        'Этажей: ' || (SELECT COUNT(*) FROM floors) || E'\n' ||
        'Помещений: ' || (SELECT COUNT(*) FROM rooms) || E'\n' ||
        'Устройств: ' || (SELECT COUNT(*) FROM devices)
"

echo ""

# 5. Проверка API Buildings
echo "5️⃣ Проверка API /api/buildings..."
BUILDINGS=$(curl -s http://localhost:8080/api/buildings 2>/dev/null)
if [ -n "$BUILDINGS" ] && echo "$BUILDINGS" | grep -q "Технопарк"; then
    echo "✅ API возвращает здания"
    echo "$BUILDINGS" | jq -r '.[] | "  - ID: \(.id), Название: \(.name)"' 2>/dev/null || echo "$BUILDINGS"
else
    echo "⚠️ API не возвращает данные или вернул ошибку:"
    echo "$BUILDINGS"
fi

echo ""

# 6. Проверка CORS
echo "6️⃣ Проверка CORS..."
CORS=$(curl -s -I -X OPTIONS http://localhost:8080/api/buildings \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control")
if [ -n "$CORS" ]; then
    echo "✅ CORS настроен:"
    echo "$CORS"
else
    echo "⚠️ CORS заголовки не найдены"
fi

echo ""

# 7. Тест авторизации
echo "7️⃣ Тест авторизации (admin/admin)..."
LOGIN=$(curl -s -X POST http://localhost:8080/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin"}' 2>/dev/null)

if echo "$LOGIN" | grep -q "token"; then
    echo "✅ Авторизация работает"
    TOKEN=$(echo "$LOGIN" | jq -r '.token' 2>/dev/null)
    echo "Token (первые 20 символов): ${TOKEN:0:20}..."
else
    echo "⚠️ Проблема с авторизацией:"
    echo "$LOGIN"
fi

echo ""
echo "================================"
echo "✅ Проверка завершена!"
echo ""
echo "📋 Для проверки фронтенда:"
echo "1. Откройте браузер: http://localhost:5173"
echo "2. Откройте консоль разработчика (F12)"
echo "3. Попробуйте войти: admin/admin"
echo "4. Проверьте вкладку Network на ошибки"
