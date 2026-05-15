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

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/user")
public class RegisterAndLoginController {

    private static final long SESSION_TIMEOUT_MINUTES = 1;

    @Autowired
    private UserRepository repo;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtil jwt;

    // ✅ REGISTER USER
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (repo.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body("Username already exists");
        }

        user.setPassword(encoder.encode(user.getPassword()));
        user.setLoginStatus(0);
        user.setLastActivityTime(null);

        User savedUser = repo.save(user);

        return ResponseEntity.status(201).body(savedUser);
    }

    // ✅ LOGIN USER WITH SESSION MANAGEMENT
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

            // ✅ Check whether user already logged in
            if (user.getLoginStatus() != null && user.getLoginStatus() == 1) {

                LocalDateTime lastActivity = user.getLastActivityTime();

                if (lastActivity != null) {
                    long inactiveMinutes =
                            Duration.between(lastActivity, LocalDateTime.now()).toMinutes();

                    // ✅ Active session still alive
                    if (inactiveMinutes < SESSION_TIMEOUT_MINUTES) {
                        return ResponseEntity.status(409)
                                .body("User already logged in");
                    }
                }

                // ✅ Old/stale session expired, allow login again
            }

            // ✅ Successful login
            user.setLoginStatus(1);
            user.setLastActivityTime(LocalDateTime.now());
            repo.save(user);

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
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error");
        }
    }

    // ✅ LOGOUT USER
    @PostMapping("/logout")
public ResponseEntity<?> logout(@RequestParam Long userId) {

    Optional<User> optional = repo.findById(userId);

    if (optional.isEmpty()) {
        return ResponseEntity.status(404).body("User not found");
    }

    User user = optional.get();

    user.setLoginStatus(0);
    user.setLastActivityTime(null);

    repo.save(user);

    return ResponseEntity.ok("Logged out successfully");
}
    // ✅ UPDATE ACTIVITY / HEARTBEAT
 @PostMapping("/activity")
public ResponseEntity<?> updateActivity(@RequestParam Long userId) {

    Optional<User> optional = repo.findById(userId);

    if (optional.isEmpty()) {
        return ResponseEntity.status(404).body("User not found");
    }

    User user = optional.get();

    if (user.getLoginStatus() != null && user.getLoginStatus() == 1) {
        user.setLastActivityTime(LocalDateTime.now());
        repo.save(user);
    }

    return ResponseEntity.ok("Activity updated");
}
}