package com.bikespares.shop.repository;

import com.bikespares.shop.model.Product;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);
    Optional<Product> findBySlug(String slug);

    @Query("SELECT p FROM Product p WHERE " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:categorySlug IS NULL OR p.category.slug = :categorySlug)")
    List<Product> searchProducts(
        @Param("search") String search,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        @Param("categoryId") Long categoryId,
        @Param("categorySlug") String categorySlug,
        Sort sort
    );
}
