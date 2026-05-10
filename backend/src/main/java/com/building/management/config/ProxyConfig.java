package com.building.management.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class ProxyConfig {

    @Value("${nodered.base.url}")
    private String nodeRedBaseUrl;

    @Bean
    public WebClient nodeRedWebClient() {
        return WebClient.builder()
                .baseUrl(nodeRedBaseUrl)
                .build();
    }
}
