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
public class FloorDto {
    private Long id;
    private Long buildingId;
    private Integer floorNumber;
    private String name;
    private Map<String, Object> planConfig;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
