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

# Проверка SSH доступа
echo "🔐 Проверка SSH подключения..."
ssh -o ConnectTimeout=5 -o BatchMode=yes "$VM_USER@$VM_IP" exit 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  SSH подключение требует пароль или ключ"
    echo "Продолжаем с запросом пароля..."
fi

echo ""
echo "📤 Создание директории на виртуалке..."
# Создать директорию на удаленном сервере
ssh "$VM_USER@$VM_IP" "mkdir -p $VM_PATH"

if [ $? -ne 0 ]; then
    echo "❌ Не удалось создать директорию на виртуалке"
    echo "Проверьте SSH доступ: ssh $VM_USER@$VM_IP"
    exit 1
fi

echo "📤 Загрузка файлов на виртуалку..."

# Копирование на виртуалку (rsync удобнее чем scp)
if command -v rsync &> /dev/null; then
    rsync -avz --progress \
      --exclude 'node_modules' \
      --exclude 'target' \
      --exclude '.git' \
      --exclude 'dist' \
      --exclude 'build' \
      --exclude '.vite' \
      --exclude 'logs' \
      ./ "$VM_USER@$VM_IP:$VM_PATH/"
else
    # Fallback на scp если rsync не установлен
    scp -r "$TEMP_DIR/"* "$VM_USER@$VM_IP:$VM_PATH/"
fi

if [ $? -eq 0 ]; then
    echo "✅ Проект успешно скопирован на виртуалку"
else
    echo "❌ Ошибка при копировании"
    exit 1
fi

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
