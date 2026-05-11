#!/bin/bash

echo "🔍 Проверка статуса бэкенда..."
echo ""

# 1. Проверка запущен ли Java процесс
echo "1️⃣ Проверка Java процесса:"
if pgrep -f "building-management" > /dev/null; then
    echo "✅ Бэкенд запущен"
    ps aux | grep building-management | grep -v grep
else
    echo "❌ Бэкенд НЕ запущен!"
fi

echo ""

# 2. Проверка порта 8080
echo "2️⃣ Проверка порта 8080:"
if netstat -tuln | grep :8080 > /dev/null 2>&1; then
    echo "✅ Порт 8080 открыт"
    netstat -tuln | grep :8080
elif ss -tuln | grep :8080 > /dev/null 2>&1; then
    echo "✅ Порт 8080 открыт"
    ss -tuln | grep :8080
else
    echo "❌ Порт 8080 НЕ открыт!"
fi

echo ""

# 3. Проверка подключения к PostgreSQL
echo "3️⃣ Проверка подключения к PostgreSQL:"
if PGPASSWORD=postgres psql -U postgres -d building_management -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ PostgreSQL доступен"
else
    echo "❌ PostgreSQL НЕ доступен!"
fi

echo ""

# 4. Проверка API endpoint
echo "4️⃣ Проверка API endpoints:"
if curl -s http://localhost:8080/api/auth/health > /dev/null 2>&1; then
    echo "✅ API отвечает"
    curl -s http://localhost:8080/api/auth/health | head -n 5
else
    echo "❌ API НЕ отвечает!"
fi

echo ""

# 5. Проверка логов
echo "5️⃣ Последние строки из лога (если есть):"
if [ -f /backend/logs/app.log ]; then
    tail -n 10 /backend/logs/app.log
elif [ -f ./logs/app.log ]; then
    tail -n 10 ./logs/app.log
else
    echo "⚠️ Лог-файл не найден"
fi

echo ""
echo "📊 Рекомендации:"
echo "- Если бэкенд не запущен: ./backend/start.sh"
echo "- Если порт занят: killall java && ./backend/start.sh"
echo "- Если DB не доступна: sudo systemctl start postgresql"
