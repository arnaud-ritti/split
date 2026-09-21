package com.arkoder.split.domain;

import java.util.UUID;

/** One reimbursement: {@code from} hands {@code amountCents} to {@code to}. */
public record Transfer(UUID from, UUID to, long amountCents) {

    public Transfer {
        if (from.equals(to)) {
            throw new IllegalArgumentException("a member cannot reimburse themselves");
        }
        if (amountCents <= 0) {
            throw new IllegalArgumentException("a transfer amount must be strictly positive");
        }
    }
}
