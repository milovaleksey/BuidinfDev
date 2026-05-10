#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Деплой проекта на виртуальную машину                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Запрос параметров
read -p "IP адрес виртуалки: " VM_IP
read -p "Пользователь на виртуалке: " VM_USER
read -p "Путь на виртуалке (по умолчанию ~/building-management): " VM_PATH
VM_PATH=${VM_PATH:-~/building-management}

echo ""
echo "📦 Копирование проекта на $VM_USER@$VM_IP:$VM_PATH"
echo ""

# Создать временную директорию для копирования
TEMP_DIR=$(mktemp -d)
echo "Подготовка файлов в $TEMP_DIR..."

# Копировать файлы проекта (исключая ненужные)
rsync -av \
  --exclude 'node_modules' \
  --exclude 'target' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude '.vite' \
  --exclude 'logs' \
  --exclude '.DS_Store' \
  ./ "$TEMP_DIR/"

echo ""
echo "📤 Загрузка на виртуалку..."

# Копирование на виртуалку
scp -r "$TEMP_DIR" "$VM_USER@$VM_IP:$VM_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Проект успешно скопирован на виртуалку"
else
    echo "❌ Ошибка при копировании"
    exit 1
fi

# Удалить временную директорию
rm -rf "$TEMP_DIR"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ Деплой завершен                                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Следующие шаги на виртуалке:"
echo ""
echo "1. Подключитесь к виртуалке:"
echo "   ssh $VM_USER@$VM_IP"
echo ""
echo "2. Установите зависимости (если еще не установлено):"
echo "   cd $VM_PATH"
echo "   chmod +x install-linux.sh"
echo "   ./install-linux.sh"
echo ""
echo "3. Настройте backend:"
echo "   cd $VM_PATH/backend"
echo "   nano src/main/resources/application.properties"
echo ""
echo "4. Запустите backend:"
echo "   cd $VM_PATH/backend"
echo "   ./start.sh"
echo ""
echo "5. В новом терминале создайте пользователя:"
echo "   curl -X POST http://localhost:8080/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"admin\",\"email\":\"admin@building.com\",\"password\":\"admin123\",\"fullName\":\"Admin\"}'"
echo ""
echo "6. Запустите frontend:"
echo "   cd $VM_PATH"
echo "   pnpm install"
echo "   pnpm run dev -- --host 0.0.0.0"
echo ""
echo "7. Откройте в браузере:"
echo "   http://$VM_IP:5173"
echo ""
echo "📖 Полная документация: $VM_PATH/LINUX_SETUP.md"
