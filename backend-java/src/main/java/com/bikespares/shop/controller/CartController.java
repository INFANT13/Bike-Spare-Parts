package com.bikespares.shop.controller;

import com.bikespares.shop.model.*;
import com.bikespares.shop.repository.*;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    @GetMapping
    public ResponseEntity<?> getCart(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        Cart cart = getOrCreateCart(user);
        List<CartItem> items = cart.getCartItems();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("cartId", cart.getId());
        response.put("items", items);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@AuthenticationPrincipal User user, @RequestBody CartRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        if (request.getProductId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Product ID is required"));
        }

        int qty = request.getQuantity() != null ? request.getQuantity() : 1;

        Optional<Product> productOpt = productRepository.findById(request.getProductId());
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Product not found"));
        }

        Product product = productOpt.get();
        if (product.getStock() < qty) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Only " + product.getStock() + " items left in stock"));
        }

        Cart cart = getOrCreateCart(user);
        Optional<CartItem> itemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        CartItem cartItem;
        if (itemOpt.isPresent()) {
            cartItem = itemOpt.get();
            int newQty = cartItem.getQuantity() + qty;
            if (product.getStock() < newQty) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new BaseResponse(false, "Cannot add more items. Max available stock is " + product.getStock()));
            }
            cartItem.setQuantity(newQty);
            cartItemRepository.save(cartItem);
        } else {
            cartItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(qty)
                    .build();
            cartItemRepository.save(cartItem);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Item added to cart successfully");
        response.put("cartItem", cartItem);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateCartItem(@AuthenticationPrincipal User user, @RequestBody CartRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        if (request.getProductId() == null || request.getQuantity() == null || request.getQuantity() < 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Provide a valid product ID and positive quantity"));
        }

        Optional<Product> productOpt = productRepository.findById(request.getProductId());
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Product not found"));
        }

        Product product = productOpt.get();
        if (product.getStock() < request.getQuantity()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Only " + product.getStock() + " items left in stock"));
        }

        Cart cart = getOrCreateCart(user);
        Optional<CartItem> itemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());

        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Item not found in your cart"));
        }

        CartItem cartItem = itemOpt.get();
        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cart updated successfully");
        response.put("cartItem", cartItem);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<?> removeCartItem(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        Cart cart = getOrCreateCart(user);
        Optional<CartItem> itemOpt = cartItemRepository.findByCartIdAndProductId(cart.getId(), id);

        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Item not found in your cart"));
        }

        cartItemRepository.delete(itemOpt.get());

        return ResponseEntity.ok(new BaseResponse(true, "Item removed from cart"));
    }

    @DeleteMapping("/clear")
    @Transactional
    public ResponseEntity<?> clearCart(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        Cart cart = getOrCreateCart(user);
        cartItemRepository.deleteByCartId(cart.getId());

        return ResponseEntity.ok(new BaseResponse(true, "Cart cleared successfully"));
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
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartRequest {
        private Long productId;
        private Integer quantity;
    }
}
