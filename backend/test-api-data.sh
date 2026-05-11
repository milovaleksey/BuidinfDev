#!/bin/bash

echo "🔍 ТЕСТИРОВАНИЕ API - ПРОВЕРКА ДАННЫХ"
echo "======================================"
echo ""

# 1. Проверка зданий
echo "1️⃣ GET /api/buildings"
echo "----------------------"
curl -s http://localhost:8080/api/buildings | jq '.'
echo ""
echo ""

# 2. Получаем ID первого здания
BUILDING_ID=$(curl -s http://localhost:8080/api/buildings | jq -r '.[0].id')
echo "📌 ID первого здания: $BUILDING_ID"
echo ""

# 3. Проверка этажей для здания
echo "2️⃣ GET /api/floors/building/$BUILDING_ID"
echo "----------------------"
curl -s "http://localhost:8080/api/floors/building/$BUILDING_ID" | jq '.'
echo ""
echo ""

# 4. Получаем ID первого этажа
FLOOR_ID=$(curl -s "http://localhost:8080/api/floors/building/$BUILDING_ID" | jq -r '.[0].id')
echo "📌 ID первого этажа: $FLOOR_ID"
echo ""

# 5. Проверка помещений для этажа
echo "3️⃣ GET /api/rooms/floor/$FLOOR_ID"
echo "----------------------"
curl -s "http://localhost:8080/api/rooms/floor/$FLOOR_ID" | jq '.'
echo ""
echo ""

# 6. Получаем ID первого помещения
ROOM_ID=$(curl -s "http://localhost:8080/api/rooms/floor/$FLOOR_ID" | jq -r '.[0].id')
echo "📌 ID первого помещения: $ROOM_ID"
echo ""

# 7. Проверка устройств для помещения
echo "4️⃣ GET /api/devices/room/$ROOM_ID"
echo "----------------------"
curl -s "http://localhost:8080/api/devices/room/$ROOM_ID" | jq '.'
echo ""
echo ""

echo "======================================"
echo "✅ Тестирование завершено!"
