#!/bin/bash

cd "$(dirname "$0")"

echo "Компиляция..."
mvn compile -q

echo ""
echo "Запуск теста..."
echo ""

mvn exec:java -Dexec.mainClass="com.building.management.util.TestPasswordMatch" -q

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Что сейчас в БД для пользователя admin:"
echo ""

sudo -u postgres psql -d building_management -c "SELECT username, password_hash, enabled FROM users WHERE username='admin';"
