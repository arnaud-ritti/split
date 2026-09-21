package com.arkoder.split.domain;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Splits an expense equally between its participants.
 *
 * <p>The interesting part is the remainder. 10.00 EUR between three people is 3.3333...
 * each; naively rounding every share loses or invents a cent, and the balances stop
 * summing to zero. Instead the total is divided in cents, and the {@code total % n}
 * leftover cents are handed out one each to the first participants in UUID order.
 * Ordering by UUID rather than iteration order keeps the result reproducible for a given
 * expense, which matters because the shares are persisted.
 *
 * <p>Invariant: {@code sum(shares) == amount}, exactly, always.
 */
public final class ShareSplitter {

    private ShareSplitter() {
    }

    public static Map<UUID, BigDecimal> splitEqually(BigDecimal amount, Collection<UUID> participantIds) {
        List<UUID> ordered = participantIds.stream().distinct().sorted().toList();
        if (ordered.isEmpty()) {
            throw new IllegalArgumentException("an expense needs at least one participant");
        }
        long totalCents = Money.toCents(amount);
        if (totalCents <= 0) {
            throw new IllegalArgumentException("an expense amount must be strictly positive");
        }

        int n = ordered.size();
        long base = totalCents / n;
        long remainder = totalCents % n;

        Map<UUID, BigDecimal> shares = new LinkedHashMap<>();
        for (int i = 0; i < n; i++) {
            shares.put(ordered.get(i), Money.fromCents(i < remainder ? base + 1 : base));
        }
        return shares;
    }
}
