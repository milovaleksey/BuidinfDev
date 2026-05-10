-- СИСТЕМА ГРАНУЛЯРНЫХ ПРАВ ДОСТУПА
-- Позволяет настраивать права по помещениям и системам

-- Типы систем
CREATE TABLE IF NOT EXISTS system_types (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Заполнение типов систем
INSERT INTO system_types (code, name, description, icon) VALUES
    ('access_control', 'Система контроля доступа (СКУД)', 'Управление доступом в помещения', 'lock'),
    ('video_surveillance', 'Видеонаблюдение', 'Камеры и мониторинг', 'video'),
    ('heating', 'Отопление', 'Система отопления и терморегуляции', 'thermometer'),
    ('lighting', 'Освещение', 'Управление освещением', 'lightbulb'),
    ('air_conditioning', 'Кондиционирование', 'Система вентиляции и кондиционирования', 'wind')
ON CONFLICT (code) DO NOTHING;

-- Уровни доступа (действия)
CREATE TYPE permission_action AS ENUM ('READ', 'WRITE', 'CONTROL', 'ADMIN');

-- Таблица прав доступа
CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    
    -- Пользователь или роль
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Область действия (scope)
    building_id BIGINT REFERENCES buildings(id) ON DELETE CASCADE,
    floor_id BIGINT REFERENCES floors(id) ON DELETE CASCADE,
    room_id BIGINT REFERENCES rooms(id) ON DELETE CASCADE,
    device_id BIGINT REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Система
    system_type_id BIGINT REFERENCES system_types(id) ON DELETE CASCADE,
    
    -- Действие
    action permission_action NOT NULL,
    
    -- Метаданные
    granted_by BIGINT REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    -- Ограничения: либо user_id, либо role_id (не оба одновременно)
    CONSTRAINT check_user_or_role CHECK (
        (user_id IS NOT NULL AND role_id IS NULL) OR 
        (user_id IS NULL AND role_id IS NOT NULL)
    ),
    
    -- Уникальность комбинации
    CONSTRAINT unique_permission UNIQUE NULLS NOT DISTINCT (
        user_id, role_id, building_id, floor_id, room_id, 
        device_id, system_type_id, action
    )
);

-- Индексы для быстрого поиска прав
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role_id) WHERE role_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_building ON permissions(building_id) WHERE building_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_floor ON permissions(floor_id) WHERE floor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_room ON permissions(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_device ON permissions(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permissions_system ON permissions(system_type_id) WHERE system_type_id IS NOT NULL;

-- Представление для удобного просмотра прав
CREATE OR REPLACE VIEW v_permissions_detailed AS
SELECT 
    p.id,
    p.action,
    
    -- Субъект (кому выдано право)
    COALESCE(u.username, 'role:' || r.name) as subject,
    CASE 
        WHEN p.user_id IS NOT NULL THEN 'USER'
        ELSE 'ROLE'
    END as subject_type,
    
    -- Область действия
    b.name as building_name,
    f.name as floor_name,
    rm.name as room_name,
    d.name as device_name,
    st.name as system_name,
    
    -- Метаданные
    ub.username as granted_by_user,
    p.granted_at,
    p.expires_at,
    
    -- Статус
    CASE 
        WHEN p.expires_at IS NULL THEN true
        WHEN p.expires_at > NOW() THEN true
        ELSE false
    END as is_active
    
FROM permissions p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN roles r ON p.role_id = r.id
LEFT JOIN buildings b ON p.building_id = b.id
LEFT JOIN floors f ON p.floor_id = f.id
LEFT JOIN rooms rm ON p.room_id = rm.id
LEFT JOIN devices d ON p.device_id = d.id
LEFT JOIN system_types st ON p.system_type_id = st.id
LEFT JOIN users ub ON p.granted_by = ub.id;

-- Функция проверки прав доступа
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id BIGINT,
    p_action permission_action,
    p_building_id BIGINT DEFAULT NULL,
    p_floor_id BIGINT DEFAULT NULL,
    p_room_id BIGINT DEFAULT NULL,
    p_device_id BIGINT DEFAULT NULL,
    p_system_type_code VARCHAR DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := false;
    v_system_type_id BIGINT;
BEGIN
    -- Получить ID типа системы если указан код
    IF p_system_type_code IS NOT NULL THEN
        SELECT id INTO v_system_type_id FROM system_types WHERE code = p_system_type_code;
    END IF;
    
    -- Проверить права пользователя напрямую или через роли
    SELECT EXISTS (
        SELECT 1 FROM permissions p
        WHERE 
            -- Проверка субъекта (пользователь или его роли)
            (
                p.user_id = p_user_id OR
                p.role_id IN (
                    SELECT role_id FROM user_roles WHERE user_id = p_user_id
                )
            )
            -- Проверка действия
            AND (p.action = p_action OR p.action = 'ADMIN')
            -- Проверка области (NULL = доступ ко всему)
            AND (p.building_id IS NULL OR p.building_id = p_building_id)
            AND (p.floor_id IS NULL OR p.floor_id = p_floor_id)
            AND (p.room_id IS NULL OR p.room_id = p_room_id)
            AND (p.device_id IS NULL OR p.device_id = p_device_id)
            AND (p.system_type_id IS NULL OR p.system_type_id = v_system_type_id)
            -- Проверка срока действия
            AND (p.expires_at IS NULL OR p.expires_at > NOW())
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Демо-данные: права для ролей по умолчанию
DO $$
DECLARE
    admin_role_id BIGINT;
    manager_role_id BIGINT;
    operator_role_id BIGINT;
    viewer_role_id BIGINT;
BEGIN
    -- Получить ID ролей
    SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'MANAGER';
    SELECT id INTO operator_role_id FROM roles WHERE name = 'OPERATOR';
    SELECT id INTO viewer_role_id FROM roles WHERE name = 'VIEWER';
    
    -- ADMIN - полный доступ ко всему
    INSERT INTO permissions (role_id, action) VALUES
        (admin_role_id, 'ADMIN')
    ON CONFLICT DO NOTHING;
    
    -- MANAGER - чтение и запись всех систем
    INSERT INTO permissions (role_id, system_type_id, action)
    SELECT manager_role_id, id, 'WRITE'
    FROM system_types
    ON CONFLICT DO NOTHING;
    
    -- OPERATOR - управление устройствами (без видеонаблюдения и СКУД)
    INSERT INTO permissions (role_id, system_type_id, action)
    SELECT operator_role_id, id, 'CONTROL'
    FROM system_types
    WHERE code IN ('heating', 'lighting', 'air_conditioning')
    ON CONFLICT DO NOTHING;
    
    -- VIEWER - только чтение
    INSERT INTO permissions (role_id, action) VALUES
        (viewer_role_id, 'READ')
    ON CONFLICT DO NOTHING;
    
END $$;

\echo ''
\echo '✅ Схема прав доступа создана!'
\echo ''
\echo 'Доступные системы:'
SELECT code, name FROM system_types ORDER BY code;

\echo ''
\echo 'Права по умолчанию для ролей:'
SELECT * FROM v_permissions_detailed ORDER BY subject, action;
