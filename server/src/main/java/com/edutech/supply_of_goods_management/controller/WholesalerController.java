package com.edutech.supply_of_goods_management.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.supply_of_goods_management.entity.Inventory;
import com.edutech.supply_of_goods_management.entity.Order;
import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.service.InventoryService;
import com.edutech.supply_of_goods_management.service.OrderService;
import com.edutech.supply_of_goods_management.service.ProductService;

import java.util.List;

@RestController
@RequestMapping("/api/wholesalers")
public class WholesalerController {

    @Autowired private ProductService productService;
    @Autowired private OrderService orderService;

    @GetMapping("/products")
    public List<Product> getProducts() {
        return productService.getAll();
    }

    @PostMapping("/order")
    public ResponseEntity<?> order(@RequestParam Long productId,
                                  @RequestParam Long userId,
                                  @RequestBody Order order) {
        return ResponseEntity.status(201)
                .body(orderService.placeOrder(productId, userId, order));
    }

    @PutMapping("/order/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                   @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateOrder(id, status));
    }

    @GetMapping("/orders")
    public List<Order> getOrders(@RequestParam Long userId) {
        return orderService.getAllOrders(userId);
    }
}