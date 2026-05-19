package com.edutech.supply_of_goods_management.service;

import com.edutech.supply_of_goods_management.entity.Inventory;
import com.edutech.supply_of_goods_management.entity.Order;
import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.entity.User;
import com.edutech.supply_of_goods_management.repository.InventoryRepository;
import com.edutech.supply_of_goods_management.repository.OrderRepository;
import com.edutech.supply_of_goods_management.repository.ProductRepository;
import com.edutech.supply_of_goods_management.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_SHIPPED = "SHIPPED";
    private static final String STATUS_DELIVERED = "DELIVERED";
    private static final String STATUS_CANCELLED = "CANCELLED";

    private static final String ORDER_TYPE_WHOLESALER_TO_MANUFACTURER =
            "WHOLESALER_TO_MANUFACTURER";

    private static final String ORDER_TYPE_CONSUMER_TO_WHOLESALER =
            "CONSUMER_TO_WHOLESALER";

    private final OrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;
    private final InventoryRepository inventoryRepo;

    public OrderService(
            OrderRepository orderRepo,
            ProductRepository productRepo,
            UserRepository userRepo,
            InventoryRepository inventoryRepo
    ) {
        this.orderRepo = orderRepo;
        this.productRepo = productRepo;
        this.userRepo = userRepo;
        this.inventoryRepo = inventoryRepo;
    }

    // =====================================================
    // WHOLESALER → MANUFACTURER ORDER
    // =====================================================

    public Order placeOrder(Long productId, Long userId, Order order) {
        validateOrderPayload(order);

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        order.setProduct(product);
        order.setUser(user);
        order.setOrderType(ORDER_TYPE_WHOLESALER_TO_MANUFACTURER);
        order.setSellerWholesalerId(null);
        order.setStatus(STATUS_PENDING);

        return orderRepo.save(order);
    }

    public List<Order> getAllOrders(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    // =====================================================
    // MANUFACTURER SIDE
    // =====================================================

    public List<Order> getOrdersForManufacturer(Long manufacturerId) {
        return orderRepo.findOrdersForManufacturer(manufacturerId);
    }

    @Transactional
    public Order updateManufacturerOrderStatus(Long orderId, String status) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String oldStatus = normalizeStatus(order.getStatus());
        String newStatus = normalizeStatus(status);

        validateStatus(newStatus);

        order.setStatus(newStatus);

        /*
         * Important:
         * Inventory must be updated only when status changes TO DELIVERED.
         * If order is already DELIVERED and update is clicked again,
         * inventory should NOT increase again.
         */
        if (shouldUpdateWholesalerInventory(order, oldStatus, newStatus)) {
            addOrderQuantityToWholesalerInventory(order);
        }

        return orderRepo.save(order);
    }

    private boolean shouldUpdateWholesalerInventory(
            Order order,
            String oldStatus,
            String newStatus
    ) {
        return ORDER_TYPE_WHOLESALER_TO_MANUFACTURER.equalsIgnoreCase(order.getOrderType())
                && !STATUS_DELIVERED.equals(oldStatus)
                && STATUS_DELIVERED.equals(newStatus);
    }

    private void addOrderQuantityToWholesalerInventory(Order order) {
        if (order.getUser() == null || order.getUser().getId() == null) {
            throw new RuntimeException("Wholesaler not found for this order");
        }

        if (order.getProduct() == null || order.getProduct().getId() == null) {
            throw new RuntimeException("Product not found for this order");
        }

        if (order.getQuantity() <= 0) {
            throw new RuntimeException("Invalid order quantity");
        }

        Long wholesalerId = order.getUser().getId();
        Long productId = order.getProduct().getId();

        Inventory inventory = inventoryRepo
                .findByWholesalerIdAndProductId(wholesalerId, productId)
                .orElse(null);

        if (inventory == null) {
            inventory = new Inventory();
            inventory.setWholesalerId(wholesalerId);
            inventory.setProduct(order.getProduct());
            inventory.setStockQuantity(order.getQuantity());
        } else {
            inventory.setStockQuantity(
                    inventory.getStockQuantity() + order.getQuantity()
            );
        }

        inventoryRepo.save(inventory);
    }

    // =====================================================
    // CONSUMER → WHOLESALER ORDER
    // =====================================================

    public Order placeConsumerOrderFromInventory(
            Long inventoryId,
            Long userId,
            Order order
    ) {
        validateOrderPayload(order);

        Inventory inventory = inventoryRepo.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (inventory.getProduct() == null) {
            throw new RuntimeException("Inventory product not found");
        }

        if (inventory.getStockQuantity() < order.getQuantity()) {
            throw new RuntimeException("Insufficient inventory stock");
        }

        order.setUser(user);
        order.setProduct(inventory.getProduct());
        order.setSellerWholesalerId(inventory.getWholesalerId());
        order.setOrderType(ORDER_TYPE_CONSUMER_TO_WHOLESALER);
        order.setStatus(STATUS_PENDING);

        return orderRepo.save(order);
    }

    public List<Order> getConsumerOrders(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    public List<Order> getCustomerOrdersForWholesaler(Long wholesalerId) {
        return orderRepo.findBySellerWholesalerId(wholesalerId);
    }

    // =====================================================
    // WHOLESALER / CUSTOMER ORDER STATUS
    // =====================================================

    public Order updateOrder(Long id, String status) {
        Order order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String newStatus = normalizeStatus(status);
        validateStatus(newStatus);

        order.setStatus(newStatus);

        return orderRepo.save(order);
    }

    @Transactional
    public Order updateCustomerOrderStatus(Long orderId, String status) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String newStatus = normalizeStatus(status);
        validateStatus(newStatus);

        order.setStatus(newStatus);

        return orderRepo.save(order);
    }

    // =====================================================
    // VALIDATION / HELPERS
    // =====================================================

    private void validateOrderPayload(Order order) {
        if (order == null) {
            throw new RuntimeException("Order data is required");
        }

        if (order.getQuantity() <= 0) {
            throw new RuntimeException("Order quantity must be greater than zero");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return STATUS_PENDING;
        }

        return status.trim().toUpperCase();
    }

    private void validateStatus(String status) {
        if (!STATUS_PENDING.equals(status)
                && !STATUS_SHIPPED.equals(status)
                && !STATUS_DELIVERED.equals(status)
                && !STATUS_CANCELLED.equals(status)) {
            throw new RuntimeException("Invalid order status");
        }
    }
}