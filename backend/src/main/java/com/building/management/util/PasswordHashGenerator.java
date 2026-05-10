package com.building.management.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Утилита для генерации BCrypt хешей паролей
 * Используйте для создания новых паролей в init-data.sql
 */
public class PasswordHashGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password = "password";
        String hash = encoder.encode(password);
        
        System.out.println("========================================");
        System.out.println("BCrypt Password Hash Generator");
        System.out.println("========================================");
        System.out.println();
        System.out.println("Исходный пароль: " + password);
        System.out.println("BCrypt хеш:      " + hash);
        System.out.println();
        System.out.println("Проверка хеша...");
        
        boolean matches = encoder.matches(password, hash);
        System.out.println("Результат: " + (matches ? "✅ Совпадает" : "❌ Не совпадает"));
        System.out.println();
        
        // Тест с известным хешем из init-data.sql
        String knownHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        System.out.println("Проверка известного хеша из init-data.sql:");
        System.out.println("Хеш: " + knownHash);
        
        boolean knownMatches = encoder.matches(password, knownHash);
        System.out.println("Результат: " + (knownMatches ? "✅ Совпадает с 'password'" : "❌ Не совпадает"));
        System.out.println();
        System.out.println("========================================");
    }
}
