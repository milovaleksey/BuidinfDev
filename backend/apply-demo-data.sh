#!/bin/bash

echo "📦 Применение схемы прав доступа и демо-данных..."

# Применить схему прав
echo "1️⃣ Применение permissions_schema.sql..."
PGPASSWORD=postgres psql -U postgres -h localhost -d building_management -f /backend/permissions_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Схема прав применена успешно"
else
    echo "❌ Ошибка при применении схемы прав"
    exit 1
fi

# Применить демо-данные
echo ""
echo "2️⃣ Создание демо-данных здания..."
PGPASSWORD=postgres psql -U postgres -h localhost -d building_management -f /backend/demo_building_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Демо-данные созданы успешно"
else
    echo "❌ Ошибка при создании демо-данных"
    exit 1
fi

echo ""
echo "3️⃣ Перезапуск бэкенда..."
/backend/restart.sh

echo ""
echo "🎉 Готово! Система готова к работе."
