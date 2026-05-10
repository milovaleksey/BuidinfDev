#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Установка Building Management System на Linux        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Проверка прав root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Не запускайте скрипт от root. Используйте обычного пользователя."
    echo "   Скрипт сам запросит sudo где необходимо."
    exit 1
fi

# Функция для проверки успешности команды
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1"
    else
        echo "❌ Ошибка: $1"
        exit 1
    fi
}

# Обновление системы
echo "📦 Обновление системы..."
sudo apt update
sudo apt upgrade -y
check_status "Система обновлена"

# Установка Java 17
echo ""
echo "☕ Установка Java 17..."
sudo apt install openjdk-17-jdk -y
check_status "Java 17 установлена"
java -version

# Установка Maven
echo ""
echo "📦 Установка Maven..."
sudo apt install maven -y
check_status "Maven установлен"
mvn -version

# Установка PostgreSQL
echo ""
echo "🐘 Установка PostgreSQL..."
sudo apt install postgresql postgresql-contrib -y
check_status "PostgreSQL установлен"

# Запуск PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
check_status "PostgreSQL запущен"

# Настройка PostgreSQL
echo ""
echo "🔧 Настройка PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE USER building_user WITH PASSWORD 'building_pass';
CREATE DATABASE building_management OWNER building_user;
GRANT ALL PRIVILEGES ON DATABASE building_management TO building_user;
\q
EOF
check_status "База данных создана"

# Установка Node.js
echo ""
echo "🟢 Установка Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
check_status "Node.js установлен"
node -v

# Установка pnpm
echo ""
echo "📦 Установка pnpm..."
sudo npm install -g pnpm
check_status "pnpm установлен"
pnpm -v

# Установка дополнительных утилит
echo ""
echo "🛠️  Установка дополнительных утилит..."
sudo apt install git curl jq screen -y
check_status "Утилиты установлены"

# Настройка firewall (опционально)
read -p "Настроить firewall (ufw)? (y/n): " setup_firewall
if [ "$setup_firewall" = "y" ]; then
    echo ""
    echo "🔥 Настройка firewall..."
    sudo apt install ufw -y
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 8080/tcp # Backend
    sudo ufw allow 5173/tcp # Frontend
    echo "y" | sudo ufw enable
    check_status "Firewall настроен"
    sudo ufw status
fi

# Установка Node-RED (опционально)
read -p "Установить Node-RED для MQTT интеграции? (y/n): " install_nodered
if [ "$install_nodered" = "y" ]; then
    echo ""
    echo "🔴 Установка Node-RED..."
    sudo npm install -g --unsafe-perm node-red
    check_status "Node-RED установлен"

    if [ "$setup_firewall" = "y" ]; then
        sudo ufw allow 1880/tcp
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ Установка завершена успешно!                      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Установлено:"
echo "   ✅ Java 17"
echo "   ✅ Maven"
echo "   ✅ PostgreSQL (порт 5432)"
echo "   ✅ Node.js & pnpm"
echo "   ✅ Git, curl, jq"
if [ "$setup_firewall" = "y" ]; then
    echo "   ✅ UFW Firewall"
fi
if [ "$install_nodered" = "y" ]; then
    echo "   ✅ Node-RED"
fi

echo ""
echo "📝 База данных:"
echo "   Имя: building_management"
echo "   Пользователь: building_user"
echo "   Пароль: building_pass"

echo ""
echo "🚀 Следующие шаги:"
echo ""
echo "1. Скопируйте проект на сервер:"
echo "   scp -r /path/to/project user@server:~/building-management"
echo ""
echo "2. Настройте backend:"
echo "   cd ~/building-management/backend"
echo "   nano src/main/resources/application.properties"
echo "   # Измените database credentials и JWT secret"
echo ""
echo "3. Запустите backend:"
echo "   cd ~/building-management/backend"
echo "   ./start.sh"
echo ""
echo "4. Создайте пользователя (в новом терминале):"
echo "   curl -X POST http://localhost:8080/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"admin\",\"email\":\"admin@building.com\",\"password\":\"admin123\",\"fullName\":\"Admin\"}'"
echo ""
echo "5. Запустите frontend:"
echo "   cd ~/building-management"
echo "   pnpm install"
echo "   pnpm run dev -- --host 0.0.0.0"
echo ""
echo "6. Откройте в браузере:"
echo "   http://$(hostname -I | awk '{print $1}'):5173"
echo ""

if [ "$install_nodered" = "y" ]; then
    echo "7. Запустите Node-RED:"
    echo "   node-red"
    echo "   # Доступ: http://$(hostname -I | awk '{print $1}'):1880"
    echo ""
fi

echo "Подробная документация в файле LINUX_SETUP.md"
