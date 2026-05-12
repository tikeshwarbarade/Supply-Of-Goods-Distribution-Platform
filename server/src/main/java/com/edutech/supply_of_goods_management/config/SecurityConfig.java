package com.edutech.supply_of_goods_management.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.edutech.supply_of_goods_management.jwt.JwtRequestFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http.csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/user/**").permitAll()
            .antMatchers("/api/manufacturers/**").hasAuthority("MANUFACTURER")
            .antMatchers("/api/wholesalers/**").hasAuthority("WHOLESALER")
            .antMatchers("/api/consumers/**").hasAuthority("CONSUMER")
            .and()
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS);

        return http.build();
    }
}

// public class SecurityConfig  {

//     // Implement security configuration here
//     // /api/user/register and /api/user/login should be permitted to all
//     // /api/manufacturers/product should be permitted to MANUFACTURER
//     // /api/manufacturers/product/{id} should be permitted to MANUFACTURER
//     // /api/manufacturers/products should be permitted to MANUFACTURER
//     // /api/wholesalers/products should be permitted to WHOLESALER
//     // /api/wholesalers/order should be permitted to WHOLESALER
//     // /api/wholesalers/order/{id} should be permitted to WHOLESALER
//     // /api/wholesalers/orders should be permitted to WHOLESALER
//     // /api/wholesalers/inventories should be permitted to WHOLESALER (POST)
//     // /api/wholesalers/inventories/{id} should be permitted to WHOLESALER
//     // /api/wholesalers/inventories should be permitted to WHOLESALER (GET)
//     // /api/consumers/products should be permitted to CONSUMER
//     // /api/consumers/order should be permitted to CONSUMER
//     // /api/consumers/orders should be permitted to CONSUMER
//     // /api/consumers/order/{orderId}/feedback should be permitted to CONSUMER

//     // Note: Use hasAuthority method to check the role of the user
//     // for example, hasAuthority("CONSUMER")
// }