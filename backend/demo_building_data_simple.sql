-- ДЕМО-ДАННЫЕ: Упрощенная версия для существующей схемы БД

-- Вставка здания
INSERT INTO buildings (name, address, floors_count, created_at, updated_at)
VALUES 
    ('Бизнес-центр "Технопарк"', 'г. Москва, ул. Инновационная, д. 42', 5, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Получить ID здания и создать все данные
DO $$
DECLARE
    building_id BIGINT;
    floor1_id BIGINT;
    floor2_id BIGINT;
    floor3_id BIGINT;
    floor4_id BIGINT;
    floor5_id BIGINT;
    room_id BIGINT;
    x_pos DOUBLE PRECISION := 10.0;
    y_pos DOUBLE PRECISION := 10.0;
BEGIN
    -- Получить ID здания
    SELECT id INTO building_id FROM buildings WHERE name = 'Бизнес-центр "Технопарк"' LIMIT 1;
    
    IF building_id IS NULL THEN
        RAISE EXCEPTION 'Building not found!';
    END IF;
    
    RAISE NOTICE 'Building ID: %', building_id;
    
    -- ЭТАЖИ
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
    
    RAISE NOTICE 'Floors created';
    
    -- ЭТАЖ 1: Холл
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor1_id, 'Холл', 'COMMON', 10, 10, 120, 80, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'Камера холл-вход', 'CAMERA', 'IP-камера видеонаблюдения у входа', 'camera/floor1/hall/entrance/state', NULL, 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение холл', 'LIGHT', 'Основное освещение холла', 'light/floor1/hall/main/state', 'light/floor1/hall/main/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Термостат холл', 'HVAC', 'Климат-контроль холла', 'hvac/floor1/hall/state', 'hvac/floor1/hall/set', 'ONLINE', NOW(), NOW());
    
    -- Ресепшн
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor1_id, 'Ресепшн', 'OFFICE', 140, 10, 80, 50, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'Камера ресепшн', 'CAMERA', 'IP-камера над стойкой', 'camera/floor1/reception/state', NULL, 'ONLINE', NOW(), NOW()),
        (room_id, 'СКУД ресепшн', 'ACCESS_CONTROL', 'Считыватель карт доступа', 'access/floor1/reception/state', 'access/floor1/reception/set', 'ONLINE', NOW(), NOW());
    
    -- Переговорная 101
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor1_id, 'Переговорная 101', 'MEETING', 10, 100, 60, 50, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД переговорная 101', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor1/meeting101/state', 'access/floor1/meeting101/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение 101', 'LIGHT', 'Светодиодное освещение', 'light/floor1/meeting101/state', 'light/floor1/meeting101/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондиционер 101', 'HVAC', 'Сплит-система', 'hvac/floor1/meeting101/state', 'hvac/floor1/meeting101/set', 'ONLINE', NOW(), NOW());
    
    -- Переговорная 102
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor1_id, 'Переговорная 102', 'MEETING', 80, 100, 90, 70, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД переговорная 102', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor1/meeting102/state', 'access/floor1/meeting102/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Камера переговорная 102', 'CAMERA', 'Камера видеонаблюдения', 'camera/floor1/meeting102/state', NULL, 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение 102', 'LIGHT', 'Светодиодное освещение', 'light/floor1/meeting102/state', 'light/floor1/meeting102/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондиционер 102', 'HVAC', 'Кассетная сплит-система', 'hvac/floor1/meeting102/state', 'hvac/floor1/meeting102/set', 'ONLINE', NOW(), NOW());
    
    -- ЭТАЖ 2: Офис 201
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor2_id, 'Офис 201 - Бухгалтерия', 'OFFICE', 10, 10, 150, 90, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД офис 201', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor2/office201/state', 'access/floor2/office201/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение 201', 'LIGHT', 'Светодиодные панели', 'light/floor2/office201/state', 'light/floor2/office201/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Термостат 201', 'HVAC', 'Климат-контроль офиса', 'hvac/floor2/office201/state', 'hvac/floor2/office201/set', 'ONLINE', NOW(), NOW());
    
    -- Офис 202
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor2_id, 'Офис 202 - HR', 'OFFICE', 170, 10, 100, 60, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД офис 202', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor2/office202/state', 'access/floor2/office202/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение 202', 'LIGHT', 'Светодиодные панели', 'light/floor2/office202/state', 'light/floor2/office202/set', 'ONLINE', NOW(), NOW());
    
    -- Кухня
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor2_id, 'Кухня-столовая', 'COMMON', 10, 110, 120, 80, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'Камера кухня', 'CAMERA', 'Камера видеонаблюдения', 'camera/floor2/kitchen/state', NULL, 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение кухня', 'LIGHT', 'Основное освещение', 'light/floor2/kitchen/state', 'light/floor2/kitchen/set', 'ONLINE', NOW(), NOW());
    
    -- ЭТАЖ 3: Офис 301
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor3_id, 'Офис 301 - Продажи', 'OFFICE', 10, 10, 180, 120, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД офис 301', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor3/office301/state', 'access/floor3/office301/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение 301', 'LIGHT', 'Светодиодные панели', 'light/floor3/office301/state', 'light/floor3/office301/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондиционер 301', 'HVAC', 'Мультизональная система', 'hvac/floor3/office301/state', 'hvac/floor3/office301/set', 'ONLINE', NOW(), NOW());
    
    -- Офис 302
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor3_id, 'Офис 302 - Маркетинг', 'OFFICE', 10, 140, 150, 100, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД офис 302', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor3/office302/state', 'access/floor3/office302/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение 302', 'LIGHT', 'Светодиодные панели', 'light/floor3/office302/state', 'light/floor3/office302/set', 'ONLINE', NOW(), NOW());
    
    -- ЭТАЖ 4: Офис 401
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor4_id, 'Офис 401 - IT отдел', 'OFFICE', 10, 10, 160, 110, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД офис 401', 'ACCESS_CONTROL', 'Контроль доступа повышенной безопасности', 'access/floor4/office401/state', 'access/floor4/office401/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Камера офис 401', 'CAMERA', 'Камера видеонаблюдения', 'camera/floor4/office401/state', NULL, 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение 401', 'LIGHT', 'Светодиодные панели', 'light/floor4/office401/state', 'light/floor4/office401/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондиционер 401', 'HVAC', 'Прецизионный кондиционер', 'hvac/floor4/office401/state', 'hvac/floor4/office401/set', 'ONLINE', NOW(), NOW());
    
    -- Серверная
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor4_id, 'Серверная', 'SERVER', 180, 10, 100, 80, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД серверная', 'ACCESS_CONTROL', 'Биометрический контроль доступа', 'access/floor4/server/state', 'access/floor4/server/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Камера серверная-1', 'CAMERA', 'Камера видеонаблюдения (вход)', 'camera/floor4/server/entrance/state', NULL, 'ONLINE', NOW(), NOW()),
        (room_id, 'Камера серверная-2', 'CAMERA', 'Камера видеонаблюдения (стойки)', 'camera/floor4/server/racks/state', NULL, 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение серверная', 'LIGHT', 'Аварийное освещение', 'light/floor4/server/state', 'light/floor4/server/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондиционер серверная-1', 'HVAC', 'Прецизионный кондиционер #1', 'hvac/floor4/server/ac1/state', 'hvac/floor4/server/ac1/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондиционер серверная-2', 'HVAC', 'Прецизионный кондиционер #2', 'hvac/floor4/server/ac2/state', 'hvac/floor4/server/ac2/set', 'ONLINE', NOW(), NOW());
    
    -- ЭТАЖ 5: Кабинет директора
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor5_id, 'Кабинет директора', 'OFFICE', 10, 10, 120, 80, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД кабинет директора', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor5/director/state', 'access/floor5/director/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение директор', 'LIGHT', 'Управляемое освещение', 'light/floor5/director/state', 'light/floor5/director/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондиционер директор', 'HVAC', 'VRV система', 'hvac/floor5/director/state', 'hvac/floor5/director/set', 'ONLINE', NOW(), NOW());
    
    -- Конференц-зал
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor5_id, 'Конференц-зал', 'MEETING', 10, 100, 200, 120, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД конференц-зал', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor5/conference/state', 'access/floor5/conference/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Камера конференц-зал', 'CAMERA', 'PTZ камера для видеоконференций', 'camera/floor5/conference/state', NULL, 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещене конференц-зал', 'LIGHT', 'Диммируемое освещение', 'light/floor5/conference/state', 'light/floor5/conference/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондиционер конференц-зал', 'HVAC', 'Мультизональная система', 'hvac/floor5/conference/state', 'hvac/floor5/conference/set', 'ONLINE', NOW(), NOW());
    
    -- Переговорная 501
    INSERT INTO rooms (floor_id, name, room_type, x, y, width, height, created_at, updated_at)
    VALUES (floor5_id, 'Переговорная 501', 'MEETING', 220, 10, 90, 60, NOW(), NOW())
    RETURNING id INTO room_id;
    
    INSERT INTO devices (room_id, name, type, description, mqtt_topic_state, mqtt_topic_set, status, created_at, updated_at)
    VALUES 
        (room_id, 'СКУД переговорная 501', 'ACCESS_CONTROL', 'Контроль доступа', 'access/floor5/meeting501/state', 'access/floor5/meeting501/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Освещение 501', 'LIGHT', 'Светодиодное освещение', 'light/floor5/meeting501/state', 'light/floor5/meeting501/set', 'ONLINE', NOW(), NOW()),
        (room_id, 'Кондицонер 501', 'HVAC', 'Сплит-система премиум-класса', 'hvac/floor5/meeting501/state', 'hvac/floor5/meeting501/set', 'ONLINE', NOW(), NOW());
    
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
SELECT 'Устройств СКУД: ' || COUNT(*) as info FROM devices WHERE type = 'ACCESS_CONTROL';
SELECT 'Камер: ' || COUNT(*) as info FROM devices WHERE type = 'CAMERA';
SELECT 'Освещения: ' || COUNT(*) as info FROM devices WHERE type = 'LIGHT';
SELECT 'HVAC: ' || COUNT(*) as info FROM devices WHERE type = 'HVAC';
