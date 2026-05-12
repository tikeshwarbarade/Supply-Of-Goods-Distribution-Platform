package com.edutech.supply_of_goods_management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.service.ProductService;

import java.util.List;

@RestController
@RequestMapping("/api/manufacturers")
public class ManufacturerController {

    @Autowired private ProductService service;

    @PostMapping("/product")
    public ResponseEntity<?> create(@RequestBody Product p) {
        return ResponseEntity.status(201).body(service.create(p));
    }

    @PutMapping("/product/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                   @RequestBody Product p) {
        return ResponseEntity.ok(service.update(id, p));
    }

    @GetMapping("/products")
    public List<Product> get(@RequestParam Long manufacturerId) {
        return service.getManufacturer(manufacturerId);
    }
}