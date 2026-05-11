-- ДЕМО-ДАННЫЕ: Финальная версия с правильной схемой БД

-- 1. Проверяем и создаем типы систем
INSERT INTO system_types (code, name, description, icon, created_at) VALUES
    ('ACCESS_CONTROL', 'Контроль доступа', 'Системы контроля и управления доступом (СКУД)', 'lock', NOW()),
    ('CAMERA', 'Видеонаблюдение', 'Системы видеонаблюдения и IP-камеры', 'video', NOW()),
    ('LIGHT', 'Освещение', 'Системы управления освещением', 'lightbulb', NOW()),
    ('HVAC', 'Климат-контроль', 'Системы отопления, вентиляции и кондиционирования', 'thermometer', NOW())
ON CONFLICT (code) DO NOTHING;

-- 2. Вставка здания
INSERT INTO buildings (name, address, floors_count, created_at, updated_at)
VALUES 
    ('Бизнес-центр "Технопарк"', 'г. Москва, ул. Инновационная, д. 42', 5, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 3. Получить ID и создать все данные
DO $$
DECLARE
    building_id BIGINT;
    floor1_id BIGINT;
    floor2_id BIGINT;
    floor3_id BIGINT;
    floor4_id BIGINT;
    floor5_id BIGINT;
    room_id BIGINT;
    
    -- ID типов систем
    access_type_id BIGINT;
    camera_type_id BIGINT;
    light_type_id BIGINT;
    hvac_type_id BIGINT;
BEGIN
    -- Получить ID здания
    SELECT id INTO building_id FROM buildings WHERE name = 'Бизнес-центр "Технопарк"' LIMIT 1;
    
    IF building_id IS NULL THEN
        RAISE EXCEPTION 'Building not found!';
    END IF;
    
    -- Получить ID типов систем
    SELECT id INTO access_type_id FROM system_types WHERE code = 'ACCESS_CONTROL';
    SELECT id INTO camera_type_id FROM system_types WHERE code = 'CAMERA';
    SELECT id INTO light_type_id FROM system_types WHERE code = 'LIGHT';
    SELECT id INTO hvac_type_id FROM system_types WHERE code = 'HVAC';
    
    RAISE NOTICE 'Building ID: %', building_id;
    
    -- ==================== ЭТАЖИ ====================
    INSERT INTO floors (building_id, name, floor_number, created_at, updated_at)
    VALUES (building_id, '1-й этаж', 1, NOW(), NOW())
    RETURNING id INTO floor1_id;
    
    INSERT INTO floors (building_id, name, floor_number, created_at, updated_at)
    VALUES (building_id, '2-й этаж', 2, NOW(), NOW())
    RETURNING id INTO floor2_id;
    
    INSERT INTO floors (building_id, name, floor_number, created_at, updated_at)
    VALUES (building_id, '3-й этаж', 3, NOW(), NOW())
    RETURNING id INTO floor3_id;
    
    INSERT INTO floors (building_id, name, floor_number, created_at, updated_at)
    VALUES (building_id, '4-й этаж', 4, NOW(), NOW())
    RETURNING id INTO floor4_id;
    
    INSERT INTO floors (building_id, name, floor_number, created_at, updated_at)
    VALUES (building_id, '5-й этаж', 5, NOW(), NOW())
    RETURNING id INTO floor5_id;
    
    RAISE NOTICE 'Floors created: 5';
    
    -- ==================== ЭТАЖ 1 ====================
    
    -- Холл
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor1_id, 'Холл', 'COMMON', 10, 10, 120, 80, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, camera_type_id, 'Камера холл-вход', 'IP_CAMERA', 'camera/floor1/hall/entrance', 60, 5, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение холл', 'LED_PANEL', 'light/floor1/hall/main', 60, 40, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Термостат холл', 'THERMOSTAT', 'hvac/floor1/hall', 5, 40, true, NOW(), NOW());
    
    -- Ресепшн
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor1_id, 'Ресепшн', 'OFFICE', 140, 10, 80, 50, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, camera_type_id, 'Камера ресепшн', 'IP_CAMERA', 'camera/floor1/reception', 40, 5, true, NOW(), NOW()),
        (room_id, access_type_id, 'СКУД ресепшн', 'CARD_READER', 'access/floor1/reception', 75, 25, true, NOW(), NOW());
    
    -- Переговорная 101
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor1_id, 'Переговорная 101', 'MEETING', 10, 100, 60, 50, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД переговорная 101', 'CARD_READER', 'access/floor1/meeting101', 55, 25, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение 101', 'LED_PANEL', 'light/floor1/meeting101', 30, 25, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер 101', 'SPLIT_AC', 'hvac/floor1/meeting101', 5, 5, true, NOW(), NOW());
    
    -- Переговорная 102
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor1_id, 'Переговорная 102', 'MEETING', 80, 100, 90, 70, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД переговорная 102', 'CARD_READER', 'access/floor1/meeting102', 85, 35, true, NOW(), NOW()),
        (room_id, camera_type_id, 'Камера переговорная 102', 'IP_CAMERA', 'camera/floor1/meeting102', 45, 5, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение 102', 'LED_PANEL', 'light/floor1/meeting102', 45, 35, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер 102', 'CASSETTE_AC', 'hvac/floor1/meeting102', 45, 10, true, NOW(), NOW());
    
    -- ==================== ЭТАЖ 2 ====================
    
    -- Офис 201
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor2_id, 'Офис 201 - Бухгалтерия', 'OFFICE', 10, 10, 150, 90, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД офис 201', 'CARD_READER', 'access/floor2/office201', 145, 45, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение 201', 'LED_PANEL', 'light/floor2/office201', 75, 45, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Термостат 201', 'THERMOSTAT', 'hvac/floor2/office201', 5, 45, true, NOW(), NOW());
    
    -- Офис 202
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor2_id, 'Офис 202 - HR', 'OFFICE', 170, 10, 100, 60, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД офис 202', 'CARD_READER', 'access/floor2/office202', 95, 30, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение 202', 'LED_PANEL', 'light/floor2/office202', 50, 30, true, NOW(), NOW());
    
    -- Кухня
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor2_id, 'Кухня-столовая', 'COMMON', 10, 110, 120, 80, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, camera_type_id, 'Камера кухня', 'IP_CAMERA', 'camera/floor2/kitchen', 60, 5, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение кухня', 'LED_PANEL', 'light/floor2/kitchen', 60, 40, true, NOW(), NOW());
    
    -- ==================== ЭТАЖ 3 ====================
    
    -- Офис 301
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor3_id, 'Офис 301 - Продажи', 'OFFICE', 10, 10, 180, 120, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД офис 301', 'CARD_READER', 'access/floor3/office301', 175, 60, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение 301', 'LED_PANEL', 'light/floor3/office301', 90, 60, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер 301', 'VRF_SYSTEM', 'hvac/floor3/office301', 5, 60, true, NOW(), NOW());
    
    -- Офис 302
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor3_id, 'Офис 302 - Маркетинг', 'OFFICE', 10, 140, 150, 100, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД офис 302', 'CARD_READER', 'access/floor3/office302', 145, 50, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение 302', 'LED_PANEL', 'light/floor3/office302', 75, 50, true, NOW(), NOW());
    
    -- ==================== ЭТАЖ 4 ====================
    
    -- Офис 401
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor4_id, 'Офис 401 - IT отдел', 'OFFICE', 10, 10, 160, 110, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД офис 401', 'BIOMETRIC', 'access/floor4/office401', 155, 55, true, NOW(), NOW()),
        (room_id, camera_type_id, 'Камера офис 401', 'IP_CAMERA', 'camera/floor4/office401', 80, 5, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение 401', 'LED_PANEL', 'light/floor4/office401', 80, 55, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер 401', 'PRECISION_AC', 'hvac/floor4/office401', 5, 55, true, NOW(), NOW());
    
    -- Серверная
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor4_id, 'Серверная', 'SERVER', 180, 10, 100, 80, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД серверная', 'BIOMETRIC', 'access/floor4/server', 95, 40, true, NOW(), NOW()),
        (room_id, camera_type_id, 'Камера серверная-1', 'IP_CAMERA', 'camera/floor4/server/entrance', 50, 5, true, NOW(), NOW()),
        (room_id, camera_type_id, 'Камера серверная-2', 'IP_CAMERA', 'camera/floor4/server/racks', 50, 75, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение серверная', 'LED_EMERGENCY', 'light/floor4/server', 50, 40, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер серверная-1', 'PRECISION_AC', 'hvac/floor4/server/ac1', 10, 10, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер серверная-2', 'PRECISION_AC', 'hvac/floor4/server/ac2', 85, 10, true, NOW(), NOW());
    
    -- ==================== ЭТАЖ 5 ====================
    
    -- Кабинет директора
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor5_id, 'Кабинет директора', 'OFFICE', 10, 10, 120, 80, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД кабинет директора', 'CARD_READER', 'access/floor5/director', 115, 40, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение директор', 'SMART_LIGHT', 'light/floor5/director', 60, 40, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер директор', 'VRV_SYSTEM', 'hvac/floor5/director', 5, 40, true, NOW(), NOW());
    
    -- Конференц-зал
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor5_id, 'Конференц-зал', 'MEETING', 10, 100, 200, 120, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД конференц-зал', 'CARD_READER', 'access/floor5/conference', 195, 60, true, NOW(), NOW()),
        (room_id, camera_type_id, 'Камера конференц-зал', 'PTZ_CAMERA', 'camera/floor5/conference', 100, 5, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение конференц-зал', 'DIMMABLE', 'light/floor5/conference', 100, 60, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер конференц-зал', 'VRF_SYSTEM', 'hvac/floor5/conference', 5, 60, true, NOW(), NOW());
    
    -- Переговорная 501
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor5_id, 'Переговорная 501', 'MEETING', 220, 10, 90, 60, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, system_type_id, name, device_type, mqtt_topic, x, y, enabled, created_at, updated_at)
    VALUES 
        (room_id, access_type_id, 'СКУД переговорная 501', 'CARD_READER', 'access/floor5/meeting501', 85, 30, true, NOW(), NOW()),
        (room_id, light_type_id, 'Освещение 501', 'LED_PANEL', 'light/floor5/meeting501', 45, 30, true, NOW(), NOW()),
        (room_id, hvac_type_id, 'Кондиционер 501', 'SPLIT_AC', 'hvac/floor5/meeting501', 5, 5, true, NOW(), NOW());
    
    RAISE NOTICE '✅ Демо-данные успешно созданы!';
    RAISE NOTICE 'Здание: Бизнес-центр "Технопарк"';
    RAISE NOTICE 'Этажей: 5';
    RAISE NOTICE 'Помещений: 15';
    RAISE NOTICE 'Устройств: 46';
    
END $$;

-- Вывод статистики
SELECT '📊 СТАТИСТИКА БАЗЫ ДАННЫХ:' as info;
SELECT 'Зданий: ' || COUNT(*) as info FROM buildings;
SELECT 'Этажей: ' || COUNT(*) as info FROM floors;
SELECT 'Помещений: ' || COUNT(*) as info FROM rooms;
SELECT 'Устройств: ' || COUNT(*) as info FROM devices;
SELECT '---' as info;
SELECT 'Устройств СКУД: ' || COUNT(*) as info FROM devices d JOIN system_types st ON d.system_type_id = st.id WHERE st.code = 'ACCESS_CONTROL';
SELECT 'Камер: ' || COUNT(*) as info FROM devices d JOIN system_types st ON d.system_type_id = st.id WHERE st.code = 'CAMERA';
SELECT 'Освещения: ' || COUNT(*) as info FROM devices d JOIN system_types st ON d.system_type_id = st.id WHERE st.code = 'LIGHT';
SELECT 'HVAC: ' || COUNT(*) as info FROM devices d JOIN system_types st ON d.system_type_id = st.id WHERE st.code = 'HVAC';
