#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Запуск Frontend - Building Management System         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен"
    exit 1
fi

echo "✅ Node.js версия: $(node -v)"

# Проверка pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm не установлен"
    echo "Установите: npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm версия: $(pnpm -v)"

# Установка зависимостей если нужно
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Установка зависимостей..."
    pnpm install
fi

# Получить IP адрес
IP_ADDR=$(hostname -I | awk '{print $1}')

echo ""
echo "🚀 Запуск Frontend сервера..."
echo ""
echo "Frontend будет доступен по адресам:"
echo "  • Локально:  http://localhost:5173"
echo "  • В сети:    http://$IP_ADDR:5173"
echo ""
echo "Нажмите Ctrl+C для остановки"
echo ""

# Запуск с доступом извне
pnpm run dev
