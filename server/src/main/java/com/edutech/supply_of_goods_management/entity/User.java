package com.edutech.supply_of_goods_management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    @JsonProperty
    private String password;

    @Column(unique = true)
    private String email;

    // ✅ Added phone number field
    private String phone;

    private String role;

    // ✅ 0 = logged out, 1 = logged in
    private Integer loginStatus = 0;

    // ✅ Used to expire stale sessions
    private LocalDateTime lastActivityTime;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Order> orders;

    @OneToMany(mappedBy = "user")
    @JsonIgnore
    private List<Feedback> feedbacks;
}