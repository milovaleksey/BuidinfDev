package com.building.management.config;

import com.building.management.entity.*;
import com.building.management.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Инициализация демо-данных при первом запуске
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final DeviceRepository deviceRepository;
    private final SystemTypeRepository systemTypeRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("🚀 Проверка необходимости инициализации демо-данных...");

        // Проверяем, есть ли уже данные
        if (buildingRepository.count() > 0) {
            log.info("✅ Данные уже инициализированы. Пропуск.");
            return;
        }

        log.info("📦 Начало инициализации демо-данных...");

        try {
            initializeUsers();
            initializeBuildings();
            log.info("✅ Демо-данные успешно инициализированы!");
        } catch (Exception e) {
            log.error("❌ Ошибка инициализации демо-данных: {}", e.getMessage(), e);
        }
    }

    private void initializeUsers() {
        log.info("👥 Создание пользователей...");

        // Роли уже созданы в schema.sql
        Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
        Role managerRole = roleRepository.findByName("MANAGER").orElseThrow();
        Role operatorRole = roleRepository.findByName("OPERATOR").orElseThrow();
        Role viewerRole = roleRepository.findByName("VIEWER").orElseThrow();

        // Проверяем, есть ли уже пользователи
        if (userRepository.count() == 0) {
            // Создаем демо-пользователей
            createUser("admin", "admin@building.com", "password", "Администратор Системы", adminRole);
            createUser("manager", "manager@building.com", "password", "Менеджер Здания", managerRole);
            createUser("operator", "operator@building.com", "password", "Оператор Систем", operatorRole);
            createUser("viewer", "viewer@building.com", "password", "Наблюдатель", viewerRole);

            log.info("✅ Создано 4 демо-пользователя");
        }
    }

    private void createUser(String username, String email, String password, String fullName, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setEnabled(true);
        user.setRoles(Set.of(role));
        userRepository.save(user);
    }

    private void initializeBuildings() throws Exception {
        log.info("🏢 Создание зданий...");

        // Получаем admin пользователя
        User admin = userRepository.findByUsername("admin").orElseThrow();

        // Типы систем уже созданы в schema.sql
        SystemType accessControl = systemTypeRepository.findByCode("access_control").orElseThrow();
        SystemType cctv = systemTypeRepository.findByCode("cctv").orElseThrow();
        SystemType heating = systemTypeRepository.findByCode("heating").orElseThrow();
        SystemType lighting = systemTypeRepository.findByCode("lighting").orElseThrow();
        SystemType hvac = systemTypeRepository.findByCode("hvac").orElseThrow();

        // Создаем здание "Технопарк"
        Building building = new Building();
        building.setName("Главный офис");
        building.setAddress("ул. Примерная, д. 1, Москва");
        building.setFloorsCount(5);
        building.setConfig(objectMapper.createObjectNode()
            .put("yearBuilt", 2020)
            .put("totalArea", 5000));
        building.setCreatedBy(admin);
        building = buildingRepository.save(building);

        log.info("✅ Здание '{}' создано (ID: {})", building.getName(), building.getId());

        // Создаем 5 этажей
        for (int i = 1; i <= 5; i++) {
            Floor floor = createFloor(building, i);
            
            // Создаем помещения на каждом этаже
            createRoomsForFloor(floor, i, accessControl, cctv, heating, lighting, hvac);
            
            log.info("✅ Этаж {} создан с помещениями", i);
        }

        // Статистика
        long totalFloors = floorRepository.count();
        long totalRooms = roomRepository.count();
        long totalDevices = deviceRepository.count();

        log.info("📊 Итого создано:");
        log.info("   - Зданий: {}", buildingRepository.count());
        log.info("   - Этажей: {}", totalFloors);
        log.info("   - Помещений: {}", totalRooms);
        log.info("   - Устройств: {}", totalDevices);
    }

    private Floor createFloor(Building building, int floorNumber) throws Exception {
        Floor floor = new Floor();
        floor.setBuilding(building);
        floor.setFloorNumber(floorNumber);
        floor.setName("Этаж " + floorNumber);
        
        // Конфигурация плана этажа
        floor.setPlanConfig(objectMapper.createObjectNode()
            .put("width", 800)
            .put("height", 600));
        
        return floorRepository.save(floor);
    }

    private void createRoomsForFloor(Floor floor, int floorNumber, 
                                      SystemType accessControl, SystemType cctv, 
                                      SystemType heating, SystemType lighting, SystemType hvac) throws Exception {
        
        int roomsPerFloor = 3;
        
        for (int i = 1; i <= roomsPerFloor; i++) {
            Room room = new Room();
            room.setFloor(floor);
            room.setName(String.format("%d%02d", floorNumber, i));
            
            // Определяем тип помещения
            String roomType = switch (i) {
                case 1 -> "office";
                case 2 -> "conference";
                case 3 -> "technical";
                default -> "office";
            };
            room.setRoomType(roomType);
            
            // Позиция и размеры
            double xBase = 50 + (i - 1) * 250;
            room.setX(xBase);
            room.setY(100.0);
            room.setWidth(200.0);
            room.setHeight(150.0);
            
            // Конфигурация
            room.setConfig(objectMapper.createObjectNode()
                .put("area", 30)
                .put("capacity", roomType.equals("conference") ? 20 : 5));
            
            room = roomRepository.save(room);
            
            // Создаем устройства для помещения
            createDevicesForRoom(room, accessControl, cctv, heating, lighting, hvac);
        }
    }

    private void createDevicesForRoom(Room room, SystemType accessControl, SystemType cctv, 
                                       SystemType heating, SystemType lighting, SystemType hvac) throws Exception {
        int deviceCount = 0;
        
        // Контроллер доступа (у входа)
        if (!room.getRoomType().equals("technical")) {
            Device accessDevice = createDevice(
                room, accessControl, "Контроллер доступа", "controller",
                "access/" + room.getFloor().getBuilding().getId() + "/floor" + 
                    room.getFloor().getFloorNumber() + "/room" + room.getName(),
                room.getX() + 10, room.getY() + 75
            );
            deviceRepository.save(accessDevice);
            deviceCount++;
        }
        
        // Камера видеонаблюдения (в углу)
        Device cctvDevice = createDevice(
            room, cctv, "Камера", "camera",
            "cctv/" + room.getFloor().getBuilding().getId() + "/floor" + 
                room.getFloor().getFloorNumber() + "/room" + room.getName(),
            room.getX() + room.getWidth() - 20, room.getY() + 20
        );
        deviceRepository.save(cctvDevice);
        deviceCount++;
        
        // Датчик температуры
        Device tempSensor = createDevice(
            room, heating, "Датчик температуры", "sensor",
            "heating/" + room.getFloor().getBuilding().getId() + "/floor" + 
                room.getFloor().getFloorNumber() + "/room" + room.getName() + "/temp",
            room.getX() + room.getWidth() / 2, room.getY() + 20
        );
        deviceRepository.save(tempSensor);
        deviceCount++;
        
        // Контроллер освещения
        Device lightController = createDevice(
            room, lighting, "Контроллер освещения", "controller",
            "lighting/" + room.getFloor().getBuilding().getId() + "/floor" + 
                room.getFloor().getFloorNumber() + "/room" + room.getName(),
            room.getX() + 30, room.getY() + 30
        );
        deviceRepository.save(lightController);
        deviceCount++;
        
        // Кондиционер (только для офисов и переговорных)
        if (room.getRoomType().equals("office") || room.getRoomType().equals("conference")) {
            Device hvacDevice = createDevice(
                room, hvac, "Кондиционер", "actuator",
                "hvac/" + room.getFloor().getBuilding().getId() + "/floor" + 
                    room.getFloor().getFloorNumber() + "/room" + room.getName(),
                room.getX() + room.getWidth() - 40, room.getY() + room.getHeight() - 20
            );
            deviceRepository.save(hvacDevice);
            deviceCount++;
        }
        
        log.debug("   └─ Создано {} устройств для помещения {}", deviceCount, room.getName());
    }

    private Device createDevice(Room room, SystemType systemType, String name, String deviceType,
                                 String mqttTopic, double x, double y) throws Exception {
        Device device = new Device();
        device.setRoom(room);
        device.setSystemType(systemType);
        device.setName(name);
        device.setDeviceType(deviceType);
        device.setMqttTopic(mqttTopic);
        device.setX(x);
        device.setY(y);
        device.setEnabled(true);
        
        // Начальное состояние
        device.setState(objectMapper.createObjectNode()
            .put("status", "online")
            .put("lastUpdate", System.currentTimeMillis()));
        
        // Конфигурация
        device.setConfig(objectMapper.createObjectNode()
            .put("model", "Generic-" + deviceType)
            .put("firmware", "1.0.0"));
        
        return device;
    }
}
