package com.edutech.supply_of_goods_management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.service.OrderService;
import com.edutech.supply_of_goods_management.service.ProductService;

import com.edutech.supply_of_goods_management.service.ProductImageStorageService;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/manufacturers")
public class ManufacturerController {

    @Autowired
    private ProductService service;

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductImageStorageService productImageStorageService;

    @PostMapping("/product")
    public ResponseEntity<?> create(@RequestBody Product p) {
        return ResponseEntity.status(201).body(service.create(p));
    }

    @PutMapping("/product/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Product p) {
        return ResponseEntity.ok(service.update(id, p));
    }

    @GetMapping("/products")
    public List<Product> get(@RequestParam Long manufacturerId) {
        return service.getManufacturer(manufacturerId);
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getManufacturerOrders(@RequestParam Long manufacturerId) {
        return ResponseEntity.ok(orderService.getOrdersForManufacturer(manufacturerId));
    }

    @PutMapping("/order/{id}")
    public ResponseEntity<?> updateManufacturerOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(orderService.updateManufacturerOrderStatus(id, status));
    }

    @PostMapping(value = "/product/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProductImage(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image) {
        return ResponseEntity.ok(productImageStorageService.uploadProductImage(id, image));
    }

    @DeleteMapping("/product/{id}/image")
    public ResponseEntity<?> deleteProductImage(@PathVariable Long id) {
        return ResponseEntity.ok(productImageStorageService.deleteProductImage(id));
    }
}