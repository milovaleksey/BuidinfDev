#!/bin/bash

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Быстрое исправление пароля admin в БД...${NC}"

# Правильный хеш для пароля "password"
CORRECT_HASH='$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK'

sudo -u postgres psql -d building_management << EOF
UPDATE users 
SET password_hash = '$CORRECT_HASH'
WHERE username = 'admin';

SELECT 
    username,
    enabled,
    LEFT(password_hash, 40) || '...' as password_hash_preview
FROM users 
WHERE username = 'admin';
EOF

echo ""
echo -e "${GREEN}✅ Готово! Теперь можно войти с:${NC}"
echo "   Логин: admin"
echo "   Пароль: password"
