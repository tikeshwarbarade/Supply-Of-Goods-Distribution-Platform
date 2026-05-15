package com.edutech.supply_of_goods_management.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edutech.supply_of_goods_management.entity.Inventory;
import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.repository.InventoryRepository;
import com.edutech.supply_of_goods_management.repository.ProductRepository;

@Service
public class InventoryService {

    @Autowired private InventoryRepository repo;
    @Autowired private ProductRepository productRepo;

    public Inventory addInventory(Long productId, Inventory inventory) {
        Product p = productRepo.findById(productId).orElseThrow();

        inventory.setProduct(p);

        return repo.save(inventory);
    }

    public Inventory updateInventory(Long id, int stockQuantity) {

        Inventory inv = repo.findById(id).orElseThrow();

        inv.setStockQuantity(stockQuantity);

        return repo.save(inv);
    }

    public List<Inventory> getAllInventories(Long wholesalerId) {
        return repo.findByWholesalerId(wholesalerId);
    }
    public List<Inventory> getAllAvailableInventories() {
    return repo.findAll()
            .stream()
            .filter(inv -> inv.getStockQuantity() > 0)
            .collect(Collectors.toList());
}
}