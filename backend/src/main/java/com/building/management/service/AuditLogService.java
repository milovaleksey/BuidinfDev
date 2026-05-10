package com.building.management.service;

import com.building.management.entity.AuditLog;
import com.building.management.entity.User;
import com.building.management.repository.AuditLogRepository;
import com.building.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    /**
     * Асинхронное логирование действия
     */
    @Async
    @Transactional
    public void log(String username, String action, String entityType, Long entityId, 
                    Map<String, Object> details, String ipAddress) {
        try {
            User user = userRepository.findByUsername(username).orElse(null);
            
            AuditLog auditLog = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details != null ? details : new HashMap<>())
                    .ipAddress(ipAddress)
                    .build();
            
            auditLogRepository.save(auditLog);
            log.debug("Logged action: {} by {} on {} #{}", action, username, entityType, entityId);
        } catch (Exception e) {
            log.error("Failed to log action: {}", e.getMessage(), e);
        }
    }

    /**
     * Логирование с дополнительными данными
     */
    @Async
    @Transactional
    public void logWithDetails(String username, String action, String entityType, 
                               Long entityId, String detailKey, Object detailValue, String ipAddress) {
        Map<String, Object> details = new HashMap<>();
        details.put(detailKey, detailValue);
        log(username, action, entityType, entityId, details, ipAddress);
    }

    /**
     * Получить логи по пользователю
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByUser(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }

    /**
     * Получить логи по сущности
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId, pageable);
    }

    /**
     * Получить логи за период
     */
    @Transactional(readOnly = true)
    public Page<AuditLog> getLogsByPeriod(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return auditLogRepository.findByCreatedAtBetween(start, end, pageable);
    }

    /**
     * Получить последние 100 логов
     */
    @Transactional(readOnly = true)
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }
}
