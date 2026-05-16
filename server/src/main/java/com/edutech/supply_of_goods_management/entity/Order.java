package com.edutech.supply_of_goods_management.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int quantity;

    private String status;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "order_type")
    private String orderType;

    @Column(name = "seller_wholesaler_id")
    private Long sellerWholesalerId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @PrePersist
    public void prePersist() {
        if (this.orderDate == null) {
            this.orderDate = LocalDateTime.now();
        }

        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = "PENDING";
        }
    }
}