#!/bin/bash

# Получаем правильный путь к директории бэкенда
BACKEND_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "📂 Работаем в директории: $BACKEND_DIR"
echo ""

echo "🔄 Остановка Spring Boot приложения..."
pkill -f "building-management-0.0.1-SNAPSHOT.jar" || echo "Приложение не запущено"

echo "⏳ Ожидание завершения процесса..."
sleep 3

echo "🔨 Сборка проекта..."
cd "$BACKEND_DIR"
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки!"
    exit 1
fi

# Создаем директорию для логов если её нет
mkdir -p "$BACKEND_DIR/logs"

echo "🚀 Запуск приложения в фоновом режиме..."
nohup java -jar "$BACKEND_DIR/target/building-management-0.0.1-SNAPSHOT.jar" > "$BACKEND_DIR/logs/app.log" 2>&1 &

echo "✅ Приложение запущено!"
echo "📋 Логи: tail -f $BACKEND_DIR/logs/app.log"
echo ""
echo "⏳ Ожидание старта сервера (15 секунд)..."
sleep 15

echo ""
echo "🔍 Проверка статуса:"
curl -s http://localhost:8080/api/health || echo "❌ Сервер еще не готов"
echo ""
echo "🔍 Проверка логина:"
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | head -c 100
echo ""