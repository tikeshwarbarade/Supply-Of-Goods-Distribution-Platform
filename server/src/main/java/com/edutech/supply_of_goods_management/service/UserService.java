package com.edutech.supply_of_goods_management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.edutech.supply_of_goods_management.entity.User;
import com.edutech.supply_of_goods_management.repository.UserRepository;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository repo;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private SendGridEmailService emailService;

    public User registerUser(User user) {

        // ✅ Encode password before saving
        user.setPassword(encoder.encode(user.getPassword()));

        // ✅ Save user in DB
        User savedUser = repo.save(user);

        // ✅ Send welcome email after registration
        // ✅ If email fails, registration should NOT fail
        try {
            emailService.sendRegistrationEmail(
                    savedUser.getEmail(),
                    savedUser.getUsername()
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

        return savedUser;
    }

    public User getUserByUsername(String username) {
        return repo.findByUsername(username).orElseThrow();
    }

    @Override
    public UserDetails loadUserByUsername(String username) {

        User u = repo.findByUsername(username).orElseThrow();

        return new org.springframework.security.core.userdetails.User(
                u.getUsername(),
                u.getPassword(),
                AuthorityUtils.createAuthorityList(u.getRole())
        );
    }
}