package com.building.management.repository;

import com.building.management.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    
    List<Permission> findByUserId(Long userId);
    
    List<Permission> findByRoleId(Long roleId);
    
    @Query("SELECT p FROM Permission p WHERE p.user.id = :userId OR p.role.id IN :roleIds")
    List<Permission> findByUserIdOrRoleIdIn(@Param("userId") Long userId, @Param("roleIds") List<Long> roleIds);
    
    @Query(value = "SELECT check_user_permission(:userId, CAST(:action AS permission_action), " +
            ":buildingId, :floorId, :roomId, :deviceId, :systemTypeCode)", 
            nativeQuery = true)
    Boolean checkPermission(
            @Param("userId") Long userId,
            @Param("action") String action,
            @Param("buildingId") Long buildingId,
            @Param("floorId") Long floorId,
            @Param("roomId") Long roomId,
            @Param("deviceId") Long deviceId,
            @Param("systemTypeCode") String systemTypeCode
    );
}
