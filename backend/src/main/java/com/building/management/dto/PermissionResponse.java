package com.building.management.dto;

import com.building.management.entity.Permission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponse {
    
    private Long id;
    
    // Субъект
    private Long userId;
    private String username;
    private Long roleId;
    private String roleName;
    private String subjectType; // USER или ROLE
    
    // Область действия
    private Long buildingId;
    private String buildingName;
    private Long floorId;
    private String floorName;
    private Long roomId;
    private String roomName;
    private Long deviceId;
    private String deviceName;
    
    // Система
    private Long systemTypeId;
    private String systemTypeCode;
    private String systemTypeName;
    
    // Действие
    private Permission.PermissionAction action;
    
    // Метаданные
    private Long grantedById;
    private String grantedByUsername;
    private LocalDateTime grantedAt;
    private LocalDateTime expiresAt;
    private Boolean isActive;
}
