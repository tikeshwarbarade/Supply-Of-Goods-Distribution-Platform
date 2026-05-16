package com.edutech.supply_of_goods_management.repository;

import com.edutech.supply_of_goods_management.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserId(Long userId);

    List<Order> findByProductId(Long productId);

    List<Order> findBySellerWholesalerId(Long sellerWholesalerId);

    List<Order> findByUserIdAndOrderType(Long userId, String orderType);

    List<Order> findBySellerWholesalerIdAndOrderType(Long sellerWholesalerId, String orderType);

    @Query("SELECT o FROM Order o " +
           "WHERE o.product.manufacturerId = :manufacturerId " +
           "AND o.orderType = 'WHOLESALER_TO_MANUFACTURER'")
    List<Order> findOrdersForManufacturer(@Param("manufacturerId") Long manufacturerId);
}