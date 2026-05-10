-- Инициализация данных для Building Management System
-- Этот файл создает начальных пользователей и демо-данные

-- Очистка существующих данных (осторожно!)
TRUNCATE TABLE devices CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE floors CASCADE;
TRUNCATE TABLE buildings CASCADE;
TRUNCATE TABLE users CASCADE;

-- Создание пользователей
-- Пароли захешированы с помощью BCrypt (все пароли = "password")
INSERT INTO users (username, password, role, email, full_name, enabled) VALUES
('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', 'admin@building.com', 'Администратор', true),
('manager', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'MANAGER', 'manager@building.com', 'Менеджер', true),
('operator', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'OPERATOR', 'operator@building.com', 'Оператор', true),
('viewer', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'VIEWER', 'viewer@building.com', 'Наблюдатель', true);

-- Создание демо-здания
INSERT INTO buildings (name, address, floors_count, created_at, updated_at) VALUES
('Главный офис', 'ул. Примерная, д. 1', 5, NOW(), NOW());

-- Получаем ID созданного здания (для PostgreSQL)
DO $$
DECLARE
    building_id INTEGER;
    floor1_id INTEGER;
    floor2_id INTEGER;
    room1_id INTEGER;
    room2_id INTEGER;
BEGIN
    -- Получаем ID здания
    SELECT id INTO building_id FROM buildings WHERE name = 'Главный офис';

    -- Создание этажей
    INSERT INTO floors (building_id, floor_number, name, created_at, updated_at) 
    VALUES (building_id, 1, 'Первый этаж', NOW(), NOW())
    RETURNING id INTO floor1_id;

    INSERT INTO floors (building_id, floor_number, name, created_at, updated_at) 
    VALUES (building_id, 2, 'Второй этаж', NOW(), NOW())
    RETURNING id INTO floor2_id;

    -- Создание помещений на первом этаже
    INSERT INTO rooms (floor_id, name, room_type, area, created_at, updated_at) 
    VALUES (floor1_id, 'Приемная', 'OFFICE', 25.5, NOW(), NOW())
    RETURNING id INTO room1_id;

    INSERT INTO rooms (floor_id, name, room_type, area, created_at, updated_at) 
    VALUES (floor1_id, 'Конференц-зал', 'MEETING', 45.0, NOW(), NOW())
    RETURNING id INTO room2_id;

    -- Создание устройств
    -- Устройства для приемной
    INSERT INTO devices (room_id, name, device_type, mqtt_topic, status, created_at, updated_at) VALUES
    (room1_id, 'Замок входной двери', 'ACCESS_CONTROL', 'building/floor1/reception/door', 'ONLINE', NOW(), NOW()),
    (room1_id, 'Камера 101', 'CAMERA', 'building/floor1/reception/camera1', 'ONLINE', NOW(), NOW()),
    (room1_id, 'Термостат 1', 'HEATING', 'building/floor1/reception/heating', 'ONLINE', NOW(), NOW()),
    (room1_id, 'Освещение основное', 'LIGHTING', 'building/floor1/reception/light1', 'ONLINE', NOW(), NOW());

    -- Устройства для конференц-зала
    INSERT INTO devices (room_id, name, device_type, mqtt_topic, status, created_at, updated_at) VALUES
    (room2_id, 'Замок конференц-зала', 'ACCESS_CONTROL', 'building/floor1/meeting/door', 'ONLINE', NOW(), NOW()),
    (room2_id, 'Камера 102', 'CAMERA', 'building/floor1/meeting/camera1', 'ONLINE', NOW(), NOW()),
    (room2_id, 'Кондиционер', 'HVAC', 'building/floor1/meeting/hvac', 'ONLINE', NOW(), NOW()),
    (room2_id, 'Освещение потолочное', 'LIGHTING', 'building/floor1/meeting/light1', 'ONLINE', NOW(), NOW()),
    (room2_id, 'Освещение настенное', 'LIGHTING', 'building/floor1/meeting/light2', 'ONLINE', NOW(), NOW());

END $$;

-- Вывод результата
SELECT 'База данных успешно инициализирована!' as status;
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as buildings_count FROM buildings;
SELECT COUNT(*) as floors_count FROM floors;
SELECT COUNT(*) as rooms_count FROM rooms;
SELECT COUNT(*) as devices_count FROM devices;
