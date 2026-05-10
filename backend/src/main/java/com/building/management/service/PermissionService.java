package com.building.management.service;

import com.building.management.dto.PermissionRequest;
import com.building.management.dto.PermissionResponse;
import com.building.management.entity.*;
import com.building.management.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final DeviceRepository deviceRepository;
    private final SystemTypeRepository systemTypeRepository;

    @Transactional(readOnly = true)
    public List<PermissionResponse> getAllPermissions() {
        log.info("Fetching all permissions");
        return permissionRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> getPermissionsByUserId(Long userId) {
        log.info("Fetching permissions for user ID: {}", userId);
        return permissionRepository.findByUserId(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> getPermissionsByRoleId(Long roleId) {
        log.info("Fetching permissions for role ID: {}", roleId);
        return permissionRepository.findByRoleId(roleId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        log.info("Creating new permission: {}", request);

        // Валидация: должен быть указан либо userId, либо roleId
        if ((request.getUserId() == null && request.getRoleId() == null) ||
            (request.getUserId() != null && request.getRoleId() != null)) {
            throw new IllegalArgumentException("Either userId or roleId must be specified, but not both");
        }

        Permission permission = Permission.builder()
                .action(request.getAction())
                .expiresAt(request.getExpiresAt())
                .build();

        // Установить субъект
        if (request.getUserId() != null) {
            User user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + request.getUserId()));
            permission.setUser(user);
        }
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRoleId()));
            permission.setRole(role);
        }

        // Установить область действия
        if (request.getBuildingId() != null) {
            Building building = buildingRepository.findById(request.getBuildingId())
                    .orElseThrow(() -> new RuntimeException("Building not found: " + request.getBuildingId()));
            permission.setBuilding(building);
        }
        if (request.getFloorId() != null) {
            Floor floor = floorRepository.findById(request.getFloorId())
                    .orElseThrow(() -> new RuntimeException("Floor not found: " + request.getFloorId()));
            permission.setFloor(floor);
        }
        if (request.getRoomId() != null) {
            Room room = roomRepository.findById(request.getRoomId())
                    .orElseThrow(() -> new RuntimeException("Room not found: " + request.getRoomId()));
            permission.setRoom(room);
        }
        if (request.getDeviceId() != null) {
            Device device = deviceRepository.findById(request.getDeviceId())
                    .orElseThrow(() -> new RuntimeException("Device not found: " + request.getDeviceId()));
            permission.setDevice(device);
        }

        // Установить систему
        if (request.getSystemTypeId() != null) {
            SystemType systemType = systemTypeRepository.findById(request.getSystemTypeId())
                    .orElseThrow(() -> new RuntimeException("System type not found: " + request.getSystemTypeId()));
            permission.setSystemType(systemType);
        }

        // Установить кто выдал право
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getName() != null) {
            userRepository.findByUsername(authentication.getName()).ifPresent(permission::setGrantedBy);
        }

        Permission saved = permissionRepository.save(permission);
        log.info("Permission created with ID: {}", saved.getId());
        
        return convertToResponse(saved);
    }

    @Transactional
    public void deletePermission(Long id) {
        log.info("Deleting permission with ID: {}", id);
        
        if (!permissionRepository.existsById(id)) {
            throw new RuntimeException("Permission not found: " + id);
        }
        
        permissionRepository.deleteById(id);
        log.info("Permission deleted: {}", id);
    }

    @Transactional(readOnly = true)
    public Boolean checkUserPermission(Long userId, String action, Long buildingId, Long floorId, 
                                      Long roomId, Long deviceId, String systemTypeCode) {
        log.debug("Checking permission for user {} - action: {}, building: {}, system: {}", 
                 userId, action, buildingId, systemTypeCode);
        
        return permissionRepository.checkPermission(userId, action, buildingId, floorId, 
                                                   roomId, deviceId, systemTypeCode);
    }

    private PermissionResponse convertToResponse(Permission permission) {
        PermissionResponse response = PermissionResponse.builder()
                .id(permission.getId())
                .action(permission.getAction())
                .grantedAt(permission.getGrantedAt())
                .expiresAt(permission.getExpiresAt())
                .isActive(permission.getExpiresAt() == null || permission.getExpiresAt().isAfter(LocalDateTime.now()))
                .build();

        // Субъект
        if (permission.getUser() != null) {
            response.setUserId(permission.getUser().getId());
            response.setUsername(permission.getUser().getUsername());
            response.setSubjectType("USER");
        } else if (permission.getRole() != null) {
            response.setRoleId(permission.getRole().getId());
            response.setRoleName(permission.getRole().getName());
            response.setSubjectType("ROLE");
        }

        // Область действия
        if (permission.getBuilding() != null) {
            response.setBuildingId(permission.getBuilding().getId());
            response.setBuildingName(permission.getBuilding().getName());
        }
        if (permission.getFloor() != null) {
            response.setFloorId(permission.getFloor().getId());
            response.setFloorName(permission.getFloor().getName());
        }
        if (permission.getRoom() != null) {
            response.setRoomId(permission.getRoom().getId());
            response.setRoomName(permission.getRoom().getName());
        }
        if (permission.getDevice() != null) {
            response.setDeviceId(permission.getDevice().getId());
            response.setDeviceName(permission.getDevice().getName());
        }

        // Система
        if (permission.getSystemType() != null) {
            response.setSystemTypeId(permission.getSystemType().getId());
            response.setSystemTypeCode(permission.getSystemType().getCode());
            response.setSystemTypeName(permission.getSystemType().getName());
        }

        // Метаданные
        if (permission.getGrantedBy() != null) {
            response.setGrantedById(permission.getGrantedBy().getId());
            response.setGrantedByUsername(permission.getGrantedBy().getUsername());
        }

        return response;
    }
}
