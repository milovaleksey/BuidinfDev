package com.building.management.controller;

import com.building.management.dto.BuildingDto;
import com.building.management.entity.Building;
import com.building.management.repository.BuildingRepository;
import com.building.management.service.BuildingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/buildings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BuildingController {

    private final BuildingService buildingService;
    private final BuildingRepository buildingRepository;

    @GetMapping
    public ResponseEntity<List<BuildingDto>> getAllBuildings() {
        List<BuildingDto> buildings = buildingService.getAllBuildings().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(buildings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuildingDto> getBuilding(@PathVariable Long id) {
        Building building = buildingService.getBuildingById(id)
                .orElseThrow(() -> new RuntimeException("Building not found"));
        return ResponseEntity.ok(convertToDto(building));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BuildingDto> createBuilding(
            @RequestBody BuildingDto dto,
            Authentication authentication,
            HttpServletRequest request) {
        
        Building building = Building.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .floorsCount(dto.getFloorsCount())
                .config(dto.getConfig())
                .build();

        Building saved = buildingService.createBuilding(building, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BuildingDto> updateBuilding(
            @PathVariable Long id, 
            @RequestBody BuildingDto dto,
            Authentication authentication,
            HttpServletRequest request) {
        
        Building building = Building.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .floorsCount(dto.getFloorsCount())
                .config(dto.getConfig())
                .build();

        Building updated = buildingService.updateBuilding(id, building, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBuilding(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {
        
        buildingService.deleteBuilding(id, authentication.getName(), getClientIP(request));
        return ResponseEntity.ok().build();
    }

    /**
     * Экспорт здания в JSON
     */
    @GetMapping("/{id}/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Building> exportBuilding(@PathVariable Long id) {
        Building building = buildingService.exportBuilding(id);
        return ResponseEntity.ok(building);
    }

    /**
     * Импорт здания из JSON
     */
    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BuildingDto> importBuilding(
            @RequestBody Building building,
            Authentication authentication,
            HttpServletRequest request) {
        
        Building imported = buildingService.importBuilding(building, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(imported));
    }

    private BuildingDto convertToDto(Building building) {
        return BuildingDto.builder()
                .id(building.getId())
                .name(building.getName())
                .address(building.getAddress())
                .floorsCount(building.getFloorsCount())
                .config(building.getConfig())
                .createdAt(building.getCreatedAt())
                .updatedAt(building.getUpdatedAt())
                .build();
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}