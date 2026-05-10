package com.building.management.service;

import com.building.management.entity.Building;
import com.building.management.entity.Floor;
import com.building.management.repository.BuildingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class BuildingService {

    private final BuildingRepository buildingRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<Building> getAllBuildings() {
        return buildingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Building> getBuildingById(Long id) {
        return buildingRepository.findById(id);
    }

    @Transactional
    public Building createBuilding(Building building, String username, String ipAddress) {
        Building saved = buildingRepository.save(building);
        
        auditLogService.log(username, "CREATE", "Building", saved.getId(), 
            null, ipAddress);
        
        log.info("Building created: {} by {}", saved.getName(), username);
        return saved;
    }

    @Transactional
    public Building updateBuilding(Long id, Building building, String username, String ipAddress) {
        Building existing = buildingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Building not found: " + id));
        
        existing.setName(building.getName());
        existing.setAddress(building.getAddress());
        existing.setFloorsCount(building.getFloorsCount());
        existing.setConfig(building.getConfig());
        
        Building updated = buildingRepository.save(existing);
        
        auditLogService.log(username, "UPDATE", "Building", id, null, ipAddress);
        
        log.info("Building updated: {} by {}", updated.getName(), username);
        return updated;
    }

    @Transactional
    public void deleteBuilding(Long id, String username, String ipAddress) {
        Building building = buildingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Building not found: " + id));
        
        buildingRepository.delete(building);
        
        auditLogService.log(username, "DELETE", "Building", id, null, ipAddress);
        
        log.info("Building deleted: {} by {}", building.getName(), username);
    }

    /**
     * Экспорт конфигурации здания в JSON
     */
    @Transactional(readOnly = true)
    public Building exportBuilding(Long id) {
        return buildingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Building not found: " + id));
    }

    /**
     * Импорт конфигурации здания из JSON
     */
    @Transactional
    public Building importBuilding(Building building, String username, String ipAddress) {
        // Создаем новое здание на основе импортированных данных
        building.setId(null); // Ensure new ID is generated
        
        // Рекурсивно обнуляем ID для всех вложенных сущностей
        if (building.getFloors() != null) {
            building.getFloors().forEach(floor -> {
                floor.setId(null);
                floor.setBuilding(building);
                if (floor.getRooms() != null) {
                    floor.getRooms().forEach(room -> {
                        room.setId(null);
                        room.setFloor(floor);
                        if (room.getDevices() != null) {
                            room.getDevices().forEach(device -> {
                                device.setId(null);
                                device.setRoom(room);
                            });
                        }
                    });
                }
            });
        }
        
        Building saved = buildingRepository.save(building);
        
        auditLogService.log(username, "IMPORT", "Building", saved.getId(), null, ipAddress);
        
        log.info("Building imported: {} by {}", saved.getName(), username);
        return saved;
    }
}
