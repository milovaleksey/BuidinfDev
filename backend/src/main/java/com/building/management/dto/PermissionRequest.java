package com.building.management.dto;

import com.building.management.entity.Permission;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionRequest {
    
    // Субъект (один из двух должен быть заполнен)
    private Long userId;
    private Long roleId;
    
    // Область действия (опционально - NULL означает доступ ко всему)
    private Long buildingId;
    private Long floorId;
    private Long roomId;
    private Long deviceId;
    
    // Система (опционально)
    private Long systemTypeId;
    
    // Действие
    @NotNull(message = "Action is required")
    private Permission.PermissionAction action;
    
    // Срок действия (опционально)
    private LocalDateTime expiresAt;
}
