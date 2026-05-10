#!/bin/bash

echo "🔄 Остановка Spring Boot приложения..."
pkill -f "building-management-0.0.1-SNAPSHOT.jar" || echo "Приложение не запущено"

echo "⏳ Ожидание завершения процесса..."
sleep 3

echo "🔨 Сборка проекта..."
cd /root/backend
./mvnw clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки!"
    exit 1
fi

echo "🚀 Запуск приложения в фоновом режиме..."
nohup java -jar target/building-management-0.0.1-SNAPSHOT.jar > /root/backend/app.log 2>&1 &

echo "✅ Приложение запущено!"
echo "📋 Логи: tail -f /root/backend/app.log"
echo ""
echo "⏳ Ожидание старта сервера (10 секунд)..."
sleep 10

echo ""
echo "🔍 Проверка статуса:"
curl -s http://localhost:8080/api/health || echo "Сервер еще не готов"
