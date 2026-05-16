package com.edutech.supply_of_goods_management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 1;

    @Autowired
    private SendGridEmailService emailService;

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    public void sendOtp(String email) {

        String normalizedEmail = normalizeEmail(email);

        String otp = generateOtp();

        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        OtpData otpData = new OtpData(otp, expiryTime, false);

        otpStore.put(normalizedEmail, otpData);

        emailService.sendOtpEmail(normalizedEmail, otp);
    }

    public boolean verifyOtp(String email, String otp) {

        String normalizedEmail = normalizeEmail(email);

        OtpData otpData = otpStore.get(normalizedEmail);

        if (otpData == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(otpData.getExpiryTime())) {
            otpStore.remove(normalizedEmail);
            return false;
        }

        if (!otpData.getOtp().equals(otp)) {
            return false;
        }

        otpData.setVerified(true);
        otpStore.put(normalizedEmail, otpData);

        return true;
    }

    public boolean isEmailVerified(String email) {

        String normalizedEmail = normalizeEmail(email);

        OtpData otpData = otpStore.get(normalizedEmail);

        if (otpData == null) {
            return false;
        }

        if (LocalDateTime.now().isAfter(otpData.getExpiryTime())) {
            otpStore.remove(normalizedEmail);
            return false;
        }

        return otpData.isVerified();
    }

    public void clearOtp(String email) {
        otpStore.remove(normalizeEmail(email));
    }

    private String generateOtp() {
        Random random = new Random();
        int number = 100000 + random.nextInt(900000);
        return String.valueOf(number);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static class OtpData {

        private String otp;
        private LocalDateTime expiryTime;
        private boolean verified;

        public OtpData(String otp, LocalDateTime expiryTime, boolean verified) {
            this.otp = otp;
            this.expiryTime = expiryTime;
            this.verified = verified;
        }

        public String getOtp() {
            return otp;
        }

        public LocalDateTime getExpiryTime() {
            return expiryTime;
        }

        public boolean isVerified() {
            return verified;
        }

        public void setVerified(boolean verified) {
            this.verified = verified;
        }
    }
}