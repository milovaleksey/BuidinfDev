-- Инициализация данных для Building Management System
-- Этот файл создает начальных пользователей и демо-данные

-- Очистка существующих данных (осторожно!)
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE permissions CASCADE;
TRUNCATE TABLE devices CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE floors CASCADE;
TRUNCATE TABLE buildings CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE users CASCADE;
-- roles и system_types не очищаем - они заполняются в schema.sql

-- Создание пользователей
-- Пароли захешированы с помощью BCrypt (все пароли = "password")
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
INSERT INTO users (username, password_hash, email, full_name, enabled) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin@building.com', 'Администратор Системы', true),
('manager', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager@building.com', 'Менеджер Здания', true),
('operator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'operator@building.com', 'Оператор Систем', true),
('viewer', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'viewer@building.com', 'Наблюдатель', true);

-- Назначение ролей пользователям
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.name = 'ADMIN';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'manager' AND r.name = 'MANAGER';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'operator' AND r.name = 'OPERATOR';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'viewer' AND r.name = 'VIEWER';

-- Создание демо-здания
INSERT INTO buildings (name, address, floors_count, config, created_at, updated_at) VALUES
('Главный офис', 'ул. Примерная, д. 1, Москва', 5, 
 '{"description": "Пятиэтажное административное здание", "year_built": 2020}',
 NOW(), NOW());

-- Получаем ID созданного здания и создаем структуру
DO $$
DECLARE
    building_id BIGINT;
    floor1_id BIGINT;
    floor2_id BIGINT;
    floor3_id BIGINT;
    room1_id BIGINT;
    room2_id BIGINT;
    room3_id BIGINT;
    room4_id BIGINT;
    system_access_id BIGINT;
    system_cctv_id BIGINT;
    system_heating_id BIGINT;
    system_lighting_id BIGINT;
    system_hvac_id BIGINT;
BEGIN
    -- Получаем ID здания
    SELECT id INTO building_id FROM buildings WHERE name = 'Главный офис';
    
    -- Получаем ID типов систем
    SELECT id INTO system_access_id FROM system_types WHERE code = 'access_control';
    SELECT id INTO system_cctv_id FROM system_types WHERE code = 'cctv';
    SELECT id INTO system_heating_id FROM system_types WHERE code = 'heating';
    SELECT id INTO system_lighting_id FROM system_types WHERE code = 'lighting';
    SELECT id INTO system_hvac_id FROM system_types WHERE code = 'hvac';

    -- Создание этажей
    INSERT INTO floors (building_id, floor_number, name, plan_config, created_at, updated_at) 
    VALUES (building_id, 1, 'Первый этаж', '{"style": "modern", "color": "#f0f0f0"}', NOW(), NOW())
    RETURNING id INTO floor1_id;

    INSERT INTO floors (building_id, floor_number, name, plan_config, created_at, updated_at) 
    VALUES (building_id, 2, 'Второй этаж', '{"style": "modern", "color": "#f0f0f0"}', NOW(), NOW())
    RETURNING id INTO floor2_id;

    INSERT INTO floors (building_id, floor_number, name, plan_config, created_at, updated_at) 
    VALUES (building_id, 3, 'Третий этаж', '{"style": "modern", "color": "#f0f0f0"}', NOW(), NOW())
    RETURNING id INTO floor3_id;

    -- Создание помещений на первом этаже
    -- Координаты и размеры для визуализации плана
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, config, created_at, updated_at) 
    VALUES (floor1_id, 'Приемная', 'OFFICE', 10, 10, 150, 100, 
            '{"capacity": 4, "area_m2": 25.5}', NOW(), NOW())
    RETURNING id INTO room1_id;

    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, config, created_at, updated_at) 
    VALUES (floor1_id, 'Конференц-зал', 'MEETING', 170, 10, 200, 150,
            '{"capacity": 12, "area_m2": 45.0}', NOW(), NOW())
    RETURNING id INTO room2_id;

    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, config, created_at, updated_at) 
    VALUES (floor1_id, 'Серверная', 'TECHNICAL', 10, 120, 100, 80,
            '{"temperature_controlled": true, "area_m2": 18.0}', NOW(), NOW())
    RETURNING id INTO room3_id;

    -- Помещение на втором этаже
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, config, created_at, updated_at) 
    VALUES (floor2_id, 'Рабочий зал', 'OFFICE', 10, 10, 300, 200,
            '{"capacity": 20, "area_m2": 85.0}', NOW(), NOW())
    RETURNING id INTO room4_id;

    -- Создание устройств для приемной
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, config, state, enabled) VALUES
    (room1_id, system_access_id, 'Замок входной двери', 'door_lock', 
     'building/floor1/reception/door/state', 50, 10, 
     '{"model": "ZKTeco", "protocol": "Wiegand"}',
     '{"locked": true, "lastAccess": null}', true),
    
    (room1_id, system_cctv_id, 'Камера 101', 'ip_camera', 
     'building/floor1/reception/camera1/state', 120, 30,
     '{"model": "Hikvision DS-2CD2143G0-I", "resolution": "4MP", "rtsp": "rtsp://192.168.1.101/stream"}',
     '{"recording": true, "motion": false}', true),
    
    (room1_id, system_heating_id, 'Термостат приемной', 'thermostat', 
     'building/floor1/reception/heating/state', 75, 50,
     '{"model": "Nest Learning", "minTemp": 18, "maxTemp": 26}',
     '{"temperature": 22.5, "targetTemp": 23, "mode": "heat"}', true),
    
    (room1_id, system_lighting_id, 'Освещение основное', 'led_panel', 
     'building/floor1/reception/light1/state', 75, 75,
     '{"zones": 2, "dimming": true}',
     '{"on": true, "brightness": 80}', true);

    -- Устройства для конференц-зала
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, config, state, enabled) VALUES
    (room2_id, system_access_id, 'Замок конференц-зала', 'door_lock', 
     'building/floor1/meeting/door/state', 180, 10,
     '{"model": "ZKTeco", "protocol": "Wiegand"}',
     '{"locked": false, "lastAccess": "2026-05-10T10:30:00Z"}', true),
    
    (room2_id, system_cctv_id, 'Камера 102', 'ip_camera', 
     'building/floor1/meeting/camera1/state', 270, 80,
     '{"model": "Hikvision DS-2CD2143G0-I", "resolution": "4MP", "rtsp": "rtsp://192.168.1.102/stream"}',
     '{"recording": true, "motion": true}', true),
    
    (room2_id, system_hvac_id, 'Кондиционер VRV', 'vrf_unit', 
     'building/floor1/meeting/hvac/state', 320, 30,
     '{"model": "Daikin VRV IV", "capacity": "5kW"}',
     '{"on": true, "mode": "cool", "temperature": 24, "fanSpeed": "auto"}', true),
    
    (room2_id, system_lighting_id, 'Освещение потолочное', 'led_panel', 
     'building/floor1/meeting/light1/state', 240, 60,
     '{"zones": 4, "dimming": true, "colorTemp": true}',
     '{"on": true, "brightness": 100, "colorTemp": 4000}', true),
    
    (room2_id, system_lighting_id, 'Освещение настенное', 'led_strip', 
     'building/floor1/meeting/light2/state', 240, 120,
     '{"length": "5m", "rgb": true}',
     '{"on": false, "brightness": 50, "color": "#ffffff"}', true);

    -- Устройства для серверной
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, config, state, enabled) VALUES
    (room3_id, system_access_id, 'Электронный замок серверной', 'door_lock', 
     'building/floor1/server/door/state', 20, 130,
     '{"model": "ZKTeco ProCapture", "protocol": "Wiegand", "biometric": true}',
     '{"locked": true, "lastAccess": "2026-05-10T08:15:00Z"}', true),
    
    (room3_id, system_cctv_id, 'Камера 103', 'ip_camera', 
     'building/floor1/server/camera1/state', 60, 160,
     '{"model": "Hikvision DS-2CD2143G0-I", "resolution": "4MP", "rtsp": "rtsp://192.168.1.103/stream"}',
     '{"recording": true, "motion": false}', true),
    
    (room3_id, system_hvac_id, 'Прецизионный кондиционер', 'precision_ac', 
     'building/floor1/server/hvac/state', 60, 150,
     '{"model": "Stulz CyberAir", "capacity": "10kW"}',
     '{"on": true, "mode": "cool", "temperature": 20, "humidity": 45}', true);

    -- Устройства для рабочего зала (2 этаж)
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, config, state, enabled) VALUES
    (room4_id, system_cctv_id, 'Камера 201', 'ip_camera', 
     'building/floor2/office/camera1/state', 150, 100,
     '{"model": "Hikvision DS-2CD2143G0-I", "resolution": "4MP", "rtsp": "rtsp://192.168.1.201/stream"}',
     '{"recording": true, "motion": false}', true),
    
    (room4_id, system_lighting_id, 'Освещение зоны A', 'led_panel', 
     'building/floor2/office/light1/state', 80, 80,
     '{"zones": 3, "dimming": true}',
     '{"on": true, "brightness": 75}', true),
    
    (room4_id, system_lighting_id, 'Освещение зоны B', 'led_panel', 
     'building/floor2/office/light2/state', 240, 80,
     '{"zones": 3, "dimming": true}',
     '{"on": true, "brightness": 75}', true),
    
    (room4_id, system_hvac_id, 'Кондиционер VRV зона A', 'vrf_unit', 
     'building/floor2/office/hvac1/state', 80, 150,
     '{"model": "Daikin VRV IV", "capacity": "8kW"}',
     '{"on": true, "mode": "auto", "temperature": 23, "fanSpeed": "low"}', true),
    
    (room4_id, system_hvac_id, 'Кондиционер VRV зона B', 'vrf_unit', 
     'building/floor2/office/hvac2/state', 240, 150,
     '{"model": "Daikin VRV IV", "capacity": "8kW"}',
     '{"on": true, "mode": "auto", "temperature": 23, "fanSpeed": "low"}', true);

END $$;

-- Вывод результата
SELECT 'База данных успешно инициализирована!' as status;

SELECT '═══════════════════════════════════════' as separator;
SELECT 'СТАТИСТИКА ДАННЫХ:' as title;
SELECT '═══════════════════════════════════════' as separator;

SELECT 'Пользователи' as entity, COUNT(*) as count FROM users
UNION ALL
SELECT 'Роли', COUNT(*) FROM roles
UNION ALL
SELECT 'Назначения ролей', COUNT(*) FROM user_roles
UNION ALL
SELECT 'Здания', COUNT(*) FROM buildings
UNION ALL
SELECT 'Этажи', COUNT(*) FROM floors
UNION ALL
SELECT 'Помещения', COUNT(*) FROM rooms
UNION ALL
SELECT 'Типы систем', COUNT(*) FROM system_types
UNION ALL
SELECT 'Устройства', COUNT(*) FROM devices;

SELECT '═══════════════════════════════════════' as separator;
SELECT 'ПОЛЬЗОВАТЕЛИ И РОЛИ:' as title;
SELECT '═══════════════════════════════════════' as separator;

SELECT 
    u.username as "Логин",
    r.name as "Роль",
    u.email as "Email",
    u.full_name as "Полное имя"
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
ORDER BY u.username;
