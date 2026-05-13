package com.edutech.supply_of_goods_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edutech.supply_of_goods_management.entity.Inventory;
import com.edutech.supply_of_goods_management.entity.Order;
import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.service.InventoryService;
import com.edutech.supply_of_goods_management.service.OrderService;
import com.edutech.supply_of_goods_management.service.ProductService;

@RestController
@RequestMapping("/api/wholesalers")
public class WholesalerController {

    @Autowired private InventoryService invService;
    @Autowired private OrderService orderService;
    @Autowired private ProductService productService;

    // ✅ GET PRODUCTS
    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productService.getAll();
    }

    // ✅ PLACE ORDER
    @PostMapping("/order")
    public ResponseEntity<?> placeOrder(
            @RequestParam Long productId,
            @RequestParam Long userId,
            @RequestBody Order order) {

        return ResponseEntity.status(201)
                .body(orderService.placeOrder(productId, userId, order));
    }

    // ✅ UPDATE ORDER
    @PutMapping("/order/{id}")
    public ResponseEntity<?> updateOrder(@PathVariable Long id,
                                         @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateOrder(id, status));
    }

    // ✅ GET ORDERS
    @GetMapping("/orders")
    public List<Order> getOrders(@RequestParam Long userId) {
        return orderService.getAllOrders(userId);
    }

    // ✅ ✅ ADD INVENTORY (FIXED)
    @PostMapping("/inventories")
    public ResponseEntity<?> addInventory(
            @RequestParam Long productId,
            @RequestBody Inventory inventory) {

        return ResponseEntity.status(201)
                .body(invService.addInventory(productId, inventory));
    }

    // ✅ ✅ UPDATE INVENTORY (FIXED)
    @PutMapping("/inventories/{id}")
    public ResponseEntity<?> updateInventory(
            @PathVariable Long id,
            @RequestParam int stockQuantity) {

        return ResponseEntity.ok(
                invService.updateInventory(id, stockQuantity)
        );
    }

    // ✅ ✅ GET INVENTORY (FIXED)
    @GetMapping("/inventories")
    public List<Inventory> getInventory(
            @RequestParam Long wholesalerId) {

        return invService.getAllInventories(wholesalerId);
    }
}