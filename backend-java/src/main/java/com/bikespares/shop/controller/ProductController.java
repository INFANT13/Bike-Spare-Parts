package com.bikespares.shop.controller;

import com.bikespares.shop.model.Category;
import com.bikespares.shop.model.Product;
import com.bikespares.shop.repository.CategoryRepository;
import com.bikespares.shop.repository.ProductRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<?> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String sort) {

        Long categoryId = null;
        String categorySlug = null;
        if (category != null && !category.trim().isEmpty()) {
            try {
                categoryId = Long.parseLong(category);
            } catch (NumberFormatException e) {
                categorySlug = category;
            }
        }

        Sort jpaSort = Sort.by(Sort.Direction.DESC, "id");
        if (sort != null) {
            switch (sort) {
                case "price_asc":
                    jpaSort = Sort.by(Sort.Direction.ASC, "price");
                    break;
                case "price_desc":
                    jpaSort = Sort.by(Sort.Direction.DESC, "price");
                    break;
                case "name_asc":
                    jpaSort = Sort.by(Sort.Direction.ASC, "name");
                    break;
                case "name_desc":
                    jpaSort = Sort.by(Sort.Direction.DESC, "name");
                    break;
            }
        }

        // Make search parameter null if empty so query handles it
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        List<Product> products = productRepository.searchProducts(
                searchParam, minPrice, maxPrice, categoryId, categorySlug, jpaSort);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", products.size());
        response.put("products", products);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        List<Category> categories = categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("categories", categories);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Product not found"));
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("product", productOpt.get());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody ProductRequest request) {
        Optional<Product> existingProduct = productRepository.findBySku(request.getSku());
        if (existingProduct.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Product with this SKU already exists"));
        }

        Optional<Category> categoryOpt = categoryRepository.findById(request.getCategoryId());
        if (categoryOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new BaseResponse(false, "Category not found"));
        }

        String specsJson = null;
        if (request.getSpecifications() != null) {
            try {
                specsJson = objectMapper.writeValueAsString(request.getSpecifications());
            } catch (Exception e) {
                specsJson = "{}";
            }
        }

        // Generate slug from product name
        String slug = makeSlug(request.getName());

        Product product = Product.builder()
                .name(request.getName())
                .sku(request.getSku())
                .slug(slug)
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock() != null ? request.getStock() : 0)
                .image(request.getImage() != null ? request.getImage() : "/uploads/placeholder.jpg")
                .category(categoryOpt.get())
                .specifications(specsJson)
                .build();

        productRepository.save(product);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("product", product);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody ProductRequest request) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Product not found"));
        }

        Product product = productOpt.get();

        if (request.getCategoryId() != null) {
            Optional<Category> categoryOpt = categoryRepository.findById(request.getCategoryId());
            if (categoryOpt.isPresent()) {
                product.setCategory(categoryOpt.get());
            }
        }

        if (request.getName() != null) {
            product.setName(request.getName());
            product.setSlug(makeSlug(request.getName()));
        }
        if (request.getSku() != null) product.setSku(request.getSku());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getStock() != null) product.setStock(request.getStock());
        if (request.getImage() != null) product.setImage(request.getImage());

        if (request.getSpecifications() != null) {
            try {
                product.setSpecifications(objectMapper.writeValueAsString(request.getSpecifications()));
            } catch (Exception e) {
                // Keep original specs or do nothing
            }
        }

        productRepository.save(product);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("product", product);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new BaseResponse(false, "Product not found"));
        }

        productRepository.delete(productOpt.get());
        return ResponseEntity.ok(new BaseResponse(true, "Product deleted successfully"));
    }

    private String makeSlug(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("[^\\w\\-]+", "")
                .replaceAll("\\-\\-+", "-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");
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
    public static class ProductRequest {
        private String name;
        private String sku;
        private String description;
        private BigDecimal price;
        private Integer stock;
        private String image;
        private Long categoryId;
        private Map<String, Object> specifications;
    }
}
