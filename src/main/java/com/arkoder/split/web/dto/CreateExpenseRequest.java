package com.arkoder.split.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

/**
 * Whether the payer and the participants actually belong to the group cannot be checked
 * here: it needs the database. That rule lives in the service and surfaces as a 422.
 */
public record CreateExpenseRequest(
        @NotBlank @Size(max = 200) String description,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
        @NotNull UUID payerId,
        @NotEmpty Set<UUID> participantIds) {
}
