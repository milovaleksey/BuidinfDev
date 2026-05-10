package com.building.management.service;

import com.building.management.entity.Floor;
import com.building.management.entity.Room;
import com.building.management.repository.FloorRepository;
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
public class RoomService {

    private final RoomRepository roomRepository;
    private final FloorRepository floorRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<Room> getRoomsByFloor(Long floorId) {
        return roomRepository.findByFloorId(floorId);
    }

    @Transactional(readOnly = true)
    public Optional<Room> getRoomById(Long id) {
        return roomRepository.findById(id);
    }

    @Transactional
    public Room createRoom(Long floorId, Room room, String username, String ipAddress) {
        Floor floor = floorRepository.findById(floorId)
            .orElseThrow(() -> new RuntimeException("Floor not found: " + floorId));
        
        room.setFloor(floor);
        Room saved = roomRepository.save(room);
        
        auditLogService.log(username, "CREATE", "Room", saved.getId(), null, ipAddress);
        
        log.info("Room created: {} on floor {} by {}", saved.getName(), floor.getName(), username);
        return saved;
    }

    @Transactional
    public Room updateRoom(Long id, Room room, String username, String ipAddress) {
        Room existing = roomRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Room not found: " + id));
        
        existing.setName(room.getName());
        existing.setRoomType(room.getRoomType());
        existing.setX(room.getX());
        existing.setY(room.getY());
        existing.setWidth(room.getWidth());
        existing.setHeight(room.getHeight());
        existing.setConfig(room.getConfig());
        
        Room updated = roomRepository.save(existing);
        
        auditLogService.log(username, "UPDATE", "Room", id, null, ipAddress);
        
        log.info("Room updated: {} by {}", updated.getName(), username);
        return updated;
    }

    @Transactional
    public void deleteRoom(Long id, String username, String ipAddress) {
        Room room = roomRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Room not found: " + id));
        
        roomRepository.delete(room);
        
        auditLogService.log(username, "DELETE", "Room", id, null, ipAddress);
        
        log.info("Room deleted: {} by {}", room.getName(), username);
    }
}
