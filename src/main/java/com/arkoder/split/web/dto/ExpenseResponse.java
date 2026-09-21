package com.arkoder.split.web.dto;

import com.arkoder.split.domain.Expense;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        String description,
        BigDecimal amount,
        UUID payerId,
        String payerName,
        Instant createdAt,
        List<ShareResponse> shares) {

    public static ExpenseResponse from(Expense expense) {
        List<ShareResponse> shares = expense.getShares().stream()
                .map(ShareResponse::from)
                .sorted(Comparator.comparing(share -> share.memberName().toLowerCase()))
                .toList();
        return new ExpenseResponse(
                expense.getId(),
                expense.getDescription(),
                expense.getAmount(),
                expense.getPayer().getId(),
                expense.getPayer().getName(),
                expense.getCreatedAt(),
                shares);
    }
}
