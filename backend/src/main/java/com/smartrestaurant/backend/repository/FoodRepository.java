
package com.smartrestaurant.backend.repository;

import com.smartrestaurant.backend.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoodRepository extends JpaRepository<Food, Long> {

    List<Food> findByAvailableTrueAndStockQuantityGreaterThan(int stockQuantity);
}
