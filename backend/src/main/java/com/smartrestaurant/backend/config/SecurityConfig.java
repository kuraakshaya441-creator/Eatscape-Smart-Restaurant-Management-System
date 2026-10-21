
package com.smartrestaurant.backend.config;

import com.smartrestaurant.backend.repository.UserRepository;
import com.smartrestaurant.backend.security.JwtAuthenticationFilter;
import com.smartrestaurant.backend.security.JwtService;

import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter(
            JwtService jwtService,
            UserRepository userRepository) {

        return new JwtAuthenticationFilter(jwtService, userRepository);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://127.0.0.1:5500",
                "http://localhost:5500"
        ));

        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
                "Authorization", "Content-Type"
        ));

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {

        http
            .cors(cors ->
                cors.configurationSource(corsConfigurationSource()))

            .csrf(csrf -> csrf.disable())

            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())

            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, exception) ->
                    response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED)))

            .authorizeHttpRequests(auth -> auth

                // Allow browser preflight requests
                .requestMatchers(
                    HttpMethod.OPTIONS, "/**"
                ).permitAll()

                // Public registration and login
                .requestMatchers(
                    "/api/users/register",
                    "/api/users/login"
                ).permitAll()

                // General recommendations are public
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/recommendations"
                ).permitAll()

                // Personalized recommendations require login
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/recommendations/personalized"
                ).authenticated()

                // Public food menu
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/foods",
                    "/api/foods/**"
                ).permitAll()

                // Only admins can add food
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/foods",
                    "/api/foods/**"
                ).hasRole("ADMIN")

                // Only admins can update food
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/foods",
                    "/api/foods/**"
                ).hasRole("ADMIN")

                // Only admins can delete food
                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/foods",
                    "/api/foods/**"
                ).hasRole("ADMIN")

                // Only admins can update order status
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/orders/*/status"
                ).hasRole("ADMIN")

                // Only admins can view all orders
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/orders"
                ).hasRole("ADMIN")

                // All remaining endpoints require authentication
                .anyRequest().authenticated()
            )

            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
