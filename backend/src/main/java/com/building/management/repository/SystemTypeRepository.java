package com.building.management.repository;

import com.building.management.entity.SystemType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemTypeRepository extends JpaRepository<SystemType, Long> {
    Optional<SystemType> findByCode(String code);
}
