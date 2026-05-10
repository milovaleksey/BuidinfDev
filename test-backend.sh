#!/bin/bash

echo "🔍 Тестирование подключения к Java Backend"
echo "=========================================="
echo ""

BACKEND_URL="http://localhost:8080/api"

echo "📡 Проверка health endpoint..."
if curl -s -f "$BACKEND_URL/auth/health" > /dev/null 2>&1; then
    echo "✅ Backend доступен на $BACKEND_URL"
    echo ""
    echo "Ответ сервера:"
    curl -s "$BACKEND_URL/auth/health" | jq '.' 2>/dev/null || curl -s "$BACKEND_URL/auth/health"
else
    echo "❌ Backend НЕ доступен на $BACKEND_URL"
    echo ""
    echo "Проверьте:"
    echo "1. Запущен ли Java backend: cd backend && mvn spring-boot:run"
    echo "2. Запущен ли PostgreSQL"
    echo "3. Правильно ли настроены порты (8080)"
    exit 1
fi

echo ""
echo "=========================================="
echo "Backend готов к работе! ✅"
echo ""
echo "Следующие шаги:"
echo "1. Запустите фронтенд: pnpm run dev"
echo "2. Откройте http://localhost:5173"
echo "3. Войдите с тестовыми данными (например: admin/admin123)"
