package com.edutech.supply_of_goods_management.entity;


import javax.persistence.*;

import lombok.Getter;
import lombok.Setter;

// @Table(name = "inventories") // do not change the table name ( do not change this line)
// public class Inventory {
//     // implement the entity here
// }

@Entity
@Table(name = "inventories")
@Getter @Setter
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long wholesalerId;
    private int stockQuantity;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;
}