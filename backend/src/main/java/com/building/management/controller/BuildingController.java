package com.building.management.controller;

import com.building.management.dto.BuildingDto;
import com.building.management.entity.Building;
import com.building.management.repository.BuildingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/buildings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BuildingController {

    private final BuildingRepository buildingRepository;

    @GetMapping
    public ResponseEntity<List<BuildingDto>> getAllBuildings() {
        List<BuildingDto> buildings = buildingRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(buildings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuildingDto> getBuilding(@PathVariable Long id) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Building not found"));
        return ResponseEntity.ok(convertToDto(building));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BuildingDto> createBuilding(@RequestBody BuildingDto dto) {
        Building building = Building.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .floorsCount(dto.getFloorsCount())
                .config(dto.getConfig())
                .build();

        Building saved = buildingRepository.save(building);
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BuildingDto> updateBuilding(@PathVariable Long id, @RequestBody BuildingDto dto) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Building not found"));

        building.setName(dto.getName());
        building.setAddress(dto.getAddress());
        building.setFloorsCount(dto.getFloorsCount());
        building.setConfig(dto.getConfig());

        Building updated = buildingRepository.save(building);
        return ResponseEntity.ok(convertToDto(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBuilding(@PathVariable Long id) {
        buildingRepository.deleteById(id);
        return ResponseEntity.ok().build();
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
}
