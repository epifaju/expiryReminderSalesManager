package com.salesmanager.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO produit pour l'endpoint barcode (PRD §14).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDto {

    private Long id;
    private String name;
    private String barcode;

    @JsonProperty("salePrice")
    private BigDecimal salePrice;

    private Integer stockQuantity;

    @JsonProperty("expirationDate")
    private LocalDate expirationDate;

    private String category;
    private String unit;

    /** Toujours SYNCED côté serveur (sync mobile = champ client). */
    private String syncStatus;
}
