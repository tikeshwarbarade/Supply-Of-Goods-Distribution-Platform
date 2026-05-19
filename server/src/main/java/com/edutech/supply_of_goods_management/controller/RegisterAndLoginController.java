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
import java.util.ArrayList;
import java.util.List;
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
            String email = normalizeEmail(request.get("email"));

            if (email.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            if (!isValidEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Please enter a valid email address")
                );
            }

            if (repo.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email already exists. Please login or use another email.")
                );
            }

            otpService.sendOtp(email);

            return ResponseEntity.ok(
                    Map.of(
                            "message", "OTP sent successfully. Please check your email.",
                            "email", email
                    )
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "Failed to send OTP. Please try again.")
            );
        }
    }

    // =====================================================
    // REGISTRATION EMAIL OTP - VERIFY OTP
    // =====================================================

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyRegistrationOtp(@RequestBody Map<String, String> request) {
        try {
            String email = normalizeEmail(request.get("email"));
            String otp = normalizeText(request.get("otp"));

            if (email.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            if (otp.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "OTP is required")
                );
            }

            otpService.verifyOtp(email, otp);

            return ResponseEntity.ok(
                    Map.of(
                            "message", "Email verified successfully",
                            "email", email
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "OTP verification failed. Please try again.")
            );
        }
    }

    // =====================================================
    // REGISTER USER ONLY AFTER EMAIL OTP VERIFIED
    // =====================================================

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            if (user.getFirstName() == null || user.getFirstName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "First name is required")
                );
            }

            if (user.getLastName() == null || user.getLastName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Last name is required")
                );
            }

            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Username is required")
                );
            }

            if (user.getUsername().trim().length() < 4) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Username must be at least 4 characters")
                );
            }

            if (!user.getUsername().trim().matches("^[a-zA-Z0-9_]+$")) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Username can contain only letters, numbers, and underscore")
                );
            }

            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            if (!isValidEmail(user.getEmail().trim())) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Please enter a valid email address")
                );
            }

            if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
                if (!user.getPhone().trim().matches("^[0-9]{10}$")) {
                    return ResponseEntity.badRequest().body(
                            Map.of("message", "Phone number must be exactly 10 digits")
                    );
                }
            }

            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Password is required")
                );
            }

            if (user.getPassword().trim().length() < 8) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Password must be at least 8 characters")
                );
            }

            if (user.getRole() == null || user.getRole().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Role is required")
                );
            }

            String username = user.getUsername().trim();
            String email = normalizeEmail(user.getEmail());
            String role = user.getRole().trim().toUpperCase();

            if (!role.equals("MANUFACTURER")
                    && !role.equals("WHOLESALER")
                    && !role.equals("CONSUMER")) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Invalid role selected")
                );
            }

            user.setFirstName(user.getFirstName().trim());
            user.setLastName(user.getLastName().trim());
            user.setUsername(username);
            user.setEmail(email);
            user.setRole(role);

            if (user.getPhone() != null) {
                user.setPhone(user.getPhone().trim());
            }

            if (repo.existsByUsername(username)) {
                return ResponseEntity.badRequest().body(
                        Map.of(
                                "message", "Username already exists",
                                "suggestions", generateUsernameSuggestions(username)
                        )
                );
            }

            if (repo.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email already exists. Please login or use another email.")
                );
            }

            boolean emailVerified = otpService.isEmailVerified(email);

            if (!emailVerified) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Please verify your email OTP before registration")
                );
            }

            user.setPassword(encoder.encode(user.getPassword()));
            user.setLoginStatus(0);
            user.setLastActivityTime(null);

            User savedUser = repo.save(user);

            otpService.clearOtp(email);

            try {
                emailService.sendRegistrationEmail(savedUser.getEmail(), savedUser.getUsername());
            } catch (Exception ignored) {
                // Registration should not fail if welcome email fails.
            }

            return ResponseEntity.status(201).body(
                    Map.of(
                            "userId", savedUser.getId(),
                            "firstName", savedUser.getFirstName(),
                            "lastName", savedUser.getLastName(),
                            "username", savedUser.getUsername(),
                            "email", savedUser.getEmail(),
                            "role", savedUser.getRole(),
                            "message", "Registration successful"
                    )
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "Registration failed. Please try again.")
            );
        }
    }

    // =====================================================
    // NORMAL LOGIN
    // =====================================================

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            if (req.getUsername() == null || req.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Username is required")
                );
            }

            if (req.getPassword() == null || req.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Password is required")
                );
            }

            Optional<User> optional = repo.findByUsername(req.getUsername().trim());

            if (optional.isEmpty()) {
                return ResponseEntity.status(401).body(
                        Map.of("message", "User not found")
                );
            }

            User user = optional.get();

            if (!encoder.matches(req.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401).body(
                        Map.of("message", "Invalid password")
                );
            }

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

            return ResponseEntity.ok(
                    Map.of(
                            "userId", user.getId(),
                            "token", token,
                            "username", user.getUsername(),
                            "email", user.getEmail(),
                            "role", user.getRole()
                    )
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "Internal Server Error")
            );
        }
    }

    // =====================================================
    // LOGIN OTP - REQUEST OTP
    // =====================================================

    @PostMapping("/login/request-otp")
    public ResponseEntity<?> requestLoginOtp(@RequestBody LoginOtpRequest req) {
        try {
            if (req.getUsername() == null || req.getUsername().trim().isEmpty()
                    || req.getPassword() == null || req.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Username and password are required.")
                );
            }

            Optional<User> optional = repo.findByUsername(req.getUsername().trim());

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
    // LOGIN OTP - VERIFY OTP AND ISSUE JWT
    // =====================================================

    @PostMapping("/login/verify-otp")
    public ResponseEntity<?> verifyLoginOtp(@RequestBody VerifyLoginOtpRequest req) {
        try {
            if (req.getUsername() == null || req.getUsername().trim().isEmpty()
                    || req.getOtp() == null || req.getOtp().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Username and OTP are required.")
                );
            }

            boolean ok = loginOtpService.verifyOtp(req.getUsername().trim(), req.getOtp().trim());

            if (!ok) {
                return ResponseEntity.status(401).body(
                        Map.of("message", "Invalid/Expired OTP")
                );
            }

            User user = repo.findByUsername(req.getUsername().trim())
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
    // FORGOT PASSWORD - SEND OTP
    // =====================================================

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> forgotPasswordSendOtp(@RequestBody Map<String, String> request) {
        try {
            String email = normalizeEmail(request.get("email"));

            if (email.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            if (!isValidEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Please enter a valid email address")
                );
            }

            if (!repo.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "No account found with this email")
                );
            }

            otpService.sendOtp(email);

            return ResponseEntity.ok(
                    Map.of(
                            "message", "OTP sent successfully to your email",
                            "email", email
                    )
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "Failed to send OTP")
            );
        }
    }

    // =====================================================
    // FORGOT PASSWORD - VERIFY OTP
    // =====================================================

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> forgotPasswordVerifyOtp(@RequestBody Map<String, String> request) {
        try {
            String email = normalizeEmail(request.get("email"));
            String otp = normalizeText(request.get("otp"));

            if (email.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            if (otp.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "OTP is required")
                );
            }

            if (!repo.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "No account found with this email")
                );
            }

            otpService.verifyOtp(email, otp);

            return ResponseEntity.ok(
                    Map.of(
                            "message", "OTP verified successfully",
                            "email", email
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", e.getMessage())
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "OTP verification failed")
            );
        }
    }

    // =====================================================
    // FORGOT PASSWORD - RESET PASSWORD
    // =====================================================

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = normalizeEmail(request.get("email"));
            String newPassword = normalizeText(request.get("newPassword"));

            if (email.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Email is required")
                );
            }

            if (!isValidEmail(email)) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Please enter a valid email address")
                );
            }

            if (newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "New password is required")
                );
            }

            if (newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "New password must be at least 8 characters")
                );
            }

            Optional<User> optional = repo.findByEmail(email);

            if (optional.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "No account found with this email")
                );
            }

            // ✅ Security check: password reset allowed only after forgot-password OTP verification
            boolean emailVerified = otpService.isEmailVerified(email);

            if (!emailVerified) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Please verify OTP before resetting password")
                );
            }

            User user = optional.get();

            if (encoder.matches(newPassword, user.getPassword())) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "New password cannot be same as old password")
                );
            }

            user.setPassword(encoder.encode(newPassword));
            user.setLoginStatus(0);
            user.setLastActivityTime(null);

            repo.save(user);

            otpService.clearOtp(email);

            try {
                emailService.sendPasswordResetConfirmationEmail(email, user.getUsername());
            } catch (Exception ignored) {
                // Password reset should not fail if confirmation email fails.
            }

            return ResponseEntity.ok(
                    Map.of("message", "Password reset successful")
            );

        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.status(500).body(
                    Map.of("message", "Password reset failed")
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
            return ResponseEntity.status(404).body(
                    Map.of("message", "User not found")
            );
        }

        User user = optional.get();

        user.setLoginStatus(0);
        user.setLastActivityTime(null);

        repo.save(user);

        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully")
        );
    }

    // =====================================================
    // UPDATE ACTIVITY / HEARTBEAT
    // =====================================================

    @PostMapping("/activity")
    public ResponseEntity<?> updateActivity(@RequestParam Long userId) {
        Optional<User> optional = repo.findById(userId);

        if (optional.isEmpty()) {
            return ResponseEntity.status(404).body(
                    Map.of("message", "User not found")
            );
        }

        User user = optional.get();

        if (user.getLoginStatus() != null && user.getLoginStatus() == 1) {
            user.setLastActivityTime(LocalDateTime.now());
            repo.save(user);
        }

        return ResponseEntity.ok(
                Map.of("message", "Activity updated")
        );
    }

    // =====================================================
    // USERNAME SUGGESTION
    // =====================================================

    @GetMapping("/suggest-username")
    public ResponseEntity<?> suggest(@RequestParam String username) {
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Username is required")
            );
        }

        return ResponseEntity.ok(
                Map.of("suggestions", generateUsernameSuggestions(username.trim()))
        );
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private List<String> generateUsernameSuggestions(String username) {
        List<String> suggestions = new ArrayList<>();

        String base = username.replaceAll("[^a-zA-Z0-9_]", "");

        if (base.length() < 4) {
            base = "user" + base;
        }

        int counter = 1;

        while (suggestions.size() < 3) {
            String suggestion = base + counter;

            if (!repo.existsByUsername(suggestion)) {
                suggestions.add(suggestion);
            }

            counter++;
        }

        return suggestions;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isValidEmail(String email) {
        return email != null
                && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    }
}