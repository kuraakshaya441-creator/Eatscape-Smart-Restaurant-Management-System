package com.smartrestaurant.backend.service;

import com.smartrestaurant.backend.entity.Food;
import com.smartrestaurant.backend.repository.FoodRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodService {

    private final FoodRepository foodRepository;

    public FoodService(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    public Food addFood(Food food) {
        if (food.getStockQuantity() < 0) {
            throw new RuntimeException("Stock quantity cannot be negative");
        }

        food.setAvailable(food.getStockQuantity() > 0);
        return foodRepository.save(food);
    }

    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    public Food getFoodById(Long id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found"));
    }

    public Food updateFood(Long id, Food foodDetails) {

        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found"));

        food.setName(foodDetails.getName());
        food.setDescription(foodDetails.getDescription());
        food.setPrice(foodDetails.getPrice());
        food.setCategory(foodDetails.getCategory());
        food.setAvailable(foodDetails.isAvailable());

        return foodRepository.save(food);
    }

    public Food updateStock(Long id, int quantity) {

        if (quantity < 0) {
            throw new RuntimeException("Stock quantity cannot be negative");
        }

        Food food = foodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food not found"));

        food.setStockQuantity(quantity);
        food.setAvailable(quantity > 0);

        return foodRepository.save(food);
    }

    public void deleteFood(Long id) {
        foodRepository.deleteById(id);
    }
}