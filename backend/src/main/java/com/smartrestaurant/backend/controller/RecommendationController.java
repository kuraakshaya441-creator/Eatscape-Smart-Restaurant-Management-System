
package com.smartrestaurant.backend.controller;

import com.smartrestaurant.backend.entity.Food;
import com.smartrestaurant.backend.service.RecommendationService;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(
            RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    // General recommendations for visitors
    @GetMapping
    public List<Food> getRecommendations() {
        return recommendationService.getRecommendations();
    }

    // Personalized recommendations for the logged-in customer
    @GetMapping("/personalized")
    public List<Food> getPersonalizedRecommendations(
            Authentication authentication) {

        return recommendationService
                .getRecommendationsForCustomer(authentication.getName());
    }
}
