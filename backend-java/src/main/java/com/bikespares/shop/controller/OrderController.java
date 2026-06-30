package com.bikespares.shop.controller;

import com.bikespares.shop.model.*;
import com.bikespares.shop.repository.*;
import com.bikespares.shop.service.EmailService;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/checkout")
    @Transactional
    public ResponseEntity<?> checkout(
            @AuthenticationPrincipal User user,
            @RequestBody CheckoutRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        if (request.getShippingAddress() == null || request.getShippingAddress().trim().isEmpty() ||
                request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Please provide shipping address and phone number"));
        }

        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (cartOpt.isEmpty() || cartOpt.get().getCartItems().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Your cart is empty"));
        }

        Cart cart = cartOpt.get();
        List<CartItem> cartItems = cart.getCartItems();

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> itemsToCreate = new ArrayList<>();

        for (CartItem item : cartItems) {
            Product product = item.getProduct();
            if (product == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new BaseResponse(false, "One of the items in your cart is no longer available"));
            }

            if (product.getStock() < item.getQuantity()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new BaseResponse(false, "Insufficient stock for " + product.getName() + ". Only " + product.getStock() + " left in stock."));
            }

            BigDecimal itemPrice = product.getPrice();
            BigDecimal itemTotal = itemPrice.multiply(new BigDecimal(item.getQuantity()));
            totalAmount = totalAmount.add(itemTotal);

            itemsToCreate.add(OrderItem.builder()
                    .product(product)
                    .quantity(item.getQuantity())
                    .price(itemPrice)
                    .build());
        }

        // Create pending order
        Order order = Order.builder()
                .user(user)
                .totalAmount(totalAmount)
                .status("pending")
                .paymentStatus("pending")
                .shippingAddress(request.getShippingAddress())
                .phone(request.getPhone())
                .paymentId("demo_pay_" + System.currentTimeMillis() + "_" + user.getId())
                .build();

        orderRepository.save(order);

        for (OrderItem orderItem : itemsToCreate) {
            orderItem.setOrder(order);
            orderItemRepository.save(orderItem);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("orderId", order.getId());
        response.put("paymentId", order.getPaymentId());
        response.put("amount", order.getTotalAmount());
        response.put("currency", "INR");
        response.put("isDemo", true); // Run in demo simulation mode for easy out-of-the-box local setups

        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-payment")
    @Transactional
    public ResponseEntity<?> verifyPayment(
            @AuthenticationPrincipal User user,
            @RequestBody PaymentVerificationRequest request) {

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        Optional<Order> orderOpt = orderRepository.findById(request.getOrderId());
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Order not found"));
        }

        Order order = orderOpt.get();
        if ("success".equals(order.getPaymentStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Order has already been paid"));
        }

        // Demo implementation or verification simulation
        order.setPaymentStatus("success");
        order.setStatus("paid");
        if (request.getRazorpay_payment_id() != null) {
            order.setPaymentId(request.getRazorpay_payment_id());
        }
        orderRepository.save(order);

        // Deduct inventory
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            if (product != null) {
                int newStock = Math.max(0, product.getStock() - item.getQuantity());
                product.setStock(newStock);
                productRepository.save(product);
            }
        }

        // Clear user's shopping cart
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (cartOpt.isPresent()) {
            cartItemRepository.deleteByCartId(cartOpt.get().getId());
        }

        // Send transactional confirmation email to user
        emailService.sendOrderConfirmationEmail(user, order);

        return ResponseEntity.ok(new PaymentSuccessResponse(true, "Payment successfully processed", order.getId()));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", orders.size());
        response.put("orders", orders);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/all-orders")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", orders.size());
        response.put("orders", orders);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@RequestBody UpdateStatusRequest request) {
        if (request.getOrderId() == null || request.getStatus() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Please provide valid orderId and status"));
        }

        List<String> validStatuses = Arrays.asList("pending", "paid", "shipped", "delivered", "cancelled");
        if (!validStatuses.contains(request.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Please provide valid status: " + validStatuses));
        }

        Optional<Order> orderOpt = orderRepository.findById(request.getOrderId());
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Order not found"));
        }

        Order order = orderOpt.get();
        order.setStatus(request.getStatus());
        orderRepository.save(order);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Order status updated to " + request.getStatus());
        response.put("order", order);

        return ResponseEntity.ok(response);
    }



    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BaseResponse {
        private boolean success;
        private String message;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PaymentSuccessResponse {
        private boolean success;
        private String message;
        private Long orderId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckoutRequest {
        private String shippingAddress;
        private String phone;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentVerificationRequest {
        private Long orderId;
        private String razorpay_payment_id;
        private String razorpay_order_id;
        private String razorpay_signature;
        private Boolean isDemo;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateStatusRequest {
        private Long orderId;
        private String status;
    }
}
