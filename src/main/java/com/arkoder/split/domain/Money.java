package com.arkoder.split.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Conversion between the API/database representation of money ({@link BigDecimal} with
 * scale 2) and the representation the algorithms use internally (whole cents in a
 * {@code long}).
 *
 * <p>Every computation in this package works in cents. Integers make the "no cent gained
 * or lost" invariants exact and trivially checkable; {@code BigDecimal} stays at the
 * boundary, where it belongs.
 */
public final class Money {

    private Money() {
    }

    /**
     * @throws ArithmeticException if {@code amount} carries more than two decimals
     */
    public static long toCents(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.UNNECESSARY).unscaledValue().longValueExact();
    }

    public static BigDecimal fromCents(long cents) {
        return BigDecimal.valueOf(cents, 2);
    }
}
