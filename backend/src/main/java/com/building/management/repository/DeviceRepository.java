package com.building.management.repository;

import com.building.management.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByRoomId(Long roomId);
    List<Device> findBySystemTypeId(Long systemTypeId);

    @Query("SELECT d FROM Device d WHERE d.room.floor.id = :floorId")
    List<Device> findByFloorId(@Param("floorId") Long floorId);

    @Query("SELECT d FROM Device d WHERE d.room.floor.building.id = :buildingId")
    List<Device> findByBuildingId(@Param("buildingId") Long buildingId);
}
