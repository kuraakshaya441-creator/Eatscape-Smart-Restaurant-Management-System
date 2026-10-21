
package com.smartrestaurant.backend.dto;

public class AuthResponse {

    private String token;
    private String tokenType;
    private Long id;
    private String name;
    private String email;
    private String role;

    public AuthResponse(
            String token,
            Long id,
            String name,
            String email,
            String role) {
        this.token = token;
        this.tokenType = "Bearer";
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
}
