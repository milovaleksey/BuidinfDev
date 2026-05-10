# API Test Examples

Примеры тестирования новых API endpoints Backend.

## Подготовка

```bash
# Запустить backend
cd backend
./start.sh

# В отдельном терминале - получить токен
TOKEN=$(curl -s -X POST PGPASSWORD=postgres psql -h localhost -U postgres -d building_management -f init-data.sql \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

echo "Token: $TOKEN"
```

## 1. Тестирование Buildings API

### Создание здания
```bash
curl -X POST http://localhost:8080/buildings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Главный офис",
    "address": "Москва, ул. Ленина, д.1",
    "floorsCount": 5,
    "config": {"parking": true, "security": "high"}
  }' | jq
```

### Получение всех зданий
```bash
curl http://localhost:8080/buildings \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Обновление здания
```bash
curl -X PUT http://localhost:8080/buildings/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Главный офис (обновлено)",
    "address": "Москва, ул. Ленина, д.1",
    "floorsCount": 6
  }' | jq
```

### Экспорт здания
```bash
curl http://localhost:8080/buildings/1/export \
  -H "Authorization: Bearer $TOKEN" | jq > building_export.json
```

### Импорт здания
```bash
curl -X POST http://localhost:8080/buildings/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @building_export.json | jq
```

## 2. Тестирование Floors API

### Создание этажа
```bash
curl -X POST http://localhost:8080/api/floors/building/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "floorNumber": 1,
    "name": "Первый этаж",
    "planConfig": {"width": 1000, "height": 800}
  }' | jq
```

### Получение этажей здания
```bash
curl http://localhost:8080/api/floors/building/1 \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Обновление этажа
```bash
curl -X PUT http://localhost:8080/api/floors/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "floorNumber": 1,
    "name": "Первый этаж (обновлено)",
    "planConfig": {"width": 1200, "height": 900}
  }' | jq
```

### Создание нескольких этажей
```bash
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/floors/building/1 \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"floorNumber\": $i,
      \"name\": \"Этаж $i\",
      \"planConfig\": {\"width\": 1000, \"height\": 800}
    }"
  echo ""
done
```

## 3. Тестирование Rooms API

### Создание помещения
```bash
curl -X POST http://localhost:8080/api/rooms/floor/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Офис 101",
    "roomType": "office",
    "x": 100,
    "y": 100,
    "width": 300,
    "height": 200,
    "config": {"capacity": 10, "hasWindow": true}
  }' | jq
```

### Получение помещений этажа
```bash
curl http://localhost:8080/api/rooms/floor/1 \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Обновление помещения
```bash
curl -X PUT http://localhost:8080/api/rooms/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Переговорная 101",
    "roomType": "meeting",
    "x": 100,
    "y": 100,
    "width": 350,
    "height": 250,
    "config": {"capacity": 12, "hasWindow": true, "hasProjector": true}
  }' | jq
```

### Создание нескольких помещений
```bash
# Офисы
curl -X POST http://localhost:8080/api/rooms/floor/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Офис 102","roomType":"office","x":420,"y":100,"width":300,"height":200}'

# Коридор
curl -X POST http://localhost:8080/api/rooms/floor/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Коридор","roomType":"corridor","x":100,"y":320,"width":620,"height":100}'

# Техническое помещение
curl -X POST http://localhost:8080/api/rooms/floor/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Серверная","roomType":"technical","x":740,"y":100,"width":200,"height":320}'
```

## 4. Тестирование Devices API

### Создание устройства
```bash
curl -X POST http://localhost:8080/api/devices/room/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Камера 1",
    "deviceType": "camera",
    "systemTypeId": 2,
    "mqttTopic": "building/1/device/1",
    "x": 150,
    "y": 150,
    "config": {"resolution": "1080p", "fps": 30},
    "enabled": true
  }' | jq
```

### Получение устройств помещения
```bash
curl http://localhost:8080/api/devices/room/1 \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Обновление устройства
```bash
curl -X PUT http://localhost:8080/api/devices/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Камера 1 (PTZ)",
    "deviceType": "camera_ptz",
    "systemTypeId": 2,
    "mqttTopic": "building/1/device/1",
    "x": 150,
    "y": 150,
    "config": {"resolution": "4K", "fps": 30, "ptz": true},
    "enabled": true
  }' | jq
```

### Обновление состояния устройства (для Node-RED)
```bash
curl -X PUT http://localhost:8080/api/devices/1/state \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "online",
    "temperature": 22.5,
    "recording": true
  }' | jq
```

### Создание различных устройств
```bash
# Лампа
curl -X POST http://localhost:8080/api/devices/room/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Лампа потолочная",
    "deviceType": "light",
    "systemTypeId": 4,
    "mqttTopic": "building/1/device/2",
    "x": 200,
    "y": 150,
    "enabled": true
  }'

# Термостат
curl -X POST http://localhost:8080/api/devices/room/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Термостат",
    "deviceType": "thermostat",
    "systemTypeId": 3,
    "mqttTopic": "building/1/device/3",
    "x": 250,
    "y": 150,
    "config": {"targetTemp": 22, "mode": "auto"},
    "enabled": true
  }'

# Замок двери
curl -X POST http://localhost:8080/api/devices/room/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Замок двери",
    "deviceType": "door_lock",
    "systemTypeId": 1,
    "mqttTopic": "building/1/device/4",
    "x": 100,
    "y": 200,
    "enabled": true
  }'
```

## 5. Тестирование Node-RED Proxy API

### Отправка команды устройству
```bash
curl -X POST http://localhost:8080/api/nodered/control/device/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "on",
    "brightness": 80
  }' | jq
```

### Получение состояния устройства
```bash
curl http://localhost:8080/api/nodered/state/device/1 \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Получение отчета по зданию
```bash
curl "http://localhost:8080/api/nodered/report/building/1?reportType=energy&startDate=2026-05-01T00:00:00&endDate=2026-05-10T23:59:59" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Получение отчета по системе
```bash
curl "http://localhost:8080/api/nodered/report/system/heating?startDate=2026-05-01T00:00:00&endDate=2026-05-10T23:59:59" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 6. Тестирование Audit Log API

### Последние 100 логов
```bash
curl http://localhost:8080/api/audit/recent \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Логи пользователя
```bash
curl "http://localhost:8080/api/audit/user/1?page=0&size=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Логи устройства
```bash
curl "http://localhost:8080/api/audit/entity/Device/1?page=0&size=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Логи за период
```bash
curl "http://localhost:8080/api/audit/period?start=2026-05-01T00:00:00&end=2026-05-10T23:59:59&page=0&size=50" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 7. Тестирование прав доступа

### Создание пользователя с ролью OPERATOR
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator1",
    "email": "operator@building.com",
    "password": "operator123",
    "fullName": "Test Operator"
  }' | jq

# Получить токен оператора
OPERATOR_TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"operator1","password":"operator123"}' | jq -r '.token')
```

### Попытка создать здание (должна быть отклонена)
```bash
curl -X POST http://localhost:8080/buildings \
  -H "Authorization: Bearer $OPERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","address":"Test"}' 
# Ожидается: 403 Forbidden
```

### Попытка управлять устройством (должна быть успешной)
```bash
curl -X POST http://localhost:8080/api/nodered/control/device/1 \
  -H "Authorization: Bearer $OPERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"on"}' | jq
# Ожидается: 200 OK
```

## 8. Массовое создание тестовых данных

```bash
#!/bin/bash

TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')

# Создать здание
BUILDING_ID=$(curl -s -X POST http://localhost:8080/buildings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Тестовое здание",
    "address": "Москва, Тестовая ул., д.1",
    "floorsCount": 3
  }' | jq -r '.id')

echo "Created building: $BUILDING_ID"

# Создать 3 этажа
for floor in {1..3}; do
  FLOOR_ID=$(curl -s -X POST http://localhost:8080/api/floors/building/$BUILDING_ID \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"floorNumber\": $floor,
      \"name\": \"Этаж $floor\",
      \"planConfig\": {\"width\": 1000, \"height\": 800}
    }" | jq -r '.id')
  
  echo "Created floor: $FLOOR_ID"
  
  # Создать 5 помещений на этаже
  for room in {1..5}; do
    ROOM_ID=$(curl -s -X POST http://localhost:8080/api/rooms/floor/$FLOOR_ID \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Офис ${floor}0${room}\",
        \"roomType\": \"office\",
        \"x\": $((room * 200)),
        \"y\": 100,
        \"width\": 180,
        \"height\": 150
      }" | jq -r '.id')
    
    echo "  Created room: $ROOM_ID"
    
    # Создать 3 устройства в помещении
    curl -s -X POST http://localhost:8080/api/devices/room/$ROOM_ID \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Камера ${floor}0${room}\",
        \"deviceType\": \"camera\",
        \"systemTypeId\": 2,
        \"mqttTopic\": \"building/${BUILDING_ID}/device/camera_${floor}_${room}\",
        \"x\": 90,
        \"y\": 75,
        \"enabled\": true
      }" > /dev/null
    
    curl -s -X POST http://localhost:8080/api/devices/room/$ROOM_ID \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Лампа ${floor}0${room}\",
        \"deviceType\": \"light\",
        \"systemTypeId\": 4,
        \"mqttTopic\": \"building/${BUILDING_ID}/device/light_${floor}_${room}\",
        \"x\": 90,
        \"y\": 120,
        \"enabled\": true
      }" > /dev/null
  done
done

echo "Test data created successfully!"
```

## 9. Проверка логирования

```bash
# Выполнить несколько действий
curl -X POST http://localhost:8080/buildings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Building","address":"Test"}'

# Проверить логи
curl http://localhost:8080/api/audit/recent \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | {action, entityType, userName, createdAt}'
```

## 10. Очистка тестовых данных

```bash
# Удалить здание (каскадно удалит все вложенные сущности)
curl -X DELETE http://localhost:8080/buildings/1 \
  -H "Authorization: Bearer $TOKEN"
```
