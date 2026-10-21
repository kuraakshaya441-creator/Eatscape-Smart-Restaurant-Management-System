package com.smartrestaurant.backend.controller;

import com.smartrestaurant.backend.dto.StockRequest;
import com.smartrestaurant.backend.entity.Food;
import com.smartrestaurant.backend.service.FoodService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
@CrossOrigin
public class FoodController {

    private final FoodService foodService;

    public FoodController(FoodService foodService) {
        this.foodService = foodService;
    }

    @PostMapping
    public Food addFood(@RequestBody Food food) {
        return foodService.addFood(food);
    }

    @GetMapping
    public List<Food> getAllFoods() {
        return foodService.getAllFoods();
    }

    @GetMapping("/{id}")
    public Food getFoodById(@PathVariable Long id) {
        return foodService.getFoodById(id);
    }

    @PutMapping("/{id}")
    public Food updateFood(@PathVariable Long id, @RequestBody Food food) {
        return foodService.updateFood(id, food);
    }

    @PutMapping("/{id}/stock")
    public Food updateStock(
            @PathVariable Long id,
            @RequestBody StockRequest request) {
        return foodService.updateStock(id, request.getStockQuantity());
    }

    @DeleteMapping("/{id}")
    public String deleteFood(@PathVariable Long id) {
        foodService.deleteFood(id);
        return "Food deleted successfully";
    }
}
