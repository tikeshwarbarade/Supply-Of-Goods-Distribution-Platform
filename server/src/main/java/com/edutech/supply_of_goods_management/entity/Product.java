package com.edutech.supply_of_goods_management.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.List;
@Entity
@Table(name = "products")
@Getter @Setter
public class Product {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "manufacturer_id")
private Long manufacturerId;

private String name;
private String description;
private double price;

@Column(name = "stock_quantity")
private int stockQuantity;  

@Column(name = "image_url")
private String imageUrl;

@OneToMany(mappedBy = "product")
    @JsonIgnore
    private List<Order> orders;

    @OneToMany(mappedBy = "product")
    @JsonIgnore
    private List<Inventory> inventories;
}
// public class Product {
//     // implement the entity here
// }
