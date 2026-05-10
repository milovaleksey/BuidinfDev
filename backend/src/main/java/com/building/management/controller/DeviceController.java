package com.building.management.controller;

import com.building.management.dto.DeviceDto;
import com.building.management.entity.Device;
import com.building.management.entity.SystemType;
import com.building.management.repository.SystemTypeRepository;
import com.building.management.service.DeviceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeviceController {

    private final DeviceService deviceService;
    private final SystemTypeRepository systemTypeRepository;

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<DeviceDto>> getDevicesByRoom(@PathVariable Long roomId) {
        List<DeviceDto> devices = deviceService.getDevicesByRoom(roomId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(devices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeviceDto> getDevice(@PathVariable Long id) {
        Device device = deviceService.getDeviceById(id)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        return ResponseEntity.ok(convertToDto(device));
    }

    @PostMapping("/room/{roomId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<DeviceDto> createDevice(
            @PathVariable Long roomId,
            @RequestBody DeviceDto dto,
            Authentication authentication,
            HttpServletRequest request) {
        
        SystemType systemType = null;
        if (dto.getSystemTypeId() != null) {
            systemType = systemTypeRepository.findById(dto.getSystemTypeId())
                    .orElse(null);
        }

        Device device = Device.builder()
                .name(dto.getName())
                .deviceType(dto.getDeviceType())
                .systemType(systemType)
                .mqttTopic(dto.getMqttTopic())
                .x(dto.getX())
                .y(dto.getY())
                .config(dto.getConfig())
                .enabled(dto.getEnabled() != null ? dto.getEnabled() : true)
                .build();

        Device saved = deviceService.createDevice(roomId, device, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public ResponseEntity<DeviceDto> updateDevice(
            @PathVariable Long id,
            @RequestBody DeviceDto dto,
            Authentication authentication,
            HttpServletRequest request) {
        
        SystemType systemType = null;
        if (dto.getSystemTypeId() != null) {
            systemType = systemTypeRepository.findById(dto.getSystemTypeId())
                    .orElse(null);
        }

        Device device = Device.builder()
                .name(dto.getName())
                .deviceType(dto.getDeviceType())
                .systemType(systemType)
                .mqttTopic(dto.getMqttTopic())
                .x(dto.getX())
                .y(dto.getY())
                .config(dto.getConfig())
                .enabled(dto.getEnabled())
                .build();

        Device updated = deviceService.updateDevice(id, device, 
                authentication.getName(), getClientIP(request));
        
        return ResponseEntity.ok(convertToDto(updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteDevice(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest request) {
        
        deviceService.deleteDevice(id, authentication.getName(), getClientIP(request));
        return ResponseEntity.ok().build();
    }

    /**
     * Обновление состояния устройства (вызывается из Node-RED)
     */
    @PutMapping("/{id}/state")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public ResponseEntity<DeviceDto> updateDeviceState(
            @PathVariable Long id,
            @RequestBody Object state) {
        
        Device updated = deviceService.updateDeviceState(id, state);
        return ResponseEntity.ok(convertToDto(updated));
    }

    private DeviceDto convertToDto(Device device) {
        return DeviceDto.builder()
                .id(device.getId())
                .roomId(device.getRoom() != null ? device.getRoom().getId() : null)
                .systemTypeId(device.getSystemType() != null ? device.getSystemType().getId() : null)
                .name(device.getName())
                .deviceType(device.getDeviceType())
                .mqttTopic(device.getMqttTopic())
                .x(device.getX())
                .y(device.getY())
                .config(device.getConfig())
                .state(device.getState())
                .enabled(device.getEnabled())
                .createdAt(device.getCreatedAt())
                .updatedAt(device.getUpdatedAt())
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
