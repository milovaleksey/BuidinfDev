package com.building.management.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Разрешаем конкретные источники для разработки
        // Важно: нельзя использовать "*" вместе с credentials=true!
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",  // Vite dev server
            "http://localhost:5174",  // Альтернативный порт
            "http://localhost:3000",  // React/CRA
            "http://localhost:8080",  // Если фронт на 8080
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:3000"
        ));
        
        // Разрешаем все HTTP методы
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
        
        // Разрешаем все заголовки
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Разрешаем отправку cookies и авторизационных заголовков
        configuration.setAllowCredentials(true);
        
        // Разрешаем клиенту читать эти заголовки из ответа
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Total-Count",
            "X-Page-Number",
            "X-Page-Size"
        ));
        
        // Кеширование preflight запросов на 1 час
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}