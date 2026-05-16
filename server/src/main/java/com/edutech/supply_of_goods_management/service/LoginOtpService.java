package com.edutech.supply_of_goods_management.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class LoginOtpService {

    private static class OtpEntry {
        String otp;
        Instant expiresAt;
        OtpEntry(String otp, Instant expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
    }

    private final SecureRandom random = new SecureRandom();
    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();

    private final long expirySeconds = 300; // 5 minutes

    public String createOtp(String username) {
        String otp = String.format("%06d", random.nextInt(1000000));
        store.put(username, new OtpEntry(otp, Instant.now().plusSeconds(expirySeconds)));
        return otp;
    }

    public boolean verifyOtp(String username, String otp) {
        OtpEntry entry = store.get(username);
        if (entry == null) return false;

        if (Instant.now().isAfter(entry.expiresAt)) {
            store.remove(username);
            return false;
        }

        boolean ok = entry.otp.equals(otp);
        if (ok) store.remove(username);
        return ok;
    }
}