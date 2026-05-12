package com.edutech.supply_of_goods_management.entity;


import javax.persistence.*;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;


// @Table(name = "feedbacks") // do not change the table name ( do not change this line)
// public class Feedback {
//     // implement the entity here
// }
@Entity
@Table(name = "feedbacks")
@Getter @Setter
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String content;
    private Date timestamp;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}