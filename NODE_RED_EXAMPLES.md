# Примеры Node-RED Flows для интеграции с Backend

## Установка Node-RED

```bash
# Установка Node-RED
npm install -g --unsafe-perm node-red

# Запуск Node-RED
node-red

# Node-RED будет доступен на http://localhost:1880
```

## Необходимые палеты для Node-RED

```bash
# MQTT клиент
npm install node-red-contrib-mqtt

# HTTP endpoints
# (уже встроен в Node-RED)
```

## Flow 1: Управление устройством через MQTT

Этот flow получает команду от backend и отправляет её в MQTT.

### Описание
1. HTTP endpoint принимает POST запрос от backend
2. Извлекает данные о пользователе из заголовков
3. Формирует MQTT топик
4. Отправляет команду в MQTT
5. Логирует действие

### JSON для импорта в Node-RED

```json
[
    {
        "id": "device_control_http",
        "type": "http in",
        "z": "flow1",
        "name": "Device Control Endpoint",
        "url": "/control/device/:deviceId",
        "method": "post",
        "upload": false,
        "swaggerDoc": "",
        "x": 120,
        "y": 80,
        "wires": [["extract_headers"]]
    },
    {
        "id": "extract_headers",
        "type": "function",
        "z": "flow1",
        "name": "Extract User Info",
        "func": "// Извлекаем информацию о пользователе из заголовков\nconst userId = msg.req.headers['x-user-id'];\nconst userName = msg.req.headers['x-user-name'];\nconst userRoles = msg.req.headers['x-user-roles'];\nconst deviceId = msg.req.params.deviceId;\n\n// Сохраняем в контекст\nmsg.userId = userId;\nmsg.userName = userName;\nmsg.userRoles = userRoles;\nmsg.deviceId = deviceId;\n\n// Получаем команду из body\nmsg.command = msg.payload;\n\nnode.status({fill:\"blue\",shape:\"dot\",text:`User: ${userName}, Device: ${deviceId}`});\n\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 350,
        "y": 80,
        "wires": [["check_permissions"]]
    },
    {
        "id": "check_permissions",
        "type": "function",
        "z": "flow1",
        "name": "Check Permissions",
        "func": "// Проверяем права (можно добавить запрос к backend)\nconst allowedRoles = ['ADMIN', 'MANAGER', 'OPERATOR'];\nconst roles = msg.userRoles.split(',');\n\nconst hasPermission = roles.some(role => allowedRoles.includes(role));\n\nif (!hasPermission) {\n    msg.statusCode = 403;\n    msg.payload = {error: 'Access denied'};\n    return [null, msg]; // Отправляем в output 2 (ошибка)\n}\n\nreturn [msg, null]; // Отправляем в output 1 (успех)",
        "outputs": 2,
        "noerr": 0,
        "x": 550,
        "y": 80,
        "wires": [["build_mqtt_topic"], ["http_response"]]
    },
    {
        "id": "build_mqtt_topic",
        "type": "function",
        "z": "flow1",
        "name": "Build MQTT Topic",
        "func": "// Формируем MQTT топик\n// Предполагаем, что buildingId можно получить из deviceId\n// В реальной системе нужно запросить у backend\nconst buildingId = 1; // TODO: получить из backend\n\nmsg.topic = `building/${buildingId}/device/${msg.deviceId}/set`;\nmsg.payload = msg.command;\n\nnode.status({fill:\"green\",shape:\"dot\",text:`Topic: ${msg.topic}`});\n\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 770,
        "y": 80,
        "wires": [["mqtt_publish", "log_action"]]
    },
    {
        "id": "mqtt_publish",
        "type": "mqtt out",
        "z": "flow1",
        "name": "Publish to MQTT",
        "topic": "",
        "qos": "1",
        "retain": "false",
        "broker": "mqtt_broker",
        "x": 1000,
        "y": 80,
        "wires": []
    },
    {
        "id": "log_action",
        "type": "function",
        "z": "flow1",
        "name": "Log Action",
        "func": "// Логируем действие\nconst logEntry = {\n    timestamp: new Date().toISOString(),\n    userId: msg.userId,\n    userName: msg.userName,\n    action: 'DEVICE_CONTROL',\n    deviceId: msg.deviceId,\n    command: msg.payload,\n    topic: msg.topic\n};\n\nnode.log(JSON.stringify(logEntry));\n\n// Отправляем успешный ответ\nmsg.statusCode = 200;\nmsg.payload = {\n    success: true,\n    message: 'Command sent to device',\n    topic: msg.topic\n};\n\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 1000,
        "y": 140,
        "wires": [["http_response"]]
    },
    {
        "id": "http_response",
        "type": "http response",
        "z": "flow1",
        "name": "HTTP Response",
        "statusCode": "",
        "headers": {},
        "x": 1200,
        "y": 140,
        "wires": []
    },
    {
        "id": "mqtt_broker",
        "type": "mqtt-broker",
        "name": "Local MQTT Broker",
        "broker": "localhost",
        "port": "1883",
        "clientid": "",
        "usetls": false,
        "protocolVersion": "4",
        "keepalive": "60",
        "cleansession": true,
        "birthTopic": "",
        "birthQos": "0",
        "birthPayload": "",
        "closeTopic": "",
        "closeQos": "0",
        "closePayload": "",
        "willTopic": "",
        "willQos": "0",
        "willPayload": ""
    }
]
```

## Flow 2: Чтение состояния устройства из MQTT

Этот flow подписывается на MQTT топики и кэширует состояние устройств.

### JSON для импорта в Node-RED

```json
[
    {
        "id": "device_state_http",
        "type": "http in",
        "z": "flow2",
        "name": "Get Device State",
        "url": "/state/device/:deviceId",
        "method": "get",
        "upload": false,
        "swaggerDoc": "",
        "x": 120,
        "y": 80,
        "wires": [["get_cached_state"]]
    },
    {
        "id": "get_cached_state",
        "type": "function",
        "z": "flow2",
        "name": "Get Cached State",
        "func": "const deviceId = msg.req.params.deviceId;\n\n// Получаем состояние из flow context\nconst state = flow.get(`device_${deviceId}_state`) || {status: 'unknown'};\n\nmsg.payload = {\n    deviceId: deviceId,\n    state: state,\n    timestamp: flow.get(`device_${deviceId}_timestamp`) || null\n};\n\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 370,
        "y": 80,
        "wires": [["state_http_response"]]
    },
    {
        "id": "state_http_response",
        "type": "http response",
        "z": "flow2",
        "name": "HTTP Response",
        "statusCode": "200",
        "headers": {},
        "x": 600,
        "y": 80,
        "wires": []
    },
    {
        "id": "mqtt_subscribe_state",
        "type": "mqtt in",
        "z": "flow2",
        "name": "Subscribe Device States",
        "topic": "building/+/device/+/state",
        "qos": "1",
        "datatype": "json",
        "broker": "mqtt_broker",
        "x": 150,
        "y": 200,
        "wires": [["parse_state_topic"]]
    },
    {
        "id": "parse_state_topic",
        "type": "function",
        "z": "flow2",
        "name": "Parse Topic & Cache State",
        "func": "// Парсим топик: building/{buildingId}/device/{deviceId}/state\nconst topicParts = msg.topic.split('/');\nconst buildingId = topicParts[1];\nconst deviceId = topicParts[3];\n\n// Кэшируем состояние\nflow.set(`device_${deviceId}_state`, msg.payload);\nflow.set(`device_${deviceId}_timestamp`, new Date().toISOString());\n\nnode.status({fill:\"green\",shape:\"dot\",text:`Device ${deviceId} updated`});\n\n// Можно отправить обновление в backend\nmsg.deviceId = deviceId;\nmsg.buildingId = buildingId;\nmsg.state = msg.payload;\n\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 420,
        "y": 200,
        "wires": [["update_backend_cache"]]
    },
    {
        "id": "update_backend_cache",
        "type": "http request",
        "z": "flow2",
        "name": "Update Backend Cache",
        "method": "PUT",
        "ret": "txt",
        "paytoqs": "ignore",
        "url": "http://localhost:8080/api/devices/{{deviceId}}/state",
        "tls": "",
        "persist": false,
        "proxy": "",
        "authType": "",
        "x": 700,
        "y": 200,
        "wires": [[]]
    }
]
```

## Flow 3: Генерация отчета по зданию

### JSON для импорта в Node-RED

```json
[
    {
        "id": "building_report_http",
        "type": "http in",
        "z": "flow3",
        "name": "Building Report Endpoint",
        "url": "/report/building/:buildingId",
        "method": "get",
        "upload": false,
        "swaggerDoc": "",
        "x": 140,
        "y": 80,
        "wires": [["extract_report_params"]]
    },
    {
        "id": "extract_report_params",
        "type": "function",
        "z": "flow3",
        "name": "Extract Parameters",
        "func": "const buildingId = msg.req.params.buildingId;\nconst reportType = msg.req.query.reportType || 'summary';\nconst startDate = msg.req.query.startDate || new Date(Date.now() - 7*24*60*60*1000).toISOString();\nconst endDate = msg.req.query.endDate || new Date().toISOString();\n\nmsg.buildingId = buildingId;\nmsg.reportType = reportType;\nmsg.startDate = startDate;\nmsg.endDate = endDate;\n\nnode.status({fill:\"blue\",shape:\"dot\",text:`Report: ${reportType} for building ${buildingId}`});\n\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 410,
        "y": 80,
        "wires": [["generate_report"]]
    },
    {
        "id": "generate_report",
        "type": "function",
        "z": "flow3",
        "name": "Generate Report",
        "func": "// Здесь генерируем отчет на основе данных из MQTT/базы\n// Это упрощенный пример\n\nconst report = {\n    buildingId: msg.buildingId,\n    reportType: msg.reportType,\n    period: {\n        start: msg.startDate,\n        end: msg.endDate\n    },\n    data: {\n        totalDevices: 150,\n        activeDevices: 142,\n        alerts: 3,\n        energyConsumption: {\n            heating: 12500, // kWh\n            lighting: 3200,\n            hvac: 8900\n        },\n        systemStatus: {\n            access_control: 'operational',\n            cctv: 'operational',\n            heating: 'warning',\n            lighting: 'operational',\n            hvac: 'operational'\n        }\n    },\n    generatedAt: new Date().toISOString()\n};\n\nmsg.payload = report;\n\nreturn msg;",
        "outputs": 1,
        "noerr": 0,
        "x": 660,
        "y": 80,
        "wires": [["report_http_response"]]
    },
    {
        "id": "report_http_response",
        "type": "http response",
        "z": "flow3",
        "name": "HTTP Response",
        "statusCode": "200",
        "headers": {"Content-Type": "application/json"},
        "x": 880,
        "y": 80,
        "wires": []
    }
]
```

## Простой способ импорта flows в Node-RED

1. Скопируйте JSON код flow
2. Откройте Node-RED (http://localhost:1880)
3. Нажмите на меню (три полоски) → Import
4. Вставьте JSON код
5. Нажмите Import
6. Разместите nodes на рабочей области
7. Нажмите Deploy

## Тестирование интеграции

### 1. Тестирование управления устройством

```bash
# Через backend (с авторизацией)
curl -X POST http://localhost:8080/api/nodered/control/device/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command": "on", "value": 100}'

# Напрямую в Node-RED (для тестирования)
curl -X POST http://localhost:1880/control/device/1 \
  -H "X-User-Id: 1" \
  -H "X-User-Name: admin" \
  -H "X-User-Roles: ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"command": "on", "value": 100}'
```

### 2. Тестирование получения состояния

```bash
# Через backend
curl http://localhost:8080/api/nodered/state/device/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Напрямую в Node-RED
curl http://localhost:1880/state/device/1
```

### 3. Тестирование отчетов

```bash
# Через backend
curl "http://localhost:8080/api/nodered/report/building/1?reportType=energy&startDate=2026-05-01T00:00:00&endDate=2026-05-10T23:59:59" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Напрямую в Node-RED
curl "http://localhost:1880/report/building/1?reportType=energy"
```

## Настройка MQTT Broker (Mosquitto)

```bash
# Установка Mosquitto на Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# Запуск Mosquitto
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Тестирование MQTT
# Терминал 1 - подписка
mosquitto_sub -h localhost -t "building/+/device/+/state"

# Терминал 2 - публикация
mosquitto_pub -h localhost -t "building/1/device/1/state" -m '{"status":"on","value":100}'
```

## Дополнительные рекомендации

1. **Безопасность MQTT**: Настройте аутентификацию в Mosquitto
2. **Персистентность**: Используйте Node-RED context storage для сохранения состояний
3. **Масштабирование**: Используйте MQTT QoS уровни для гарантии доставки
4. **Мониторинг**: Добавьте логирование в файлы или внешние системы
5. **Производительность**: Используйте batch обработку для массовых операций
