package com.edutech.supply_of_goods_management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.supply_of_goods_management.entity.Feedback;
import com.edutech.supply_of_goods_management.entity.Order;
import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.service.FeedbackService;
import com.edutech.supply_of_goods_management.service.InventoryService;
import com.edutech.supply_of_goods_management.service.OrderService;
import com.edutech.supply_of_goods_management.service.ProductService;

import java.util.List;

@RestController
@RequestMapping("/api/consumers")
public class ConsumerController {

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private InventoryService inventoryService;

    @GetMapping("/products")
    public List<Product> getProducts() {
        return productService.getAll();
    }

    // Old direct product order endpoint kept for compatibility.
    // Frontend consumer flow should use /inventory-order.
    @PostMapping("/order")
    public ResponseEntity<?> order(
            @RequestParam Long productId,
            @RequestParam Long userId,
            @RequestBody Order order
    ) {
        return ResponseEntity.status(201)
                .body(orderService.placeOrder(productId, userId, order));
    }

    @GetMapping("/orders")
    public ResponseEntity<?> get(@RequestParam Long userId) {
        return ResponseEntity.ok(orderService.getConsumerOrders(userId));
    }

    @GetMapping("/inventories")
    public ResponseEntity<?> getAvailableInventories() {
        return ResponseEntity.ok(inventoryService.getAllAvailableInventories());
    }

    @PostMapping("/inventory-order")
    public ResponseEntity<?> placeOrderFromInventory(
            @RequestParam Long inventoryId,
            @RequestParam Long userId,
            @RequestBody Order order
    ) {
        return ResponseEntity.status(201)
                .body(orderService.placeConsumerOrderFromInventory(inventoryId, userId, order));
    }

    @PostMapping("/order/{orderId}/feedback")
    public ResponseEntity<?> addFeedback(
            @PathVariable Long orderId,
            @RequestParam Long userId,
            @RequestBody Feedback feedback
    ) {
        Feedback fb = feedbackService.provideFeedback(orderId, userId, feedback);
        return ResponseEntity.status(201).body(fb);
    }
}
