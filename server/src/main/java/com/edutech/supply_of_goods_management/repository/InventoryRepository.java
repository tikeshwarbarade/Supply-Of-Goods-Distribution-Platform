package com.edutech.supply_of_goods_management.repository;

import com.edutech.supply_of_goods_management.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    List<Inventory> findByWholesalerId(Long wholesalerId);

    List<Inventory> findByProductId(Long productId);

    Optional<Inventory> findByWholesalerIdAndProductId(Long wholesalerId, Long productId);
}