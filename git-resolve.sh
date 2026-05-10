#!/bin/bash

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 Решение конфликта Git${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Выберите действие:${NC}"
echo ""
echo "1) Сохранить локальные изменения и обновить (stash + pull + stash pop)"
echo "2) Сделать коммит локальных изменений и обновить (commit + pull)"
echo "3) Отменить локальные изменения и взять из репозитория (reset --hard)"
echo ""
read -p "Ваш выбор (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}📦 Сохраняю локальные изменения...${NC}"
        git stash
        
        echo -e "${YELLOW}⬇️  Загружаю обновления...${NC}"
        git pull
        
        echo -e "${YELLOW}📤 Восстанавливаю локальные изменения...${NC}"
        git stash pop
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Готово! Локальные изменения сохранены и объединены.${NC}"
        else
            echo ""
            echo -e "${RED}⚠️  Возможны конфликты слияния. Проверьте файлы.${NC}"
            echo "Выполните: git status"
        fi
        ;;
    
    2)
        echo ""
        read -p "Сообщение коммита: " message
        if [ -z "$message" ]; then
            message="Local changes"
        fi
        
        echo -e "${YELLOW}💾 Сохраняю изменения в коммит...${NC}"
        git add -A
        git commit -m "$message"
        
        echo -e "${YELLOW}⬇️  Загружаю обновления...${NC}"
        git pull
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Готово! Изменения закоммичены и объединены.${NC}"
        else
            echo ""
            echo -e "${RED}⚠️  Возможны конфликты слияния. Проверьте файлы.${NC}"
            echo "Выполните: git status"
        fi
        ;;
    
    3)
        echo ""
        echo -e "${RED}⚠️  ВНИМАНИЕ! Все локальные изменения будут удалены!${NC}"
        read -p "Вы уверены? (yes/no): " confirm
        
        if [ "$confirm" == "yes" ]; then
            echo -e "${YELLOW}🔄 Отменяю локальные изменения...${NC}"
            git reset --hard HEAD
            
            echo -e "${YELLOW}⬇️  Загружаю обновления...${NC}"
            git pull
            
            echo ""
            echo -e "${GREEN}✅ Готово! Локальные изменения отменены.${NC}"
        else
            echo ""
            echo -e "${YELLOW}Операция отменена.${NC}"
        fi
        ;;
    
    *)
        echo ""
        echo -e "${RED}Неверный выбор.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
