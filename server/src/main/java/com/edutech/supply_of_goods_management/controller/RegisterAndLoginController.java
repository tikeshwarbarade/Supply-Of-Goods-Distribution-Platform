package com.edutech.supply_of_goods_management.controller;

import com.edutech.supply_of_goods_management.dto.LoginRequest;
import com.edutech.supply_of_goods_management.dto.LoginResponse;
import com.edutech.supply_of_goods_management.entity.User;
import com.edutech.supply_of_goods_management.jwt.JwtUtil;
import com.edutech.supply_of_goods_management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class RegisterAndLoginController {

    @Autowired
    private UserRepository repo;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtil jwt;

    // ✅ REGISTER USER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        // encode password before saving
        user.setPassword(encoder.encode(user.getPassword()));

        User savedUser = repo.save(user);

        return ResponseEntity.status(201).body(savedUser);
    }

    // ✅ LOGIN USER (FULLY FIXED)
   @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest req) {

    try {

        Optional<User> optional = repo.findByUsername(req.getUsername());

        if (optional.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }

        User user = optional.get();

        if (!encoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid password");
        }

        // ✅ DEBUG POINT
        System.out.println("Login success, generating token...");

        String token = jwt.generateToken(user.getUsername(), user.getRole());

        LoginResponse response = new LoginResponse(
                user.getId(),
                token,
                user.getUsername(),
                user.getEmail(),
                user.getRole()
        );

        return ResponseEntity.ok(response);

    } catch (Exception e) {
        e.printStackTrace();  // ✅ WILL SHOW REAL ERROR
        return ResponseEntity.status(500).body("Internal Server Error");
    }
}
}
