package com.building.management.controller;

import com.building.management.dto.FloorDto;
import com.building.management.entity.Floor;
import com.building.management.service.FloorService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/floors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FloorController {

    private final FloorService floorService;

    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<FloorDto>> getFloorsByBuilding(@PathVariable Long buildingId) {
        List<FloorDto> floors = floorService.getFloorsByBuilding(buildingId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(floors);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FloorDto> getFloor(@PathVariable Long id) {
        Floor floor = floorService.getFloorById(id)
                .orElseThrow(() -> new RuntimeException("Floor not found"));
        return ResponseEntity.ok(convertToDto(floor));
    }

    @PostMapping("/building/{buildingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<FloorDto> createFloor(
            @PathVariable Long buildingId,
            @RequestBody FloorDto dto,
            Authentication authentication,
            HttpServletRequest request) {
        
        Floor floor = Floor.builder()
                .floorNumber(dto.getFloorNumber())
                .name(dto.getName())
                .planConfig(dto.getPlanConfig())
                .build();

        Floor saved = floorService.createFloor(buildingId, floor, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<FloorDto> updateFloor(
            @PathVariable Long id,
            @RequestBody FloorDto dto,
            Authentication authentication,
            HttpServletRequest request) {
        
        Floor floor = Floor.builder()
                .floorNumber(dto.getFloorNumber())
                .name(dto.getName())
                .planConfig(dto.getPlanConfig())
                .build();

        Floor updated = floorService.updateFloor(id, floor, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteFloor(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {
        
        floorService.deleteFloor(id, authentication.getName(), getClientIP(request));
        return ResponseEntity.ok().build();
    }

    private FloorDto convertToDto(Floor floor) {
        return FloorDto.builder()
                .id(floor.getId())
                .buildingId(floor.getBuilding() != null ? floor.getBuilding().getId() : null)
                .floorNumber(floor.getFloorNumber())
                .name(floor.getName())
                .planConfig(floor.getPlanConfig())
                .createdAt(floor.getCreatedAt())
                .updatedAt(floor.getUpdatedAt())
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