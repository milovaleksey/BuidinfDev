#!/bin/bash

echo "📦 Загрузка всех данных в БД..."
echo ""

# 1. Применить схему прав доступа
echo "1️⃣ Применение схемы прав доступа..."
sudo -u postgres psql -d building_management -f permissions_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Схема прав применена"
else
    echo "⚠️ Возможно схема уже применена (это нормально)"
fi

echo ""

# 2. Загрузить демо-данные
echo "2️⃣ Загрузка демо-данных здания..."
sudo -u postgres psql -d building_management -f demo_building_data_clean.sql

if [ $? -eq 0 ]; then
    echo "✅ Демо-данные загружены"
else
    echo "❌ Ошибка загрузки данных"
    exit 1
fi

echo ""

# 3. Показать статистику
echo "3️⃣ Статистика БД:"
sudo -u postgres psql -d building_management -c "
    SELECT 'Зданий' as type, COUNT(*) as count FROM buildings
    UNION ALL
    SELECT 'Этажей', COUNT(*) FROM floors
    UNION ALL
    SELECT 'Помещений', COUNT(*) FROM rooms
    UNION ALL
    SELECT 'Устройств', COUNT(*) FROM devices;
"

echo ""
echo "✅ Готово! Теперь запустите бэкенд: ./restart.sh"
