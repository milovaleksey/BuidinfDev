#!/bin/bash

echo "🔧 Диагностика и запуск бэкенда..."
echo ""

# 1. Остановить старые процессы
echo "1️⃣ Остановка старых процессов..."
pkill -f "building-management" 2>/dev/null
sleep 2

# 2. Проверить PostgreSQL
echo "2️⃣ Проверка PostgreSQL..."
if ! PGPASSWORD=postgres psql -U postgres -d building_management -c "SELECT 1" > /dev/null 2>&1; then
    echo "⚠️ PostgreSQL не запущен, пытаюсь запустить..."
    sudo systemctl start postgresql
    sleep 3
fi

# 3. Проверить наличие данных
echo "3️⃣ Проверка данных в БД..."
BUILDING_COUNT=$(PGPASSWORD=postgres psql -U postgres -d building_management -t -c "SELECT COUNT(*) FROM buildings;" 2>/dev/null | xargs)
DEVICE_COUNT=$(PGPASSWORD=postgres psql -U postgres -d building_management -t -c "SELECT COUNT(*) FROM devices;" 2>/dev/null | xargs)

echo "   Зданий: $BUILDING_COUNT"
echo "   Устройств: $DEVICE_COUNT"

if [ "$BUILDING_COUNT" = "0" ]; then
    echo "⚠️ Нет данных, загружаю демо-данные..."
    PGPASSWORD=postgres psql -U postgres -d building_management -f demo_building_data_clean.sql > /dev/null 2>&1
fi

# 4. Собрать и запустить бэкенд
echo "4️⃣ Сборка и запуск бэкенда..."
cd /backend

# Собрать без тестов
echo "   Компиляция..."
mvn clean package -DskipTests > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Ошибка компиляции! Запускаю с подробностями:"
    mvn clean package -DskipTests
    exit 1
fi

# Запустить
echo "   Запуск сервера..."
nohup java -jar target/building-management-0.0.1-SNAPSHOT.jar > logs/app.log 2>&1 &

# Подождать запуска
echo "   Ожидание запуска (10 сек)..."
for i in {1..10}; do
    sleep 1
    if curl -s http://localhost:8080/api/auth/health > /dev/null 2>&1; then
        echo ""
        echo "✅ Бэкенд запущен успешно!"
        echo ""
        echo "📊 Статус:"
        curl -s http://localhost:8080/api/auth/health
        echo ""
        echo ""
        echo "🌐 API доступен на: http://localhost:8080/api"
        exit 0
    fi
    echo -n "."
done

echo ""
echo "⚠️ Бэкенд запускается дольше обычного..."
echo "Проверьте логи: tail -f /backend/logs/app.log"
