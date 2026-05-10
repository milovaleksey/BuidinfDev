# 📦 Ручной деплой на виртуалку

Инструкция для копирования проекта на виртуалку вручную.

## Вариант 1: Через rsync (рекомендуется)

```bash
# На вашей локальной машине
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'target' \
  --exclude '.git' \
  --exclude 'dist' \
  ./ srvadmin@10.81.0.60:/home/srvadmin/building-management/
```

**Преимущества:**
- Быстрее чем scp
- Показывает прогресс
- Можно прервать и продолжить
- Копирует только изменения при повторном запуске

## Вариант 2: Через tar + ssh

```bash
# На вашей локальной машине
# Сначала создать директорию на виртуалке
ssh srvadmin@10.81.0.60 "mkdir -p /home/srvadmin/building-management"

# Запаковать и передать
tar czf - \
  --exclude='node_modules' \
  --exclude='target' \
  --exclude='.git' \
  . | ssh srvadmin@10.81.0.60 "cd /home/srvadmin/building-management && tar xzf -"
```

**Преимущества:**
- Работает везде где есть tar и ssh
- Передает архив по сети (быстрее для многих файлов)

## Вариант 3: Через scp (простой)

```bash
# На вашей локальной машине
# Создать директорию
ssh srvadmin@10.81.0.60 "mkdir -p /home/srvadmin/building-management"

# Скопировать файлы (по одному)
scp -r backend srvadmin@10.81.0.60:/home/srvadmin/building-management/
scp -r src srvadmin@10.81.0.60:/home/srvadmin/building-management/
scp package.json srvadmin@10.81.0.60:/home/srvadmin/building-management/
scp pom.xml srvadmin@10.81.0.60:/home/srvadmin/building-management/
scp *.md srvadmin@10.81.0.60:/home/srvadmin/building-management/
scp *.sh srvadmin@10.81.0.60:/home/srvadmin/building-management/
```

**Недостатки:**
- Медленнее
- Много команд
- Не показывает общий прогресс

## Вариант 4: Через архив

### На локальной машине:

```bash
# Создать архив (исключая ненужное)
tar czf building-management.tar.gz \
  --exclude='node_modules' \
  --exclude='target' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='build' \
  .

# Передать архив
scp building-management.tar.gz srvadmin@10.81.0.60:/home/srvadmin/
```

### На виртуалке:

```bash
# Подключиться
ssh srvadmin@10.81.0.60

# Распаковать
mkdir -p building-management
tar xzf building-management.tar.gz -C building-management
rm building-management.tar.gz

# Проверить
ls building-management/
```

## Вариант 5: Через Git (если есть репозиторий)

### На виртуалке:

```bash
ssh srvadmin@10.81.0.60

# Клонировать репозиторий
git clone https://github.com/your-username/building-management.git
cd building-management
```

**Преимущества:**
- Самый простой способ
- Легко обновлять (git pull)
- Версионирование

## Вариант 6: Через WinSCP/FileZilla (GUI)

Если вы на Windows или предпочитаете GUI:

1. Скачать **WinSCP** или **FileZilla**
2. Подключиться к виртуалке:
   - Host: `10.81.0.60`
   - Username: `srvadmin`
   - Port: `22`
3. Создать папку `/home/srvadmin/building-management`
4. Перетащить все файлы проекта в эту папку
5. Исключить из копирования:
   - `node_modules/`
   - `target/`
   - `.git/`
   - `dist/`
   - `build/`

## Проверка после копирования

```bash
# Подключиться к виртуалке
ssh srvadmin@10.81.0.60

# Проверить что файлы скопированы
ls -la ~/building-management/

# Должны быть видны:
# - backend/
# - src/
# - package.json
# - install-linux.sh
# - *.md файлы
# - etc.

# Проверить размер
du -sh ~/building-management/
```

## Что делать после копирования

1. **Установить зависимости:**
   ```bash
   cd ~/building-management
   chmod +x install-linux.sh
   ./install-linux.sh
   ```

2. **Следовать чеклисту:**
   ```bash
   cat VM_CHECKLIST.md
   ```

## Траблшутинг

### Ошибка "No such file or directory"

```bash
# Создать директорию вручную на виртуалке
ssh srvadmin@10.81.0.60
mkdir -p /home/srvadmin/building-management
exit

# Теперь повторить копирование
```

### Ошибка "Permission denied"

```bash
# Проверить права на виртуалке
ssh srvadmin@10.81.0.60 "ls -ld /home/srvadmin/"

# Если нужно - создать в другом месте
ssh srvadmin@10.81.0.60 "mkdir -p /tmp/building-management"
# И копировать туда
```

### SSH запрашивает пароль каждый раз

Настройте SSH ключи для быстрого доступа:

```bash
# На локальной машине
ssh-keygen -t rsa -b 4096

# Скопировать ключ на виртуалку
ssh-copy-id srvadmin@10.81.0.60

# Теперь SSH не будет запрашивать пароль
```

## Рекомендуемый способ

**Для начала:** Вариант 2 (tar + ssh) - быстро и надежно

**Для разработки:** Вариант 5 (Git) - удобно обновлять

**Для GUI:** Вариант 6 (WinSCP) - если не любите командную строку

## Быстрая команда (копировать-вставить)

```bash
# Замените IP и пользователя на свои
VM_USER="srvadmin"
VM_IP="10.81.0.60"
VM_PATH="/home/srvadmin/building-management"

# Создать директорию
ssh $VM_USER@$VM_IP "mkdir -p $VM_PATH"

# Скопировать через tar
tar czf - --exclude='node_modules' --exclude='target' --exclude='.git' . | \
  ssh $VM_USER@$VM_IP "cd $VM_PATH && tar xzf -"

echo "Готово! Подключитесь: ssh $VM_USER@$VM_IP"
```
