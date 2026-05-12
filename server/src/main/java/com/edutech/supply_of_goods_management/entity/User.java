package com.edutech.supply_of_goods_management.entity;



import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.util.List;


@Entity
@Table(name = "users")
@Getter @Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    @JsonProperty
    private String password;

    private String email;
    private String role;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Order> orders;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Feedback> feedbacks;
}
// @Table(name = "users") // do not change table name ( do not change this line)
// public class User {
    
// @Id
//     @GeneratedValue(strategy = GenerationType.IDENTITY)
//     private Long id;


    
//     @Column(unique = true)

//     private String username;

//     private String password;
//     private String role;
//     private String email;

// }
