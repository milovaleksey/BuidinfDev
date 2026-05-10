#!/bin/bash

echo "🔧 Настройка PostgreSQL для Building Management System"
echo "========================================================"

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Параметры БД (можно изменить)
DB_NAME="building_management"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo ""
echo -e "${YELLOW}Параметры базы данных:${NC}"
echo "  База данных: $DB_NAME"
echo "  Пользователь: $DB_USER"
echo "  Пароль: $DB_PASSWORD"
echo ""

# Проверка, запущен ли PostgreSQL
if ! sudo systemctl is-active --quiet postgresql; then
    echo -e "${RED}❌ PostgreSQL не запущен${NC}"
    echo "Запускаем PostgreSQL..."
    sudo systemctl start postgresql
    sleep 2
fi

if sudo systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✅ PostgreSQL запущен${NC}"
else
    echo -e "${RED}❌ Не удалось запустить PostgreSQL${NC}"
    exit 1
fi

# Создание базы данных
echo ""
echo "📦 Создание базы данных..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ База данных '$DB_NAME' создана${NC}"
else
    echo -e "${RED}❌ Ошибка создания базы данных${NC}"
    exit 1
fi

# Установка пароля для пользователя postgres (если нужно)
echo ""
echo "🔐 Настройка пользователя..."
sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Пароль установлен${NC}"
else
    echo -e "${YELLOW}⚠️  Предупреждение при установке пароля (возможно, уже установлен)${NC}"
fi

# Предоставление прав
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null

# Проверка подключения
echo ""
echo "🔍 Проверка подключения..."
PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Подключение успешно!${NC}"
else
    echo -e "${RED}❌ Не удалось подключиться к базе данных${NC}"
    echo ""
    echo "Возможные проблемы:"
    echo "1. Проверьте файл /etc/postgresql/*/main/pg_hba.conf"
    echo "2. Убедитесь, что есть строка: local all postgres peer"
    echo "3. Или измените на: local all all md5"
    echo ""
    exit 1
fi

# Создание таблиц будет автоматически через Hibernate при первом запуске
echo ""
echo -e "${GREEN}✅ База данных настроена!${NC}"
echo ""
echo "📝 Настройки в application.properties:"
echo "  spring.datasource.url=jdbc:postgresql://localhost:5432/$DB_NAME"
echo "  spring.datasource.username=$DB_USER"
echo "  spring.datasource.password=$DB_PASSWORD"
echo ""
echo -e "${YELLOW}Таблицы будут созданы автоматически при первом запуске Spring Boot${NC}"
echo ""
