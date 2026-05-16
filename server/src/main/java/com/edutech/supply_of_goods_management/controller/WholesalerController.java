package com.edutech.supply_of_goods_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.supply_of_goods_management.entity.Inventory;
import com.edutech.supply_of_goods_management.entity.Order;
import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.service.FeedbackService;
import com.edutech.supply_of_goods_management.service.InventoryService;
import com.edutech.supply_of_goods_management.service.OrderService;
import com.edutech.supply_of_goods_management.service.ProductService;

@RestController
@RequestMapping("/api/wholesalers")
public class WholesalerController {

    @Autowired
    private InventoryService invService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductService productService;

    @Autowired
    private FeedbackService feedbackService;

    // =========================
    // PRODUCTS
    // =========================

    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productService.getAll();
    }

    // =========================
    // WHOLESALER -> MANUFACTURER ORDERS
    // =========================

    @PostMapping("/order")
    public ResponseEntity<?> placeOrder(
            @RequestParam Long productId,
            @RequestParam Long userId,
            @RequestBody Order order
    ) {
        return ResponseEntity.status(201)
                .body(orderService.placeOrder(productId, userId, order));
    }

    @GetMapping("/orders")
    public List<Order> getOrders(@RequestParam Long userId) {
        return orderService.getAllOrders(userId);
    }

    @PutMapping("/order/{id}")
    public ResponseEntity<?> updateOrder(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(orderService.updateOrder(id, status));
    }

    // =========================
    // WHOLESALER INVENTORY
    // =========================

    @PostMapping("/inventories")
    public ResponseEntity<?> addInventory(
            @RequestParam Long productId,
            @RequestBody Inventory inventory
    ) {
        return ResponseEntity.status(201)
                .body(invService.addInventory(productId, inventory));
    }

    @PutMapping("/inventories/{id}")
    public ResponseEntity<?> updateInventory(
            @PathVariable Long id,
            @RequestParam int stockQuantity
    ) {
        return ResponseEntity.ok(
                invService.updateInventory(id, stockQuantity)
        );
    }

    @GetMapping("/inventories")
    public List<Inventory> getInventory(
            @RequestParam Long wholesalerId
    ) {
        return invService.getAllInventories(wholesalerId);
    }

    // =========================
    // CONSUMER -> WHOLESALER ORDERS
    // =========================

    @GetMapping("/customer-orders")
    public ResponseEntity<?> getCustomerOrders(
            @RequestParam Long wholesalerId
    ) {
        return ResponseEntity.ok(
                orderService.getCustomerOrdersForWholesaler(wholesalerId)
        );
    }

    @PutMapping("/customer-order/{id}")
    public ResponseEntity<?> updateCustomerOrderStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return ResponseEntity.ok(
                orderService.updateCustomerOrderStatus(id, status)
        );
    }

    // =========================
    // CONSUMER FEEDBACKS FOR WHOLESALER
    // =========================

    @GetMapping("/feedbacks")
    public ResponseEntity<?> getFeedbacksForWholesaler(
            @RequestParam Long wholesalerId
    ) {
        return ResponseEntity.ok(
                feedbackService.getFeedbacksForWholesaler(wholesalerId)
        );
    }
}