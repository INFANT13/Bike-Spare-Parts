package com.bikespares.shop.controller;

import com.bikespares.shop.dto.*;
import com.bikespares.shop.model.Cart;
import com.bikespares.shop.model.User;
import com.bikespares.shop.repository.CartRepository;
import com.bikespares.shop.repository.UserRepository;
import com.bikespares.shop.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import lombok.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("A user with that email already exists")
                            .build());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone() : "")
                .address(request.getAddress() != null ? request.getAddress() : "")
                .role(request.getRole() != null ? request.getRole() : "customer")
                .build();

        userRepository.save(user);

        // Create a cart for the user
        cartRepository.save(Cart.builder().user(user).build());

        String token = tokenProvider.generateToken(user.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(AuthResponse.builder()
                        .success(true)
                        .token(token)
                        .user(UserDto.fromEntity(user))
                        .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("Invalid email or password")
                            .build());
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("Invalid email or password")
                            .build());
        }

        // Ensure user has a cart
        Optional<Cart> cartOpt = cartRepository.findByUserId(user.getId());
        if (cartOpt.isEmpty()) {
            cartRepository.save(Cart.builder().user(user).build());
        }

        String token = tokenProvider.generateToken(user.getId());

        return ResponseEntity.ok(
                AuthResponse.builder()
                        .success(true)
                        .token(token)
                        .user(UserDto.fromEntity(user))
                        .build());
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }
        Optional<User> userOpt = userRepository.findById(user.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "User not found"));
        }
        return ResponseEntity.ok(new ProfileResponse(true, UserDto.fromEntity(userOpt.get())));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new BaseResponse(false, "Not authenticated"));
        }

        Optional<User> userOpt = userRepository.findById(user.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "User not found"));
        }

        User dbUser = userOpt.get();
        if (request.getName() != null) dbUser.setName(request.getName().trim());
        if (request.getPhone() != null) dbUser.setPhone(request.getPhone().trim());
        if (request.getAddress() != null) dbUser.setAddress(request.getAddress().trim());

        userRepository.save(dbUser);

        return ResponseEntity.ok(new ProfileResponse(true, UserDto.fromEntity(dbUser)));
    }

    // Helper inner response classes
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
    public static class ProfileResponse {
        private boolean success;
        private UserDto user;
    }
}
