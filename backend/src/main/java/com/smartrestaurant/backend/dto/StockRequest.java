package com.smartrestaurant.backend.dto;

public class StockRequest {

    private int stockQuantity;

    public StockRequest() {
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
}