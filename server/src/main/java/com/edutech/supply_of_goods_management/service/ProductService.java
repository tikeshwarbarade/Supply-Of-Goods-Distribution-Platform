package com.edutech.supply_of_goods_management.service;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.repository.ProductRepository;

import java.util.List;


@Service
public class ProductService {

    @Autowired private ProductRepository repo;

    public Product create(Product p) {
        return repo.save(p);
    }
public Product update(Long id, Product p) {
    Product db = repo.findById(id).orElseThrow();

    db.setManufacturerId(p.getManufacturerId());
    db.setName(p.getName());
    db.setDescription(p.getDescription());
    db.setPrice(p.getPrice());
    db.setStockQuantity(p.getStockQuantity());

    return repo.save(db);
}
  public List<Product> getManufacturer(Long id) {
    return repo.findByManufacturerIdAndIsDeletedFalse(id);
}

    public List<Product> getAll() {
    List<Product> all = repo.findAll();
    all.removeIf(p -> p.isDeleted());
    return all;
}

public void delete(Long id) {
    Product product = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));

    // ✅ SOFT DELETE INSTEAD OF HARD DELETE
    product.setDeleted(true);

    repo.save(product);
}

}