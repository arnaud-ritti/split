package com.arkoder.split.domain;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * One expense reduced to what balance computation actually needs: who paid, how much, and
 * what each participant owes for it. Keeping this separate from the {@link Expense} entity
 * is what lets {@link BalanceCalculator} stay free of JPA.
 */
public record ExpenseEntry(UUID payerId, BigDecimal amount, Map<UUID, BigDecimal> shares) {

    public static ExpenseEntry from(Expense expense) {
        Map<UUID, BigDecimal> shares = expense.getShares().stream()
                .collect(java.util.stream.Collectors.toMap(
                        share -> share.getMember().getId(), ExpenseShare::getAmount));
        return new ExpenseEntry(expense.getPayer().getId(), expense.getAmount(), shares);
    }
}
