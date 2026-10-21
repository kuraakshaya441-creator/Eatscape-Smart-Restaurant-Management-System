
package com.smartrestaurant.backend.controller;

import com.smartrestaurant.backend.dto.AuthResponse;
import com.smartrestaurant.backend.dto.LoginRequest;
import com.smartrestaurant.backend.dto.RegisterRequest;
import com.smartrestaurant.backend.dto.UserResponse;
import com.smartrestaurant.backend.entity.User;
import com.smartrestaurant.backend.security.JwtService;
import com.smartrestaurant.backend.service.UserService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin
public class UserController {

    private final UserService userService;
    private final JwtService jwtService;

    public UserController(
            UserService userService,
            JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public UserResponse registerUser(
            @RequestBody RegisterRequest request) {

        User user = userService.registerUser(request);
        return toResponse(user);
    }

    @PostMapping("/login")
    public AuthResponse loginUser(
            @RequestBody LoginRequest request) {

        User user = userService.loginUser(request);

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole());
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole());
    }
}
