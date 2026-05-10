# ✅ Чеклист установки на виртуалку Linux

Пошаговое руководство для запуска Building Management System на чистой Linux VM.

## 📋 Чеклист

### ✅ Этап 1: Подготовка виртуалки

- [ ] Создана VM с Ubuntu/Debian
- [ ] Настроен SSH доступ
- [ ] Известен IP адрес виртуалки
- [ ] Есть пользователь с sudo правами

**Проверка:**
```bash
ssh user@vm-ip
sudo apt update
```

---

### ✅ Этап 2: Копирование проекта

**Вариант А: Автоматическое копирование (рекомендуется)**
```bash
# На локальной машине
cd /path/to/building-management
chmod +x deploy-to-vm.sh
./deploy-to-vm.sh
```

**Вариант Б: Ручное копирование**
```bash
# На локальной машине
scp -r /path/to/building-management user@vm-ip:~/
```

**Чеклист:**
- [ ] Проект скопирован на виртуалку
- [ ] Файлы доступны по пути ~/building-management

**Проверка:**
```bash
# На виртуалке
ls ~/building-management
# Должны быть: backend/, src/, package.json, etc.
```

---

### ✅ Этап 3: Установка зависимостей

**Автоматическая установка:**
```bash
# На виртуалке
cd ~/building-management
chmod +x install-linux.sh
./install-linux.sh
```

Скрипт установит:
- [ ] Java 17
- [ ] Maven 3.x
- [ ] PostgreSQL
- [ ] Node.js 20
- [ ] pnpm
- [ ] Git, curl, jq

**Проверка:**
```bash
java -version      # Должно быть 17.x
mvn -version       # Должно быть 3.x
psql --version     # Должно быть 12+
node -v            # Должно быть v20.x
pnpm -v            # Latest
```

---

### ✅ Этап 4: Настройка PostgreSQL

**Автоматическая (через install-linux.sh):**
- [ ] База `building_management` создана
- [ ] Пользователь `building_user` создан
- [ ] Пароль: `building_pass`

**Ручная настройка (если нужно):**
```bash
sudo -u postgres psql
CREATE USER building_user WITH PASSWORD 'building_pass';
CREATE DATABASE building_management OWNER building_user;
GRANT ALL PRIVILEGES ON DATABASE building_management TO building_user;
\q
```

**Проверка:**
```bash
psql -U building_user -d building_management -h localhost
# Введите пароль: building_pass
# Должно подключиться
\dt
\q
```

---

### ✅ Этап 5: Настройка Backend

```bash
cd ~/building-management/backend
nano src/main/resources/application.properties
```

**Изменить:**
```properties
# Database
spring.datasource.username=building_user
spring.datasource.password=building_pass

# JWT Secret - ОБЯЗАТЕЛЬНО изменить для production!
jwt.secret=your-unique-secret-key-minimum-256-bits-long-random-string

# CORS - добавить IP виртуалки
cors.allowed.origins=http://localhost:5173,http://YOUR_VM_IP:5173
```

**Чеклист:**
- [ ] Database credentials настроены
- [ ] JWT secret изменен (для production)
- [ ] CORS origins включает IP виртуалки

---

### ✅ Этап 6: Запуск Backend

```bash
cd ~/building-management/backend
chmod +x start.sh
./start.sh
```

**Ожидаемый вывод:**
```
Started BuildingManagementApplication in X.XXX seconds
```

**Чеклист:**
- [ ] Backend запустился без ошибок
- [ ] В логах видно "Started BuildingManagementApplication"
- [ ] Нет ошибок подключения к PostgreSQL

**Проверка (в новом терминале):**
```bash
curl http://localhost:8080/api/auth/health
# Должен вернуть JSON с success: true
```

---

### ✅ Этап 7: Создание пользователя

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@building.com",
    "password": "admin123",
    "fullName": "Администратор"
  }'
```

**Ожидаемый ответ:**
```json
{"success":true,"message":"User registered successfully"}
```

**Чеклист:**
- [ ] Пользователь создан успешно
- [ ] Нет ошибок

**Опционально - создать дополнительных пользователей:**
```bash
# Manager
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"manager","email":"manager@building.com","password":"manager123","fullName":"Manager"}'

# Operator
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"operator","email":"operator@building.com","password":"operator123","fullName":"Operator"}'
```

---

### ✅ Этап 8: Настройка Frontend

```bash
cd ~/building-management

# Проверить API URL
cat src/app/config/api.ts
```

**Если backend на другом хосте - изменить:**
```bash
nano src/app/config/api.ts
```

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://YOUR_BACKEND_IP:8080/api',
  TIMEOUT: 10000,
};
```

**Чеклист:**
- [ ] API_CONFIG.BASE_URL правильный
- [ ] Если backend на том же хосте - localhost:8080
- [ ] Если на другом - указан правильный IP

---

### ✅ Этап 9: Установка Frontend зависимостей

```bash
cd ~/building-management
pnpm install
```

**Ожидаемый вывод:**
```
Dependencies installed successfully
```

**Чеклист:**
- [ ] pnpm install завершился успешно
- [ ] Нет ошибок
- [ ] node_modules создана

---

### ✅ Этап 10: Запуск Frontend

**Для доступа только с localhost:**
```bash
pnpm run dev
```

**Для доступа извне (с вашей локальной машины):**
```bash
pnpm run dev -- --host 0.0.0.0
```

**Ожидаемый вывод:**
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

**Чеклист:**
- [ ] Frontend запустился
- [ ] Нет ошибок компиляции
- [ ] Указан Network URL для доступа извне

---

### ✅ Этап 11: Настройка Firewall (если нужен внешний доступ)

```bash
sudo ufw allow 8080/tcp  # Backend
sudo ufw allow 5173/tcp  # Frontend
sudo ufw allow 22/tcp    # SSH (важно!)
sudo ufw enable
sudo ufw status
```

**Чеклист:**
- [ ] Порт 8080 открыт (backend)
- [ ] Порт 5173 открыт (frontend)
- [ ] Порт 22 открыт (SSH - не забыть!)
- [ ] UFW активен

---

### ✅ Этап 12: Тестирование

**Тест 1: Backend health**
```bash
curl http://localhost:8080/api/auth/health
```
✅ Должен вернуть `{"success":true,...}`

**Тест 2: Login через API**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
✅ Должен вернуть JWT token

**Тест 3: Frontend в браузере**

Откройте в браузере:
- С виртуалки: `http://localhost:5173`
- С локальной машины: `http://VM_IP:5173`

✅ Должна открыться страница логина

**Тест 4: Вход в систему**
- Логин: `admin`
- Пароль: `admin123`

✅ Должно перенаправить в раздел "Объекты"

**Чеклист:**
- [ ] Backend API отвечает
- [ ] Login работает через API
- [ ] Frontend открывается в браузере
- [ ] Вход в систему работает
- [ ] После входа видны интерфейс и данные

---

### ✅ Этап 13: Финальная проверка

**Запущенные процессы:**
```bash
# Проверить что все работает
ps aux | grep java      # Backend должен быть
ps aux | grep vite      # Frontend должен быть
sudo systemctl status postgresql  # PostgreSQL должен быть active
```

**Порты:**
```bash
sudo netstat -tulpn | grep LISTEN
```

Должны слушаться:
- [ ] 5432 (PostgreSQL)
- [ ] 8080 (Backend)
- [ ] 5173 (Frontend)

**Проверка через браузер:**
- [ ] Открывается http://VM_IP:5173
- [ ] Логин работает
- [ ] Интерфейс загружается
- [ ] Можно создать здание
- [ ] Можно добавить этаж
- [ ] Можно добавить помещение

---

## 🎉 Готово!

Если все чекбоксы отмечены - система полностью работает!

## 🔧 Траблшутинг

### Backend не запускается

```bash
# Проверить логи
tail -f ~/building-management/backend/logs/*.log

# Проверить PostgreSQL
sudo systemctl status postgresql
psql -U building_user -d building_management
```

### Frontend не подключается к Backend

```bash
# Проверить CORS
grep cors ~/building-management/backend/src/main/resources/application.properties

# Проверить API URL
cat ~/building-management/src/app/config/api.ts

# Проверить firewall
sudo ufw status
```

### Порты заняты

```bash
# Найти процесс на порту
sudo lsof -i :8080
sudo lsof -i :5173

# Убить процесс
kill -9 PID
```

---

## 📚 Дополнительно

### Запуск в фоне через screen

**Backend:**
```bash
screen -S backend
cd ~/building-management/backend
mvn spring-boot:run
# Нажать Ctrl+A, затем D чтобы отключиться
```

**Frontend:**
```bash
screen -S frontend
cd ~/building-management
pnpm run dev -- --host 0.0.0.0
# Нажать Ctrl+A, затем D
```

**Вернуться к сессии:**
```bash
screen -r backend
screen -r frontend
```

### Автозапуск при перезагрузке

См. раздел "Автозапуск" в [LINUX_SETUP.md](LINUX_SETUP.md)

---

## 🆘 Помощь

Если что-то не работает:
1. Проверьте логи backend: `tail -f ~/building-management/backend/logs/*.log`
2. Проверьте логи PostgreSQL: `sudo journalctl -u postgresql -n 50`
3. Проверьте DevTools в браузере (F12) → Console, Network
4. См. полную документацию: [LINUX_SETUP.md](LINUX_SETUP.md)
