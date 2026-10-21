package com.smartrestaurant.backend.security;

import com.smartrestaurant.backend.entity.User;
import com.smartrestaurant.backend.repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        System.out.println("JWT FILTER RUNNING");
        System.out.println("Request path: " + request.getRequestURI());
        System.out.println("Authorization header received: "
                + (header != null));

        if (header == null) {
            System.out.println("No Authorization header found.");
            filterChain.doFilter(request, response);
            return;
        }

        if (!header.startsWith("Bearer ")) {
            System.out.println("Authorization header is not Bearer format.");
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        System.out.println("Bearer token extracted.");

        boolean tokenValid = jwtService.isTokenValid(token);

        System.out.println("JWT token valid: " + tokenValid);

        if (!tokenValid) {
            System.out.println("Token is invalid or expired.");
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {

            String email = jwtService.extractEmail(token);

            System.out.println("Email extracted from token.");

            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) {
                System.out.println("User not found in database.");
            } else {
                System.out.println("User found in database.");
                System.out.println("User role: " + user.getRole());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user.getEmail(),
                                null,
                                List.of(new SimpleGrantedAuthority(
                                        "ROLE_" + user.getRole())));

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request));

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);

                System.out.println("User authenticated successfully.");
            }
        }

        filterChain.doFilter(request, response);
    }
}
