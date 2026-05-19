package com.edutech.supply_of_goods_management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int EMAIL_VERIFICATION_EXPIRY_MINUTES = 15;
    private static final int MAX_ATTEMPTS = 3;

    private final SecureRandom random = new SecureRandom();

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> verifiedEmailStore = new ConcurrentHashMap<>();

    @Autowired
    private SendGridEmailService emailService;

    // =====================================================
    // SEND OTP
    // =====================================================

    public void sendOtp(String email) {
        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        String otp = generateOtp();
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        OtpData otpData = new OtpData(otp, expiryTime);

        /*
         * Important:
         * When a new OTP is requested, previous verified state must be removed.
         * This prevents using an old verified state after requesting a new OTP.
         */
        verifiedEmailStore.remove(normalizedEmail);
        otpStore.put(normalizedEmail, otpData);

        try {
            emailService.sendOtpEmail(normalizedEmail, otp);
        } catch (RuntimeException e) {
            /*
             * If email sending fails, remove stored OTP.
             * Otherwise user could verify an OTP that was never delivered.
             */
            otpStore.remove(normalizedEmail);
            verifiedEmailStore.remove(normalizedEmail);
            throw e;
        }
    }

    // =====================================================
    // VERIFY OTP
    // =====================================================

    public boolean verifyOtp(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        String normalizedOtp = normalizeOtp(otp);

        if (normalizedEmail.isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }

        if (normalizedOtp.isEmpty()) {
            throw new IllegalArgumentException("OTP is required");
        }

        OtpData otpData = otpStore.get(normalizedEmail);

        if (otpData == null) {
            throw new IllegalArgumentException("No OTP found. Please request a new OTP.");
        }

        if (LocalDateTime.now().isAfter(otpData.getExpiryTime())) {
            otpStore.remove(normalizedEmail);
            verifiedEmailStore.remove(normalizedEmail);
            throw new IllegalArgumentException("OTP expired. Please request a new OTP.");
        }

        if (otpData.getAttempts() >= MAX_ATTEMPTS) {
            otpStore.remove(normalizedEmail);
            verifiedEmailStore.remove(normalizedEmail);
            throw new IllegalArgumentException("Maximum OTP attempts exceeded. Please request a new OTP.");
        }

        if (!otpData.getOtp().equals(normalizedOtp)) {
            otpData.incrementAttempts();

            int attemptsLeft = MAX_ATTEMPTS - otpData.getAttempts();

            if (attemptsLeft <= 0) {
                otpStore.remove(normalizedEmail);
                verifiedEmailStore.remove(normalizedEmail);
                throw new IllegalArgumentException("Maximum OTP attempts exceeded. Please request a new OTP.");
            }

            throw new IllegalArgumentException("Invalid OTP. Attempts left: " + attemptsLeft);
        }

        otpData.setVerified(true);

        verifiedEmailStore.put(
                normalizedEmail,
                LocalDateTime.now().plusMinutes(EMAIL_VERIFICATION_EXPIRY_MINUTES)
        );

        return true;
    }

    // =====================================================
    // CHECK EMAIL VERIFIED
    // =====================================================

    public boolean isEmailVerified(String email) {
        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.isEmpty()) {
            return false;
        }

        LocalDateTime verifiedUntil = verifiedEmailStore.get(normalizedEmail);

        if (verifiedUntil == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(verifiedUntil)) {
            otpStore.remove(normalizedEmail);
            verifiedEmailStore.remove(normalizedEmail);
            return false;
        }

        return true;
    }

    // =====================================================
    // CLEAR OTP
    // =====================================================

    public void clearOtp(String email) {
        String normalizedEmail = normalizeEmail(email);

        otpStore.remove(normalizedEmail);
        verifiedEmailStore.remove(normalizedEmail);
    }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================

    private String generateOtp() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String normalizeOtp(String otp) {
        if (otp == null) {
            return "";
        }

        return otp.trim().replaceAll("\\s+", "");
    }

    // =====================================================
    // OTP STORAGE MODEL
    // =====================================================

    private static class OtpData {

        private final String otp;
        private final LocalDateTime expiryTime;
        private boolean verified;
        private int attempts;

        private OtpData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.verified = false;
            this.attempts = 0;
        }

        private String getOtp() {
            return otp;
        }

        private LocalDateTime getExpiryTime() {
            return expiryTime;
        }

        private int getAttempts() {
            return attempts;
        }

        private void incrementAttempts() {
            this.attempts++;
        }

        private void setVerified(boolean verified) {
            this.verified = verified;
        }
    }
}