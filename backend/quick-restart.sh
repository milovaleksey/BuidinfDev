#!/bin/bash

echo "🔄 Быстрый перезапуск бэкенда..."

# Текущая директория
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Остановка
echo "Остановка старых процессов..."
pkill -f "building-management" 2>/dev/null
sleep 2

# Проверка что JAR собран
if [ ! -f "target/building-management-0.0.1-SNAPSHOT.jar" ]; then
    echo "❌ JAR не найден! Запускаю полную сборку..."
    mvn clean package -DskipTests
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка сборки!"
        exit 1
    fi
fi

# Запуск
echo "Запуск бэкенда..."
nohup java -jar target/building-management-0.0.1-SNAPSHOT.jar > logs/app.log 2>&1 &

# Ожидание
echo -n "Ожидание запуска"
for i in {1..15}; do
    sleep 1
    if curl -s http://localhost:8080/api/auth/health > /dev/null 2>&1; then
        echo ""
        echo "✅ Бэкенд запущен!"
        exit 0
    fi
    echo -n "."
done

echo ""
echo "⚠️ Проверьте логи: tail -f $SCRIPT_DIR/logs/app.log"
