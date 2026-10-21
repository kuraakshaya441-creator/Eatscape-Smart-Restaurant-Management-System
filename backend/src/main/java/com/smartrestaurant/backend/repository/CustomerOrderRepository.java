
package com.smartrestaurant.backend.repository;

import com.smartrestaurant.backend.entity.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerOrderRepository
        extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByCustomerEmailOrderByOrderDateDesc(
            String customerEmail);
}
