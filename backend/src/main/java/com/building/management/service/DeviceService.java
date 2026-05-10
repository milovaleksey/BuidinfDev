package com.building.management.service;

import com.building.management.entity.Device;
import com.building.management.entity.Room;
import com.building.management.repository.DeviceRepository;
import com.building.management.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final RoomRepository roomRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<Device> getDevicesByRoom(Long roomId) {
        return deviceRepository.findByRoomId(roomId);
    }

    @Transactional(readOnly = true)
    public Optional<Device> getDeviceById(Long id) {
        return deviceRepository.findById(id);
    }

    @Transactional
    public Device createDevice(Long roomId, Device device, String username, String ipAddress) {
        Room room = roomRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("Room not found: " + roomId));
        
        device.setRoom(room);
        Device saved = deviceRepository.save(device);
        
        auditLogService.log(username, "CREATE", "Device", saved.getId(), null, ipAddress);
        
        log.info("Device created: {} in room {} by {}", saved.getName(), room.getName(), username);
        return saved;
    }

    @Transactional
    public Device updateDevice(Long id, Device device, String username, String ipAddress) {
        Device existing = deviceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Device not found: " + id));
        
        existing.setName(device.getName());
        existing.setDeviceType(device.getDeviceType());
        existing.setMqttTopic(device.getMqttTopic());
        existing.setX(device.getX());
        existing.setY(device.getY());
        existing.setConfig(device.getConfig());
        existing.setEnabled(device.getEnabled());
        
        Device updated = deviceRepository.save(existing);
        
        auditLogService.log(username, "UPDATE", "Device", id, null, ipAddress);
        
        log.info("Device updated: {} by {}", updated.getName(), username);
        return updated;
    }

    @Transactional
    public void deleteDevice(Long id, String username, String ipAddress) {
        Device device = deviceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Device not found: " + id));
        
        deviceRepository.delete(device);
        
        auditLogService.log(username, "DELETE", "Device", id, null, ipAddress);
        
        log.info("Device deleted: {} by {}", device.getName(), username);
    }

    /**
     * Обновить состояние устройства (кэш из Node-RED)
     */
    @Transactional
    public Device updateDeviceState(Long id, Object state) {
        Device device = deviceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Device not found: " + id));
        
        if (state instanceof java.util.Map) {
            device.setState((java.util.Map<String, Object>) state);
        }
        
        return deviceRepository.save(device);
    }
}
