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

    @Autowired private OrderRepository orderRepo;
    @Autowired private ProductRepository productRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private InventoryRepository inventoryRepo;

    public Order placeOrder(Long productId, Long userId, Order order) {
        order.setProduct(productRepo.findById(productId).orElseThrow(() -> new RuntimeException("Product not found")));
        order.setUser(userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found")));
        order.setStatus("PENDING");
        return orderRepo.save(order);
    }

    public Order updateOrder(Long id, String status) {
        Order o = orderRepo.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
        o.setStatus(status);
        return orderRepo.save(o);
    }

    public List<Order> getAllOrders(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    public List<Order> getOrdersForManufacturer(Long manufacturerId) {
        return orderRepo.findOrdersForManufacturer(manufacturerId);
    }

    public List<Order> getCustomerOrdersForWholesaler(Long wholesalerId) {
    return orderRepo.findBySellerWholesalerIdAndOrderType(
            wholesalerId,
            "CONSUMER_TO_WHOLESALER"
    );
}

    public Order updateManufacturerOrderStatus(Long orderId, String status) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String oldStatus = order.getStatus() == null ? "PENDING" : order.getStatus().toUpperCase();
        String newStatus = status == null ? "PENDING" : status.toUpperCase();

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
        order.setSellerWholesalerId(inventory.getWholesalerId());
        order.setOrderType("CONSUMER_TO_WHOLESALER");
        order.setStatus("PENDING");

        return orderRepo.save(order);
    }
}
