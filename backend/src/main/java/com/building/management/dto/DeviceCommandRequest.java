package com.building.management.dto;

import lombok.Data;

import java.util.Map;

@Data
public class DeviceCommandRequest {
    private String command;
    private Map<String, Object> parameters;
}
