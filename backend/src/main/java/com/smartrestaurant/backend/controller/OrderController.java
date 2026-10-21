
package com.smartrestaurant.backend.controller;

import com.smartrestaurant.backend.entity.CustomerOrder;
import com.smartrestaurant.backend.entity.Food;
import com.smartrestaurant.backend.entity.OrderItem;
import com.smartrestaurant.backend.repository.CustomerOrderRepository;
import com.smartrestaurant.backend.repository.FoodRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {

    private final CustomerOrderRepository orderRepository;
    private final FoodRepository foodRepository;

    private static final Set<String> VALID_STATUSES = Set.of(
            "PLACED",
            "PREPARING",
            "READY",
            "DELIVERED",
            "CANCELLED"
    );

    public OrderController(
            CustomerOrderRepository orderRepository,
            FoodRepository foodRepository) {
        this.orderRepository = orderRepository;
        this.foodRepository = foodRepository;
    }

    // Admin: view all orders.
    @GetMapping
    @Transactional(readOnly = true)
    public List<CustomerOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    // Customer: view only their own orders.
    @GetMapping("/my-orders")
    @Transactional(readOnly = true)
    public List<CustomerOrder> getMyOrders(Authentication authentication) {
        return orderRepository.findByCustomerEmailOrderByOrderDateDesc(
                authentication.getName()
        );
    }

    // Customer: place an order.
    @PostMapping
    @Transactional
    public CustomerOrder placeOrder(
            @RequestBody CustomerOrder request,
            Authentication authentication) {

        if (request.getCustomerName() == null
                || request.getCustomerName().isBlank()
                || request.getPhone() == null
                || request.getPhone().isBlank()
                || request.getDeliveryAddress() == null
                || request.getDeliveryAddress().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please provide your name, phone, and delivery address."
            );
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Your order must contain at least one food item."
            );
        }

        if (!"COD".equals(request.getPaymentMethod())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only Cash on Delivery is currently supported."
            );
        }

        CustomerOrder order = new CustomerOrder();
        order.setCustomerName(request.getCustomerName().trim());
        order.setCustomerEmail(authentication.getName());
        order.setPhone(request.getPhone().trim());
        order.setDeliveryAddress(request.getDeliveryAddress().trim());
        order.setPaymentMethod("COD");
        order.setStatus("PLACED");

        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0;

        for (OrderItem requestedItem : request.getItems()) {

            if (requestedItem.getFoodId() == null
                    || requestedItem.getQuantity() < 1
                    || requestedItem.getQuantity() > 100) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid food item or quantity."
                );
            }

            Food food = foodRepository
                    .findById(requestedItem.getFoodId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "A selected food item was not found."
                    ));

            if (!food.isAvailable()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        food.getName() + " is currently unavailable."
                );
            }

            OrderItem item = new OrderItem();
            item.setFoodId(food.getId());
            item.setFoodName(food.getName());
            item.setPrice(food.getPrice());
            item.setQuantity(requestedItem.getQuantity());
            item.setCustomerOrder(order);

            orderItems.add(item);
            total += food.getPrice() * requestedItem.getQuantity();
        }

        order.setItems(orderItems);
        order.setTotalAmount(total);

        return orderRepository.save(order);
    }

    // Admin: update an order's status.
    @PutMapping("/{id}/status")
    @Transactional
    public CustomerOrder updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");

        if (status == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please provide an order status."
            );
        }

        status = status.trim().toUpperCase();

        if (!VALID_STATUSES.contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid status. Use PLACED, PREPARING, READY, DELIVERED, or CANCELLED."
            );
        }

        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Order not found."
                ));

        order.setStatus(status);

        return orderRepository.save(order);
    }
}
