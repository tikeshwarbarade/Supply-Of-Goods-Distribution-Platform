package com.edutech.supply_of_goods_management.controller;

import com.edutech.supply_of_goods_management.dto.LoginOtpRequest;
import com.edutech.supply_of_goods_management.dto.LoginRequest;
import com.edutech.supply_of_goods_management.dto.LoginResponse;
import com.edutech.supply_of_goods_management.dto.VerifyLoginOtpRequest;
import com.edutech.supply_of_goods_management.entity.User;
import com.edutech.supply_of_goods_management.jwt.JwtUtil;
import com.edutech.supply_of_goods_management.repository.UserRepository;
import com.edutech.supply_of_goods_management.service.LoginOtpService;
import com.edutech.supply_of_goods_management.service.OtpService;
import com.edutech.supply_of_goods_management.service.SendGridEmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
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

    @Autowired
    private OtpService otpService;

    @Autowired
    private LoginOtpService loginOtpService;

    @Autowired
    private SendGridEmailService emailService;

    // =====================================================
    // REGISTRATION EMAIL OTP - SEND OTP
    // =====================================================

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            email = email.trim().toLowerCase();

            if (repo.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email already exists")
                );
            }

            otpService.sendOtp(email);

            return ResponseEntity.ok(
                    Map.of("message", "OTP sent successfully to your email")
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "Failed to send OTP")
            );
        }
    }

    // =====================================================
    // REGISTRATION EMAIL OTP - VERIFY OTP
    // =====================================================

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyRegistrationOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String otp = request.get("otp");

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            if (otp == null || otp.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "OTP is required")
                );
            }

            email = email.trim().toLowerCase();
            otp = otp.trim();

            boolean verified = otpService.verifyOtp(email, otp);

            if (!verified) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Invalid or expired OTP")
                );
            }

            return ResponseEntity.ok(
                    Map.of("message", "Email verified successfully")
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "OTP verification failed")
            );
        }
    }

    // =====================================================
    // REGISTER USER ONLY AFTER EMAIL OTP VERIFIED
    // =====================================================

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Username is required")
                );
            }

            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Password is required")
                );
            }

            if (user.getRole() == null || user.getRole().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Role is required")
                );
            }

            String username = user.getUsername().trim();
            String email = user.getEmail().trim().toLowerCase();

            user.setUsername(username);
            user.setEmail(email);

            if (repo.existsByUsername(username)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Username already exists")
                );
            }

            if (repo.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email already exists")
                );
            }

            if (!otpService.isEmailVerified(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Please verify your email OTP before registration")
                );
            }

            user.setPassword(encoder.encode(user.getPassword()));
            user.setLoginStatus(0);
            user.setLastActivityTime(null);

            User savedUser = repo.save(user);

            otpService.clearOtp(email);

            return ResponseEntity.status(201).body(savedUser);

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "Registration failed")
            );
        }
    }

    // =====================================================
    // NORMAL LOGIN
    // =====================================================

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

            if (user.getLoginStatus() != null && user.getLoginStatus() == 1) {
                LocalDateTime lastActivity = user.getLastActivityTime();

                if (lastActivity != null) {
                    long inactiveMinutes =
                            Duration.between(lastActivity, LocalDateTime.now()).toMinutes();

                    if (inactiveMinutes < SESSION_TIMEOUT_MINUTES) {
                        return ResponseEntity.status(409).body("User already logged in");
                    }
                }
            }

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

    // =====================================================
    // OPTIONAL LOGIN OTP - REQUEST OTP
    // =====================================================

    @PostMapping("/login/request-otp")
    public ResponseEntity<?> requestLoginOtp(@RequestBody LoginOtpRequest req) {
        try {
            Optional<User> optional = repo.findByUsername(req.getUsername());

            if (optional.isEmpty()) {
                return ResponseEntity.status(401).body(
                        Map.of("message", "Invalid Username or Password.")
                );
            }

            User user = optional.get();

            if (!encoder.matches(req.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401).body(
                        Map.of("message", "Invalid Username or Password.")
                );
            }

            String otp = loginOtpService.createOtp(user.getUsername());

            emailService.sendLoginOtpEmail(
                    user.getEmail(),
                    user.getUsername(),
                    otp
            );

            return ResponseEntity.ok(
                    Map.of("message", "OTP_SENT")
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "Failed to send OTP. Please try again.")
            );
        }
    }

    // =====================================================
    // OPTIONAL LOGIN OTP - VERIFY OTP AND ISSUE JWT
    // =====================================================

    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> verifyLoginOtp(@RequestBody VerifyLoginOtpRequest req) {
        try {
            boolean ok = loginOtpService.verifyOtp(req.getUsername(), req.getOtp());

            if (!ok) {
                return ResponseEntity.status(401).body(
                        Map.of("message", "Invalid/Expired OTP")
                );
            }

            User user = repo.findByUsername(req.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (user.getLoginStatus() != null && user.getLoginStatus() == 1) {
                LocalDateTime lastActivity = user.getLastActivityTime();

                if (lastActivity != null) {
                    long inactiveMinutes =
                            Duration.between(lastActivity, LocalDateTime.now()).toMinutes();

                    if (inactiveMinutes < SESSION_TIMEOUT_MINUTES) {
                        return ResponseEntity.status(409).body(
                                Map.of("message", "User already logged in")
                        );
                    }
                }
            }

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

            return ResponseEntity.status(500).body(
                    Map.of("message", "OTP verification failed")
            );
        }
    }

    // =====================================================
    // LOGOUT USER
    // =====================================================

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

    // =====================================================
    // UPDATE ACTIVITY / HEARTBEAT
    // =====================================================

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


