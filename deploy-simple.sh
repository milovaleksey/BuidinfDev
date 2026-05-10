#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Простой деплой на виртуалку                           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Параметры
VM_USER=${1:-srvadmin}
VM_IP=${2:-10.81.0.60}
VM_PATH=${3:-/home/srvadmin/building-management}

echo "Параметры деплоя:"
echo "  Пользователь: $VM_USER"
echo "  IP: $VM_IP"
echo "  Путь: $VM_PATH"
echo ""

read -p "Продолжить? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Отменено"
    exit 0
fi

echo ""
echo "1️⃣  Создание директории на виртуалке..."
ssh "$VM_USER@$VM_IP" "mkdir -p $VM_PATH" || {
    echo "❌ Ошибка создания директории. Проверьте SSH доступ."
    exit 1
}
echo "✅ Директория создана"

echo ""
echo "2️⃣  Копирование файлов (это может занять время)..."

# Используем rsync если доступен
if command -v rsync &> /dev/null; then
    echo "Используем rsync для быстрой передачи..."
    rsync -avz --progress \
      --exclude 'node_modules' \
      --exclude 'target' \
      --exclude '.git' \
      --exclude 'dist' \
      --exclude 'build' \
      --exclude '.vite' \
      --exclude 'logs' \
      --exclude '.DS_Store' \
      --exclude '__pycache__' \
      ./ "$VM_USER@$VM_IP:$VM_PATH/"
else
    # Используем tar + ssh для передачи
    echo "Используем tar + ssh для передачи..."
    tar czf - \
      --exclude='node_modules' \
      --exclude='target' \
      --exclude='.git' \
      --exclude='dist' \
      --exclude='build' \
      --exclude='.vite' \
      --exclude='logs' \
      . | ssh "$VM_USER@$VM_IP" "cd $VM_PATH && tar xzf -"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Файлы успешно скопированы!"
else
    echo ""
    echo "❌ Ошибка при копировании файлов"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ Деплой завершен                                    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Следующие шаги:"
echo ""
echo "1. Подключитесь к виртуалке:"
echo "   ssh $VM_USER@$VM_IP"
echo ""
echo "2. Перейдите в директорию проекта:"
echo "   cd $VM_PATH"
echo ""
echo "3. Запустите автоустановку:"
echo "   chmod +x install-linux.sh"
echo "   ./install-linux.sh"
echo ""
echo "4. Следуйте инструкциям в VM_CHECKLIST.md"
echo ""
