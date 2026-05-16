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
    // WHOLESALER -> MANUFACTURER ORDER
    // =========================

    public Order placeOrder(Long productId, Long userId, Order order) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        order.setProduct(product);
        order.setUser(user);

        // Buyer should not decide status.
        // Wholesaler places order to manufacturer, so status is PENDING by default.
        order.setStatus("PENDING");
        order.setOrderType("WHOLESALER_TO_MANUFACTURER");
        order.setSellerWholesalerId(null);

        return orderRepo.save(order);
    }

    // Existing generic update kept for compatibility.
    // This should mainly be used by old wholesaler order route if needed.
    public Order updateOrder(Long id, String status) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(status == null ? "PENDING" : status.toUpperCase());

        return orderRepo.save(order);
    }

    // Wholesaler purchase orders only.
    // This prevents consumer orders from mixing into wholesaler purchase orders.
    public List<Order> getAllOrders(Long userId) {
        return orderRepo.findByUserIdAndOrderType(
                userId,
                "WHOLESALER_TO_MANUFACTURER"
        );
    }

    // =========================
    // MANUFACTURER RECEIVED ORDERS
    // =========================

    public List<Order> getOrdersForManufacturer(Long manufacturerId) {
        return orderRepo.findOrdersForManufacturer(manufacturerId);
    }

    public Order updateManufacturerOrderStatus(Long orderId, String status) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!"WHOLESALER_TO_MANUFACTURER".equalsIgnoreCase(order.getOrderType())) {
            throw new RuntimeException("This order does not belong to manufacturer purchase flow");
        }

        String oldStatus = order.getStatus() == null ? "PENDING" : order.getStatus().toUpperCase();
        String newStatus = status == null ? "PENDING" : status.toUpperCase();

        // Transfer manufacturer product stock to wholesaler inventory only once,
        // when order moves from non-DELIVERED to DELIVERED.
        if (!oldStatus.equals("DELIVERED") && newStatus.equals("DELIVERED")) {
            Product product = order.getProduct();

            if (product.getStockQuantity() < order.getQuantity()) {
                throw new RuntimeException("Insufficient manufacturer stock");
            }

            product.setStockQuantity(product.getStockQuantity() - order.getQuantity());
            productRepo.save(product);

            Long wholesalerId = order.getUser().getId();

            Inventory inventory = inventoryRepo
                    .findByWholesalerIdAndProductId(wholesalerId, product.getId())
                    .orElse(null);

            if (inventory == null) {
                inventory = new Inventory();
                inventory.setWholesalerId(wholesalerId);
                inventory.setProduct(product);
                inventory.setStockQuantity(order.getQuantity());
            } else {
                inventory.setStockQuantity(inventory.getStockQuantity() + order.getQuantity());
            }

            inventoryRepo.save(inventory);
        }

        order.setStatus(newStatus);
        return orderRepo.save(order);
    }

    // =========================
    // CONSUMER -> WHOLESALER ORDER
    // =========================

    public Order placeConsumerOrderFromInventory(Long inventoryId, Long userId, Order order) {
        Inventory inventory = inventoryRepo.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        User consumer = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (inventory.getStockQuantity() < order.getQuantity()) {
            throw new RuntimeException("Insufficient wholesaler inventory stock");
        }

        order.setUser(consumer);
        order.setProduct(inventory.getProduct());

        // This is the key part:
        // consumer order must go to the wholesaler who owns selected inventory.
        order.setSellerWholesalerId(inventory.getWholesalerId());
        order.setOrderType("CONSUMER_TO_WHOLESALER");
        order.setStatus("PENDING");

        return orderRepo.save(order);
    }

    public List<Order> getConsumerOrders(Long userId) {
        return orderRepo.findByUserIdAndOrderType(
                userId,
                "CONSUMER_TO_WHOLESALER"
        );
    }

    public List<Order> getCustomerOrdersForWholesaler(Long wholesalerId) {
        return orderRepo.findBySellerWholesalerIdAndOrderType(
                wholesalerId,
                "CONSUMER_TO_WHOLESALER"
        );
    }

    public Order updateCustomerOrderStatus(Long orderId, String status) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!"CONSUMER_TO_WHOLESALER".equalsIgnoreCase(order.getOrderType())) {
            throw new RuntimeException("This order does not belong to consumer-wholesaler flow");
        }

        String oldStatus = order.getStatus() == null ? "PENDING" : order.getStatus().toUpperCase();
        String newStatus = status == null ? "PENDING" : status.toUpperCase();

        // Wholesaler inventory should reduce only once,
        // when consumer order moves from non-DELIVERED to DELIVERED.
        if (!oldStatus.equals("DELIVERED") && newStatus.equals("DELIVERED")) {
            Long wholesalerId = order.getSellerWholesalerId();
            Long productId = order.getProduct().getId();

            Inventory inventory = inventoryRepo
                    .findByWholesalerIdAndProductId(wholesalerId, productId)
                    .orElseThrow(() -> new RuntimeException("Wholesaler inventory not found"));

            if (inventory.getStockQuantity() < order.getQuantity()) {
                throw new RuntimeException("Insufficient wholesaler stock");
            }

            inventory.setStockQuantity(inventory.getStockQuantity() - order.getQuantity());
            inventoryRepo.save(inventory);
        }

        order.setStatus(newStatus);
        return orderRepo.save(order);
    }
}
