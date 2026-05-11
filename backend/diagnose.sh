#!/bin/bash

echo "🔍 ПОЛНАЯ ДИАГНОСТИКА СИСТЕМЫ"
echo "=============================="
echo ""

# 1. Проверка процесса бэкенда
echo "1️⃣ Проверка процесса бэкенда..."
BACKEND_PID=$(pgrep -f "8080" | head -1)
if [ -z "$BACKEND_PID" ]; then
    # Попробуем найти по другому
    BACKEND_PID=$(netstat -tlnp 2>/dev/null | grep ":8080" | awk '{print $7}' | cut -d'/' -f1)
fi

if [ -n "$BACKEND_PID" ]; then
    echo "✅ Бэкенд запущен (PID: $BACKEND_PID)"
    ps aux | grep "$BACKEND_PID" | grep -v grep
else
    echo "❌ Бэкенд НЕ ЗАПУЩЕН!"
    echo ""
    echo "Попробуйте запустить:"
    echo "  ./restart.sh"
    exit 1
fi

echo ""

# 2. Проверка порта
echo "2️⃣ Проверка порта 8080..."
if netstat -tuln | grep -q ":8080 "; then
    echo "✅ Порт 8080 открыт"
    netstat -tuln | grep ":8080 "
else
    echo "❌ Порт 8080 НЕ ОТКРЫТ!"
fi

echo ""

# 3. Проверка PostgreSQL
echo "3️⃣ Проверка PostgreSQL..."
if sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ PostgreSQL работает"
else
    echo "❌ PostgreSQL не работает!"
fi

echo ""

# 4. Проверка БД building_management
echo "4️⃣ Проверка БД building_management..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw building_management; then
    echo "✅ БД building_management существует"
else
    echo "❌ БД building_management НЕ СУЩЕСТВУЕТ!"
fi

echo ""

# 5. Проверка данных в БД
echo "5️⃣ Данные в БД..."
echo "-------------------"
sudo -u postgres psql -d building_management <<EOF
SELECT 
    'Зданий: ' || COUNT(*) as count FROM buildings
UNION ALL
SELECT 
    'Этажей: ' || COUNT(*) FROM floors
UNION ALL
SELECT 
    'Помещений: ' || COUNT(*) FROM rooms
UNION ALL
SELECT 
    'Устройств: ' || COUNT(*) FROM devices;
EOF

echo ""

# 6. Детали зданий
echo "6️⃣ Список зданий в БД..."
echo "-------------------"
sudo -u postgres psql -d building_management -c "SELECT id, name, address FROM buildings;"

echo ""

# 7. Проверка API напрямую
echo "7️⃣ Тест API /api/buildings..."
echo "-------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:8080/api/buildings)
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP код: $HTTP_CODE"
echo "Ответ:"
echo "$BODY"

echo ""

# 8. Логи бэкенда (последние 30 строк)
echo "8️⃣ Последние логи бэкенда..."
echo "-------------------"
if [ -f logs/application.log ]; then
    tail -30 logs/application.log
else
    echo "⚠️ Файл логов не найден"
fi

echo ""
echo "=============================="
echo "✅ Диагностика завершена"