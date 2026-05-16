package com.edutech.supply_of_goods_management.service;

import com.edutech.supply_of_goods_management.entity.Product;
import com.edutech.supply_of_goods_management.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class ProductImageStorageService {

    private final Path uploadPath = Paths.get("uploads/products");

    @Autowired
    private ProductRepository productRepository;

    public Product uploadProductImage(Long productId, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new RuntimeException("Image file is required");
        }

        String contentType = image.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Only image files are allowed");
        }

        if (image.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("Image size must be less than 5MB");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        try {
            Files.createDirectories(uploadPath);

            String originalName = image.getOriginalFilename() == null
                    ? "product-image"
                    : image.getOriginalFilename();

            String extension = getExtension(originalName);

            String fileName =
                    "product-" + productId + "-" + UUID.randomUUID() + extension;

            Path targetPath = uploadPath.resolve(fileName);

            Files.copy(image.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/products/" + fileName;

            product.setImageUrl(imageUrl);

            return productRepository.save(product);

        } catch (Exception e) {
            throw new RuntimeException("Failed to upload product image: " + e.getMessage());
        }
    }

    public Product deleteProductImage(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String oldImageUrl = product.getImageUrl();

        if (oldImageUrl != null && oldImageUrl.startsWith("/uploads/products/")) {
            try {
                String fileName = oldImageUrl.replace("/uploads/products/", "");
                Path oldFilePath = uploadPath.resolve(fileName);
                Files.deleteIfExists(oldFilePath);
            } catch (Exception ignored) {
                // Even if file delete fails, clear DB image URL.
            }
        }

        product.setImageUrl(null);
        return productRepository.save(product);
    }

    private String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf(".");

        if (dotIndex == -1) {
            return ".jpg";
        }

        String extension = fileName.substring(dotIndex).toLowerCase();

        if (
                extension.equals(".jpg") ||
                extension.equals(".jpeg") ||
                extension.equals(".png") ||
                extension.equals(".webp")
        ) {
            return extension;
        }

        return ".jpg";
    }
}