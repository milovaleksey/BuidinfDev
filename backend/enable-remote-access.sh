#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Настройка удаленного доступа к PostgreSQL${NC}"
echo ""

# Найти версию PostgreSQL и конфигурационные файлы
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_CONF_DIR="/etc/postgresql/${PG_VERSION}/main"

if [ ! -d "$PG_CONF_DIR" ]; then
    # Попробовать найти автоматически
    PG_CONF_DIR=$(sudo find /etc/postgresql -name "postgresql.conf" -type f | head -1 | xargs dirname)
fi

if [ -z "$PG_CONF_DIR" ] || [ ! -d "$PG_CONF_DIR" ]; then
    echo -e "${RED}❌ Не удалось найти конфигурационные файлы PostgreSQL${NC}"
    echo "Попробуйте выполнить вручную:"
    echo "  sudo find /etc/postgresql -name postgresql.conf"
    exit 1
fi

echo -e "${GREEN}✅ Найден каталог конфигурации: $PG_CONF_DIR${NC}"
echo ""

# Резервные копии
echo -e "${YELLOW}📦 Создание резервных копий...${NC}"
sudo cp "$PG_CONF_DIR/postgresql.conf" "$PG_CONF_DIR/postgresql.conf.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$PG_CONF_DIR/pg_hba.conf" "$PG_CONF_DIR/pg_hba.conf.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✅ Резервные копии созданы${NC}"
echo ""

# 1. Настройка postgresql.conf - разрешить прослушивание на всех интерфейсах
echo -e "${YELLOW}🔧 Настройка postgresql.conf...${NC}"
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF_DIR/postgresql.conf"
sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF_DIR/postgresql.conf"
echo -e "${GREEN}✅ listen_addresses настроен на '*'${NC}"
echo ""

# 2. Настройка pg_hba.conf - разрешить подключения с паролем
echo -e "${YELLOW}🔧 Настройка pg_hba.conf...${NC}"

# Добавить строку для локальных подключений с паролем, если её нет
if ! sudo grep -q "host.*all.*all.*127.0.0.1/32.*md5" "$PG_CONF_DIR/pg_hba.conf"; then
    echo "# Разрешить локальные подключения с паролем (для pgAdmin)" | sudo tee -a "$PG_CONF_DIR/pg_hba.conf"
    echo "host    all             all             127.0.0.1/32            md5" | sudo tee -a "$PG_CONF_DIR/pg_hba.conf"
    echo -e "${GREEN}✅ Добавлена запись для localhost (127.0.0.1)${NC}"
else
    echo -e "${GREEN}✅ Запись для localhost уже существует${NC}"
fi

# Для подключений из локальной сети (опционально)
echo ""
echo -e "${YELLOW}Хотите разрешить доступ из локальной сети? (y/n)${NC}"
read -r answer
if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    if ! sudo grep -q "host.*all.*all.*192.168.0.0/16.*md5" "$PG_CONF_DIR/pg_hba.conf"; then
        echo "host    all             all             192.168.0.0/16          md5" | sudo tee -a "$PG_CONF_DIR/pg_hba.conf"
        echo -e "${GREEN}✅ Добавлена запись для локальной сети 192.168.x.x${NC}"
    fi
    
    if ! sudo grep -q "host.*all.*all.*10.0.0.0/8.*md5" "$PG_CONF_DIR/pg_hba.conf"; then
        echo "host    all             all             10.0.0.0/8              md5" | sudo tee -a "$PG_CONF_DIR/pg_hba.conf"
        echo -e "${GREEN}✅ Добавлена запись для локальной сети 10.x.x.x${NC}"
    fi
fi

echo ""

# 3. Перезапуск PostgreSQL
echo -e "${YELLOW}🔄 Перезапуск PostgreSQL...${NC}"
sudo systemctl restart postgresql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL успешно перезапущен${NC}"
else
    echo -e "${RED}❌ Ошибка при перезапуске PostgreSQL${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Настройка завершена!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 Параметры для подключения в pgAdmin:${NC}"
echo ""
echo "  Host: localhost (или 127.0.0.1)"
echo "  Port: 5432"
echo "  Database: building_management"
echo "  Username: postgres"
echo "  Password: postgres"
echo ""
echo -e "${YELLOW}💡 Инструкция для pgAdmin:${NC}"
echo "  1. Запустите pgAdmin"
echo "  2. Правой кнопкой на 'Servers' → 'Register' → 'Server'"
echo "  3. Вкладка 'General': Name = 'Building Management'"
echo "  4. Вкладка 'Connection': заполните параметры выше"
echo "  5. Нажмите 'Save'"
echo ""
echo -e "${YELLOW}🔍 Проверка порта:${NC}"
sudo netstat -tulpn | grep 5432 || sudo ss -tulpn | grep 5432
echo ""
