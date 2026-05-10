#!/bin/bash

echo "🔍 Проверка схемы таблицы users:"
sudo -u postgres psql -d building_management -c "\d users"

echo ""
echo "🔍 Проверка схемы таблицы rooms:"
sudo -u postgres psql -d building_management -c "\d rooms"

echo ""
echo "🔍 Проверка схемы таблицы devices:"
sudo -u postgres psql -d building_management -c "\d devices"

echo ""
echo "🔍 Проверка схемы таблицы buildings:"
sudo -u postgres psql -d building_management -c "\d buildings"

echo ""
echo "🔍 Проверка схемы таблицы floors:"
sudo -u postgres psql -d building_management -c "\d floors"
