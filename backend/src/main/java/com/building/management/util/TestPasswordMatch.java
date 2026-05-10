package com.building.management.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Тестирование соответствия пароля и хеша
 */
public class TestPasswordMatch {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password = "password";
        
        // Хеши для тестирования
        String oldHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        String newHash = "$2a$10$7xJcLKNFIQM7aMTnacmEbe1ceyUkh5m/dDPhYEaHGnsFZx.cQ/DPK";
        
        System.out.println("========================================");
        System.out.println("BCrypt Password Matching Test");
        System.out.println("========================================");
        System.out.println();
        System.out.println("Тестируемый пароль: '" + password + "'");
        System.out.println();
        
        // Тест старого хеша
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("Тест 1: СТАРЫЙ хеш (был в init-data.sql)");
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("Хеш: " + oldHash);
        boolean oldMatches = encoder.matches(password, oldHash);
        System.out.println("Результат: " + (oldMatches ? "✅ СОВПАДАЕТ" : "❌ НЕ СОВПАДАЕТ"));
        System.out.println();
        
        // Тест нового хеша
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("Тест 2: НОВЫЙ хеш (текущий в init-data.sql)");
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("Хеш: " + newHash);
        boolean newMatches = encoder.matches(password, newHash);
        System.out.println("Результат: " + (newMatches ? "✅ СОВПАДАЕТ" : "❌ НЕ СОВПАДАЕТ"));
        System.out.println();
        
        // Генерация нового хеша для сравнения
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("Тест 3: Генерация СВЕЖЕГО хеша");
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        String freshHash = encoder.encode(password);
        System.out.println("Хеш: " + freshHash);
        boolean freshMatches = encoder.matches(password, freshHash);
        System.out.println("Результат: " + (freshMatches ? "✅ СОВПАДАЕТ" : "❌ НЕ СОВПАДАЕТ"));
        System.out.println();
        
        // Итоги
        System.out.println("========================================");
        System.out.println("ИТОГИ:");
        System.out.println("========================================");
        System.out.println("Старый хеш: " + (oldMatches ? "✅ РАБОТАЕТ" : "❌ НЕ РАБОТАЕТ"));
        System.out.println("Новый хеш:  " + (newMatches ? "✅ РАБОТАЕТ" : "❌ НЕ РАБОТАЕТ"));
        System.out.println("Свежий хеш: " + (freshMatches ? "✅ РАБОТАЕТ" : "❌ НЕ РАБОТАЕТ"));
        System.out.println();
        
        if (!newMatches) {
            System.out.println("⚠️  ПРОБЛЕМА: Новый хеш не работает!");
            System.out.println("Используйте этот свежий хеш в init-data.sql:");
            System.out.println(freshHash);
        } else {
            System.out.println("✅ Всё в порядке - новый хеш правильный!");
        }
        
        System.out.println("========================================");
    }
}
