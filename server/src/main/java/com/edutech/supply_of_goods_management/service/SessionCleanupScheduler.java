package com.edutech.supply_of_goods_management.service;

import com.edutech.supply_of_goods_management.entity.User;
import com.edutech.supply_of_goods_management.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SessionCleanupScheduler {

    private static final long SESSION_TIMEOUT_MINUTES = 1;

    @Autowired
    private UserRepository userRepository;

    @Scheduled(fixedRate = 30000)
    public void cleanupExpiredSessions() {

        List<User> users = userRepository.findAll();

        for (User user : users) {

            if (user.getLoginStatus() != null
                    && user.getLoginStatus() == 1
                    && user.getLastActivityTime() != null) {

                long inactiveMinutes =
                        Duration.between(user.getLastActivityTime(), LocalDateTime.now()).toMinutes();

                if (inactiveMinutes >= SESSION_TIMEOUT_MINUTES) {
                    user.setLoginStatus(0);
                    user.setLastActivityTime(null);
                    userRepository.save(user);

                    System.out.println("Expired session cleared for user: " + user.getUsername());
                }
            }
        }
    }
}