#!/bin/bash

echo "📋 Проверка структуры таблиц..."
echo ""

sudo -u postgres psql -d building_management << 'EOF'
\echo '=== ТАБЛИЦА BUILDINGS ==='
\d buildings

\echo ''
\echo '=== ТАБЛИЦА FLOORS ==='
\d floors

\echo ''
\echo '=== ТАБЛИЦА ROOMS ==='
\d rooms

\echo ''
\echo '=== ТАБЛИЦА DEVICES ==='
\d devices

\echo ''
\echo '=== ТЕКУЩИЕ ДАННЫЕ ==='
SELECT 'Buildings' as table_name, COUNT(*) as count FROM buildings
UNION ALL
SELECT 'Floors', COUNT(*) FROM floors
UNION ALL
SELECT 'Rooms', COUNT(*) FROM rooms
UNION ALL
SELECT 'Devices', COUNT(*) FROM devices;

\echo ''
\echo '=== СУЩЕСТВУЮЩИЕ ЗДАНИЯ ==='
SELECT id, name, address, floors_count FROM buildings;
EOF
