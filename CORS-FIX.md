# 🔧 Исправление CORS

## Проблема

```
Access to XMLHttpRequest at 'http://10.81.0.60:8080/api/auth/login' from origin 'http://10.81.0.60:5173' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Причина

Spring Security блокировал CORS запросы, так как:
1. Использовался `allowedOrigins("*")` с `allowCredentials(true)` - несовместимая комбинация
2. CORS конфигурация не была корректно интегрирована с Spring Security

## Решение

### 1. Создан CorsConfig.java
Новый конфигурационный класс с правильными настройками CORS:
- Используется `allowedOriginPatterns("*")` вместо `allowedOrigins("*")`
- Разрешены все необходимые методы и заголовки
- Включен `allowCredentials(true)` для JWT токенов

### 2. Обновлен SecurityConfig.java
- Добавлен `CorsConfigurationSource` как зависимость
- CORS конфигурация интегрирована в Spring Security
- Убран префикс `/api` из путей (он уже в context-path)

### 3. Упрощен WebConfig.java
- Удалена зависимость от `application.properties`
- Используется `allowedOriginPatterns("*")`

## Шаги для применения исправления

### 1. Перезапустите Backend

```bash
cd backend
chmod +x restart.sh
./restart.sh
```

### 2. Проверьте CORS

```bash
cd ..
chmod +x test-cors.sh
./test-cors.sh
```

Вы должны увидеть CORS заголовки в ответах:

```
Access-Control-Allow-Origin: http://10.81.0.60:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
```

### 3. Проверьте систему

```bash
./check-system.sh
```

### 4. Откройте фронтенд

Откройте в браузере:
```
http://10.81.0.60:5173
```

Войдите с учетными данными:
- **Логин:** `admin`
- **Пароль:** `password`

## Файлы изменены

- ✅ `/backend/src/main/java/com/building/management/config/CorsConfig.java` - создан
- ✅ `/backend/src/main/java/com/building/management/config/SecurityConfig.java` - обновлен
- ✅ `/backend/src/main/java/com/building/management/config/WebConfig.java` - обновлен
- ✅ `/backend/src/main/resources/application.properties` - упрощен
- ✅ `/backend/restart.sh` - создан
- ✅ `/test-cors.sh` - создан

## Проверка логов

Если авторизация не работает, проверьте логи бэкенда:

```bash
cd backend
tail -f nohup.out
```

Ищите строки с:
- `Access-Control-Allow-Origin`
- `Authentication attempt`
- `JWT token`

## Troubleshooting

### Проблема: CORS заголовки все еще отсутствуют

**Решение:**
```bash
# Убедитесь что старый процесс остановлен
pkill -f spring-boot
pkill -f building-management

# Перезапустите
cd backend
./start.sh
```

### Проблема: Ошибка компиляции Java

**Решение:**
```bash
cd backend
mvn clean compile
./start.sh
```

### Проблема: 401 Unauthorized после исправления CORS

**Решение:** Проверьте что пользователи загружены в БД:
```bash
cd backend
./check-db.sh
```

Если пользователей нет, загрузите их:
```bash
./load-demo-data.sh
```

## Дополнительные настройки для продакшена

⚠️ **Внимание:** Текущие настройки разрешают запросы с любых источников (`allowedOriginPatterns("*")`).

Для **продакшен-окружения** измените в `CorsConfig.java`:

```java
// Вместо
configuration.setAllowedOriginPatterns(List.of("*"));

// Используйте конкретные домены
configuration.setAllowedOriginPatterns(Arrays.asList(
    "https://your-production-domain.com",
    "https://www.your-production-domain.com"
));
```
