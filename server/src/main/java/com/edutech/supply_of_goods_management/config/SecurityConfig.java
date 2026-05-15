package com.edutech.supply_of_goods_management.config;

import com.edutech.supply_of_goods_management.jwt.JwtRequestFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtRequestFilter jwtRequestFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors()
            .and()
            .csrf().disable()

            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()

            .authorizeRequests()

            // CORS preflight
            .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // Public auth APIs
            .antMatchers("/api/user/**").permitAll()

         .antMatchers(HttpMethod.POST, "/api/manufacturers/product").hasAuthority("MANUFACTURER")
.antMatchers(HttpMethod.PUT, "/api/manufacturers/product/**").hasAuthority("MANUFACTURER")
.antMatchers(HttpMethod.GET, "/api/manufacturers/products").hasAuthority("MANUFACTURER")
.antMatchers(HttpMethod.GET, "/api/manufacturers/orders").hasAuthority("MANUFACTURER")
.antMatchers(HttpMethod.PUT, "/api/manufacturers/order/**").hasAuthority("MANUFACTURER")
            // Wholesaler APIs
            .antMatchers(HttpMethod.GET, "/api/wholesalers/products").hasAuthority("WHOLESALER")
            .antMatchers(HttpMethod.POST, "/api/wholesalers/order").hasAuthority("WHOLESALER")
            .antMatchers(HttpMethod.PUT, "/api/wholesalers/order/**").hasAuthority("WHOLESALER")
            .antMatchers(HttpMethod.GET, "/api/wholesalers/orders").hasAuthority("WHOLESALER")
            .antMatchers(HttpMethod.POST, "/api/wholesalers/inventories").hasAuthority("WHOLESALER")
            .antMatchers(HttpMethod.PUT, "/api/wholesalers/inventories/**").hasAuthority("WHOLESALER")
            .antMatchers(HttpMethod.GET, "/api/wholesalers/inventories").hasAuthority("WHOLESALER")

            // Consumer APIs
            .antMatchers(HttpMethod.GET, "/api/consumers/inventories").hasAuthority("CONSUMER")
.antMatchers(HttpMethod.POST, "/api/consumers/inventory-order").hasAuthority("CONSUMER")

.antMatchers(HttpMethod.GET, "/api/wholesalers/customer-orders").hasAuthority("WHOLESALER")
.antMatchers(HttpMethod.PUT, "/api/wholesalers/customer-order/**").hasAuthority("WHOLESALER")
.antMatchers(HttpMethod.GET, "/api/wholesalers/feedbacks").hasAuthority("WHOLESALER")
            .antMatchers(HttpMethod.GET, "/api/consumers/products").hasAuthority("CONSUMER")
            .antMatchers(HttpMethod.POST, "/api/consumers/order").hasAuthority("CONSUMER")
            .antMatchers(HttpMethod.GET, "/api/consumers/orders").hasAuthority("CONSUMER")
            .antMatchers(HttpMethod.POST, "/api/consumers/order/**/feedback").hasAuthority("CONSUMER")

            .anyRequest().authenticated();

        // ✅ THIS WAS MISSING
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}