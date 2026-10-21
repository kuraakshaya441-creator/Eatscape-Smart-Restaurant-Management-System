package com.smartrestaurant.backend.service;

import com.smartrestaurant.backend.entity.CustomerOrder;
import com.smartrestaurant.backend.entity.Food;
import com.smartrestaurant.backend.entity.OrderItem;
import com.smartrestaurant.backend.repository.CustomerOrderRepository;
import com.smartrestaurant.backend.repository.FoodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;

@Service
public class RecommendationService {

    private final FoodRepository foodRepository;
    private final CustomerOrderRepository orderRepository;

    public RecommendationService(
            FoodRepository foodRepository,
            CustomerOrderRepository orderRepository) {
        this.foodRepository = foodRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public List<Food> getRecommendations() {
        return getRecommendationsForCustomer(null);
    }

    @Transactional(readOnly = true)
    public List<Food> getRecommendationsForCustomer(
            String customerEmail) {

        List<Food> availableFoods =
                foodRepository
                        .findByAvailableTrueAndStockQuantityGreaterThan(0);

        List<CustomerOrder> orders = orderRepository.findAll();
        List<Food> allFoods = foodRepository.findAll();

        Map<Long, Food> foodMap = new HashMap<>();
        Map<Long, Integer> popularity = new HashMap<>();
        Map<String, Integer> preferredCategories = new HashMap<>();
        Set<Long> orderedFoodIds = new HashSet<>();

        for (Food food : allFoods) {
            foodMap.put(food.getId(), food);
        }

        for (CustomerOrder order : orders) {

            boolean isCustomerOrder =
                    customerEmail != null
                    && order.getCustomerEmail() != null
                    && customerEmail.equalsIgnoreCase(
                            order.getCustomerEmail());

            for (OrderItem item : order.getItems()) {

                Long foodId = item.getFoodId();

                if (foodId == null) {
                    continue;
                }
                if (isCustomerOrder) {
    orderedFoodIds.add(foodId);
}

                popularity.merge(
                        foodId,
                        item.getQuantity(),
                        Integer::sum);

                if (isCustomerOrder) {
                    Food orderedFood = foodMap.get(foodId);

                    if (orderedFood != null
                            && orderedFood.getCategory() != null) {

                        preferredCategories.merge(
                                orderedFood.getCategory(),
                                item.getQuantity(),
                                Integer::sum);
                    }
                }
            }
        }

        return availableFoods.stream()
                .sorted(
                        Comparator.comparingInt((Food food) -> {
                            int popularityScore =
                                    popularity.getOrDefault(
                                            food.getId(), 0);

                            int personalScore = 0;

                            if (customerEmail != null
                                    && food.getCategory() != null) {
                                personalScore =
                                        preferredCategories.getOrDefault(
                                                food.getCategory(), 0);
                            }

                            int newFoodBonus = 0;

if (customerEmail != null
        && !orderedFoodIds.contains(food.getId())) {
    newFoodBonus = 1000;
}

return newFoodBonus
        + personalScore * 3
        + popularityScore;
                        }).reversed()
                        .thenComparing(Food::getName))
                .limit(4)
                .toList();
    }
}
