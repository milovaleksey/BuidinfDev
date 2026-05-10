package com.building.management.controller;

import com.building.management.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Proxy Controller - проксирует команды управления и запросы отчетов на Node-RED
 * Backend отвечает за авторизацию, структуру проекта и логирование
 * Node-RED отвечает за управление устройствами через MQTT и генерацию отчетов
 */
@RestController
@RequestMapping("/nodered")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ProxyController {

    private final WebClient nodeRedWebClient;

    /**
     * Управление устройствами - отправка команд через Node-RED на MQTT
     * POST /api/nodered/control/device/{deviceId}
     */
    @PostMapping("/control/device/{deviceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public Mono<ResponseEntity<String>> controlDevice(
            @PathVariable Long deviceId,
            @RequestBody(required = false) String command,
            HttpServletRequest request,
            Authentication authentication
    ) {
        log.info("Device control command for device {} by user {}", deviceId, getUserName(authentication));
        return proxyRequest("/control/device/" + deviceId, authentication, HttpMethod.POST, command);
    }

    /**
     * Получение состояния устройства из Node-RED
     * GET /api/nodered/state/device/{deviceId}
     */
    @GetMapping("/state/device/{deviceId}")
    public Mono<ResponseEntity<String>> getDeviceState(
            @PathVariable Long deviceId,
            HttpServletRequest request,
            Authentication authentication
    ) {
        return proxyRequest("/state/device/" + deviceId, authentication, HttpMethod.GET, null);
    }

    /**
     * Получение отчета по зданию
     * GET /api/nodered/report/building/{buildingId}
     */
    @GetMapping("/report/building/{buildingId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<ResponseEntity<String>> getBuildingReport(
            @PathVariable Long buildingId,
            @RequestParam(required = false) String reportType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request,
            Authentication authentication
    ) {
        String queryString = request.getQueryString();
        String path = "/report/building/" + buildingId;
        String fullPath = queryString != null ? path + "?" + queryString : path;
        
        return proxyRequest(fullPath, authentication, HttpMethod.GET, null);
    }

    /**
     * Получение отчета по системе
     * GET /api/nodered/report/system/{systemType}
     */
    @GetMapping("/report/system/{systemType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<ResponseEntity<String>> getSystemReport(
            @PathVariable String systemType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request,
            Authentication authentication
    ) {
        String queryString = request.getQueryString();
        String path = "/report/system/" + systemType;
        String fullPath = queryString != null ? path + "?" + queryString : path;
        
        return proxyRequest(fullPath, authentication, HttpMethod.GET, null);
    }

    /**
     * Произвольный проксирующий запрос к Node-RED
     * Для расширяемости системы
     */
    @RequestMapping(value = "/**", method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
    public Mono<ResponseEntity<String>> proxyGeneric(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        String path = request.getRequestURI().replace("/nodered", "");
        String queryString = request.getQueryString();
        String fullPath = queryString != null ? path + "?" + queryString : path;
        
        HttpMethod method = HttpMethod.valueOf(request.getMethod());
        
        log.info("Generic proxy request {} {} by user {}", method, fullPath, getUserName(authentication));
        
        return proxyRequest(fullPath, authentication, method, body);
    }

    /**
     * Основной метод проксирования
     */
    private Mono<ResponseEntity<String>> proxyRequest(
            String path,
            Authentication authentication,
            HttpMethod method,
            String body
    ) {
        log.info("Proxying {} {} to Node-RED for user {}",
                method, path, getUserName(authentication));

        // Добавить заголовки с информацией о пользователе
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        WebClient.RequestBodyUriSpec requestBodyUriSpec = nodeRedWebClient.method(method);
        WebClient.RequestBodySpec requestSpec = requestBodyUriSpec
                .uri(path)
                .header("X-User-Id", principal.getId().toString())
                .header("X-User-Name", principal.getUsername())
                .header("X-User-Roles", getRoles(authentication));

        // Добавить body если есть
        WebClient.RequestHeadersSpec<?> headersSpec;
        if (body != null && !body.isEmpty()) {
            headersSpec = requestSpec.bodyValue(body);
        } else {
            headersSpec = requestSpec;
        }

        return headersSpec
                .retrieve()
                .toEntity(String.class)
                .doOnSuccess(response -> log.debug("Node-RED response: {}", response.getStatusCode()))
                .doOnError(error -> log.error("Error proxying to Node-RED: {}", error.getMessage()))
                .onErrorResume(e -> Mono.just(
                        ResponseEntity.status(503)
                                .body("{\"error\":\"Node-RED service unavailable: " + e.getMessage() + "\"}")
                ));
    }

    /**
     * Получить имя пользователя
     */
    private String getUserName(Authentication authentication) {
        if (authentication == null) return "anonymous";
        return authentication.getName();
    }

    /**
     * Получить роли пользователя в виде строки
     */
    private String getRoles(Authentication authentication) {
        if (authentication == null) return "";
        return authentication.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.joining(","));
    }
}