package com.building.management.controller;

import com.building.management.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Proxy Controller - проксирует все запросы к Node-RED
 * с проверкой авторизации и прав доступа
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ProxyController {

    private final WebClient nodeRedWebClient;

    /**
     * Проксирование GET запросов
     */
    @GetMapping("/buildings/**")
    public Mono<ResponseEntity<String>> proxyGetBuildings(
            HttpServletRequest request,
            Authentication authentication
    ) {
        return proxyRequest(request, authentication, HttpMethod.GET, null);
    }

    @GetMapping("/floors/**")
    public Mono<ResponseEntity<String>> proxyGetFloors(
            HttpServletRequest request,
            Authentication authentication
    ) {
        return proxyRequest(request, authentication, HttpMethod.GET, null);
    }

    @GetMapping("/rooms/**")
    public Mono<ResponseEntity<String>> proxyGetRooms(
            HttpServletRequest request,
            Authentication authentication
    ) {
        return proxyRequest(request, authentication, HttpMethod.GET, null);
    }

    @GetMapping("/devices/**")
    public Mono<ResponseEntity<String>> proxyGetDevices(
            HttpServletRequest request,
            Authentication authentication
    ) {
        return proxyRequest(request, authentication, HttpMethod.GET, null);
    }

    /**
     * Проксирование POST запросов
     */
    @PostMapping("/buildings/**")
    public Mono<ResponseEntity<String>> proxyPostBuildings(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkWritePermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.POST, body);
    }

    @PostMapping("/floors/**")
    public Mono<ResponseEntity<String>> proxyPostFloors(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkWritePermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.POST, body);
    }

    @PostMapping("/rooms/**")
    public Mono<ResponseEntity<String>> proxyPostRooms(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkWritePermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.POST, body);
    }

    @PostMapping("/devices/**")
    public Mono<ResponseEntity<String>> proxyPostDevices(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkWritePermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.POST, body);
    }

    /**
     * Проксирование PUT запросов
     */
    @PutMapping("/buildings/**")
    public Mono<ResponseEntity<String>> proxyPutBuildings(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkWritePermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.PUT, body);
    }

    @PutMapping("/floors/**")
    public Mono<ResponseEntity<String>> proxyPutFloors(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkWritePermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.PUT, body);
    }

    @PutMapping("/rooms/**")
    public Mono<ResponseEntity<String>> proxyPutRooms(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkWritePermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.PUT, body);
    }

    @PutMapping("/devices/**")
    public Mono<ResponseEntity<String>> proxyPutDevices(
            @RequestBody(required = false) String body,
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkWritePermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.PUT, body);
    }

    /**
     * Проксирование DELETE запросов
     */
    @DeleteMapping("/buildings/**")
    public Mono<ResponseEntity<String>> proxyDeleteBuildings(
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkAdminPermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.DELETE, null);
    }

    @DeleteMapping("/floors/**")
    public Mono<ResponseEntity<String>> proxyDeleteFloors(
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkAdminPermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.DELETE, null);
    }

    @DeleteMapping("/rooms/**")
    public Mono<ResponseEntity<String>> proxyDeleteRooms(
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkAdminPermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.DELETE, null);
    }

    @DeleteMapping("/devices/**")
    public Mono<ResponseEntity<String>> proxyDeleteDevices(
            HttpServletRequest request,
            Authentication authentication
    ) {
        checkAdminPermission(authentication);
        return proxyRequest(request, authentication, HttpMethod.DELETE, null);
    }

    /**
     * Основной метод проксирования
     */
    private Mono<ResponseEntity<String>> proxyRequest(
            HttpServletRequest request,
            Authentication authentication,
            HttpMethod method,
            String body
    ) {
        // Получить путь без /api
        String path = request.getRequestURI().replace("/api", "");
        String queryString = request.getQueryString();
        String fullPath = queryString != null ? path + "?" + queryString : path;

        log.info("Proxying {} {} to Node-RED for user {}",
                method, fullPath, getUserName(authentication));

        // Добавить заголовки с информацией о пользователе
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        WebClient.RequestBodySpec requestSpec = nodeRedWebClient
                .method(method)
                .uri(fullPath)
                .header("X-User-Id", principal.getId().toString())
                .header("X-User-Name", principal.getUsername())
                .header("X-User-Roles", getRoles(authentication));

        // Добавить body если есть
        if (body != null && !body.isEmpty()) {
            requestSpec = requestSpec.bodyValue(body);
        }

        return requestSpec
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
     * Проверка прав на запись
     */
    private void checkWritePermission(Authentication authentication) {
        if (authentication == null || !hasRole(authentication, "ADMIN", "MANAGER", "OPERATOR")) {
            throw new SecurityException("Недостаточно прав для изменения данных");
        }
    }

    /**
     * Проверка прав администратора
     */
    private void checkAdminPermission(Authentication authentication) {
        if (authentication == null || !hasRole(authentication, "ADMIN")) {
            throw new SecurityException("Требуются права администратора");
        }
    }

    /**
     * Проверка наличия роли
     */
    private boolean hasRole(Authentication authentication, String... roles) {
        for (String role : roles) {
            if (authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_" + role))) {
                return true;
            }
        }
        return false;
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
