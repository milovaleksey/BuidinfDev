package com.building.management.service;

import com.building.management.entity.Building;
import com.building.management.entity.Floor;
import com.building.management.repository.BuildingRepository;
import com.building.management.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FloorService {

    private final FloorRepository floorRepository;
    private final BuildingRepository buildingRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<Floor> getFloorsByBuilding(Long buildingId) {
        return floorRepository.findByBuildingId(buildingId);
    }

    @Transactional(readOnly = true)
    public Optional<Floor> getFloorById(Long id) {
        return floorRepository.findById(id);
    }

    @Transactional
    public Floor createFloor(Long buildingId, Floor floor, String username, String ipAddress) {
        Building building = buildingRepository.findById(buildingId)
            .orElseThrow(() -> new RuntimeException("Building not found: " + buildingId));
        
        floor.setBuilding(building);
        Floor saved = floorRepository.save(floor);
        
        auditLogService.log(username, "CREATE", "Floor", saved.getId(), null, ipAddress);
        
        log.info("Floor created: {} in building {} by {}", saved.getName(), building.getName(), username);
        return saved;
    }

    @Transactional
    public Floor updateFloor(Long id, Floor floor, String username, String ipAddress) {
        Floor existing = floorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Floor not found: " + id));
        
        existing.setFloorNumber(floor.getFloorNumber());
        existing.setName(floor.getName());
        existing.setPlanConfig(floor.getPlanConfig());
        
        Floor updated = floorRepository.save(existing);
        
        auditLogService.log(username, "UPDATE", "Floor", id, null, ipAddress);
        
        log.info("Floor updated: {} by {}", updated.getName(), username);
        return updated;
    }

    @Transactional
    public void deleteFloor(Long id, String username, String ipAddress) {
        Floor floor = floorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Floor not found: " + id));
        
        floorRepository.delete(floor);
        
        auditLogService.log(username, "DELETE", "Floor", id, null, ipAddress);
        
        log.info("Floor deleted: {} by {}", floor.getName(), username);
    }
}
