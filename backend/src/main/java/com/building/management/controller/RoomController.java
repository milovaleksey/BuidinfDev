package com.building.management.controller;

import com.building.management.dto.RoomDto;
import com.building.management.entity.Room;
import com.building.management.service.RoomService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/floor/{floorId}")
    public ResponseEntity<List<RoomDto>> getRoomsByFloor(@PathVariable Long floorId) {
        List<RoomDto> rooms = roomService.getRoomsByFloor(floorId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDto> getRoom(@PathVariable Long id) {
        Room room = roomService.getRoomById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        return ResponseEntity.ok(convertToDto(room));
    }

    @PostMapping("/floor/{floorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<RoomDto> createRoom(
            @PathVariable Long floorId,
            @RequestBody RoomDto dto,
            Authentication authentication,
            HttpServletRequest request) {
        
        Room room = Room.builder()
                .name(dto.getName())
                .roomType(dto.getRoomType())
                .x(dto.getX())
                .y(dto.getY())
                .width(dto.getWidth())
                .height(dto.getHeight())
                .config(dto.getConfig())
                .build();

        Room saved = roomService.createRoom(floorId, room, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<RoomDto> updateRoom(
            @PathVariable Long id,
            @RequestBody RoomDto dto,
            Authentication authentication,
            HttpServletRequest request) {
        
        Room room = Room.builder()
                .name(dto.getName())
                .roomType(dto.getRoomType())
                .x(dto.getX())
                .y(dto.getY())
                .width(dto.getWidth())
                .height(dto.getHeight())
                .config(dto.getConfig())
                .build();

        Room updated = roomService.updateRoom(id, room, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteRoom(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {
        
        roomService.deleteRoom(id, authentication.getName(), getClientIP(request));
        return ResponseEntity.ok().build();
    }

    private RoomDto convertToDto(Room room) {
        return RoomDto.builder()
                .id(room.getId())
                .floorId(room.getFloor() != null ? room.getFloor().getId() : null)
                .name(room.getName())
                .roomType(room.getRoomType())
                .x(room.getX())
                .y(room.getY())
                .width(room.getWidth())
                .height(room.getHeight())
                .config(room.getConfig())
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
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
