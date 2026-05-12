package com.edutech.supply_of_goods_management.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.edutech.supply_of_goods_management.dto.LoginRequest;
import com.edutech.supply_of_goods_management.dto.LoginResponse;
import com.edutech.supply_of_goods_management.entity.User;
import com.edutech.supply_of_goods_management.jwt.JwtUtil;
import com.edutech.supply_of_goods_management.service.UserService;

@RestController
@RequestMapping("/api/user")
public class RegisterAndLoginController {

    @Autowired private UserService service;
    @Autowired private JwtUtil jwt;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        return ResponseEntity.status(201).body(service.registerUser(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {

        User user = service.getUserByUsername(req.getUsername());

        if (!new BCryptPasswordEncoder()
                .matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).build();
        }

        String token = jwt.generateToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(
                new LoginResponse(user.getId(), token,
                        user.getUsername(), user.getEmail(), user.getRole())
        );
    }
}

// // public class RegisterAndLoginController {


    
   
// //        // Implement registration logic here
    

  
// //         // Implement login logic here
// //         // return jwt token in LoginResponse object
// //         // if login fails, return 401 Unauthorized http status
    
// }
