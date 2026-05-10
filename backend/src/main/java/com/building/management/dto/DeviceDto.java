package com.building.management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceDto {
    private Long id;
    private Long roomId;
    private Long systemTypeId;
    private String name;
    private String deviceType;
    private String mqttTopic;
    private Double x;
    private Double y;
    private Map<String, Object> config;
    private Map<String, Object> state;
    private Boolean enabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
