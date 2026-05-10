package com.building.management.controller;

import com.building.management.dto.PermissionRequest;
import com.building.management.dto.PermissionResponse;
import com.building.management.entity.SystemType;
import com.building.management.repository.SystemTypeRepository;
import com.building.management.service.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionController {

    private final PermissionService permissionService;
    private final SystemTypeRepository systemTypeRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PermissionResponse>> getAllPermissions() {
        log.info("GET /permissions - Fetching all permissions");
        List<PermissionResponse> permissions = permissionService.getAllPermissions();
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<List<PermissionResponse>> getPermissionsByUser(@PathVariable Long userId) {
        log.info("GET /permissions/user/{} - Fetching permissions for user", userId);
        List<PermissionResponse> permissions = permissionService.getPermissionsByUserId(userId);
        return ResponseEntity.ok(permissions);
    }

    @GetMapping("/role/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PermissionResponse>> getPermissionsByRole(@PathVariable Long roleId) {
        log.info("GET /permissions/role/{} - Fetching permissions for role", roleId);
        List<PermissionResponse> permissions = permissionService.getPermissionsByRoleId(roleId);
        return ResponseEntity.ok(permissions);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PermissionResponse> createPermission(@Valid @RequestBody PermissionRequest request) {
        log.info("POST /permissions - Creating new permission");
        PermissionResponse permission = permissionService.createPermission(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(permission);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePermission(@PathVariable Long id) {
        log.info("DELETE /permissions/{} - Deleting permission", id);
        permissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check")
    public ResponseEntity<Boolean> checkPermission(
            @RequestParam Long userId,
            @RequestParam String action,
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) Long floorId,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long deviceId,
            @RequestParam(required = false) String systemTypeCode) {
        
        log.debug("GET /permissions/check - Checking permission for user {}", userId);
        
        Boolean hasPermission = permissionService.checkUserPermission(
                userId, action, buildingId, floorId, roomId, deviceId, systemTypeCode);
        
        return ResponseEntity.ok(hasPermission);
    }

    @GetMapping("/system-types")
    public ResponseEntity<List<SystemType>> getSystemTypes() {
        log.info("GET /permissions/system-types - Fetching all system types");
        List<SystemType> systemTypes = systemTypeRepository.findAll();
        return ResponseEntity.ok(systemTypes);
    }
}
