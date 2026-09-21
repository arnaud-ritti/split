package com.arkoder.split.domain;

import java.util.List;

/**
 * A set of transfers that clears every balance, plus the strategy that produced it.
 *
 * <p>The strategy is part of the result on purpose: {@code GREEDY} does not guarantee the
 * minimum number of transfers, so a caller reading the plan should be able to tell which
 * guarantee it is getting.
 */
public record SettlementPlan(List<Transfer> transfers, Strategy strategy) {

    public enum Strategy {
        /** Largest debtor pays the largest creditor. Fast, at most n-1 transfers, not minimal. */
        GREEDY,
        /** Provably minimal number of transfers. Exponential in the number of members. */
        OPTIMAL
    }

    public SettlementPlan {
        transfers = List.copyOf(transfers);
    }

    public int transferCount() {
        return transfers.size();
    }
}
