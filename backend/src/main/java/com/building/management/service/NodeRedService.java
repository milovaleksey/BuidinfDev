package com.building.management.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NodeRedService {

    @Value("${nodered.base.url}")
    private String nodeRedBaseUrl;

    @Value("${nodered.api.timeout}")
    private long timeout;

    private final WebClient.Builder webClientBuilder;

    public Mono<Map<String, Object>> getDeviceState(String deviceId) {
        WebClient webClient = webClientBuilder.baseUrl(nodeRedBaseUrl).build();

        return webClient.get()
                .uri("/device/{id}/state", deviceId)
                .retrieve()
                .bodyToMono(Map.class)
                .map(map -> (Map<String, Object>) map)
                .timeout(Duration.ofMillis(timeout))
                .doOnError(error -> log.error("Error fetching device state from Node-RED: {}", error.getMessage()));
    }

    public Mono<Map<String, Object>> sendDeviceCommand(String deviceId, String command, Map<String, Object> parameters) {
        WebClient webClient = webClientBuilder.baseUrl(nodeRedBaseUrl).build();

        Map<String, Object> payload = Map.of(
                "command", command,
                "parameters", parameters != null ? parameters : Map.of()
        );

        return webClient.post()
                .uri("/device/{id}/command", deviceId)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .map(map -> (Map<String, Object>) map)
                .timeout(Duration.ofMillis(timeout))
                .doOnError(error -> log.error("Error sending command to Node-RED: {}", error.getMessage()));
    }
}