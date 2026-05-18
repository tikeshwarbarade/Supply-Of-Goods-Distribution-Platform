package com.edutech.supply_of_goods_management.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edutech.supply_of_goods_management.entity.Inventory;
import com.edutech.supply_of_goods_management.entity.Order;
import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.entity.User;
import com.edutech.supply_of_goods_management.repository.InventoryRepository;
import com.edutech.supply_of_goods_management.repository.OrderRepository;
import com.edutech.supply_of_goods_management.repository.ProductRepository;
import com.edutech.supply_of_goods_management.repository.UserRepository;

import java.util.List;
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepo;

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private InventoryRepository inventoryRepo;

    // =========================
    // WHOLESALER → MANUFACTURER ORDER
    // =========================
    public Order placeOrder(Long productId, Long userId, Order order) {

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        order.setProduct(product);
        order.setUser(user);

        order.setOrderType("WHOLESALER_TO_MANUFACTURER");
        order.setStatus("PENDING");

        return orderRepo.save(order);
    }

    // ✅ FIX: DO NOT FILTER
    public List<Order> getAllOrders(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    // =========================
    // MANUFACTURER SIDE (RESTORED ✅)
    // =========================
    public List<Order> getOrdersForManufacturer(Long manufacturerId) {
        return orderRepo.findOrdersForManufacturer(manufacturerId);
    }

    public Order updateManufacturerOrderStatus(Long orderId, String status) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status == null ? "PENDING" : status.toUpperCase());

        return orderRepo.save(order);
    }

    // =========================
    // CONSUMER ORDER
    // =========================
    public Order placeConsumerOrderFromInventory(Long inventoryId, Long userId, Order order) {

        Inventory inventory = inventoryRepo.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        order.setUser(user);
        order.setProduct(inventory.getProduct());

        order.setSellerWholesalerId(inventory.getWholesalerId());
        order.setOrderType("CONSUMER_TO_WHOLESALER");
        order.setStatus("PENDING");

        return orderRepo.save(order);
    }

    // ✅ FIX: DO NOT FILTER
    public List<Order> getConsumerOrders(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    // ✅ FIX: DO NOT FILTER
    public List<Order> getCustomerOrdersForWholesaler(Long wholesalerId) {
        return orderRepo.findBySellerWholesalerId(wholesalerId);
    }

    // =========================
    public Order updateOrder(Long id, String status) {

        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status == null ? "PENDING" : status.toUpperCase());

        return orderRepo.save(order);
    }

    public Order updateCustomerOrderStatus(Long orderId, String status) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status == null ? "PENDING" : status.toUpperCase());

        return orderRepo.save(order);
    }
}