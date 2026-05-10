#!/bin/bash

echo "🏢 Building Management System - Backend Startup"
echo "================================================"

# Проверка Java
if ! command -v java &> /dev/null; then
    echo "❌ Java не установлен. Установите Java 17+"
    exit 1
fi

echo "✅ Java версия: $(java -version 2>&1 | head -n 1)"

# Проверка Maven
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven не установлен. Установите Maven 3.6+"
    exit 1
fi

echo "✅ Maven версия: $(mvn -v | head -n 1)"

# Проверка PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI не найден. Убедитесь, что PostgreSQL запущен."
else
    echo "✅ PostgreSQL установлен"
fi

echo ""
echo "📦 Сборка проекта..."
mvn clean install -DskipTests

if [ $? -eq 0 ]; then
    echo ""
    echo "🚀 Запуск Spring Boot приложения..."
    echo "Backend будет доступен на http://localhost:8080/api"
    echo ""
    mvn spring-boot:run
else
    echo "❌ Ошибка сборки проекта"
    exit 1
fi
