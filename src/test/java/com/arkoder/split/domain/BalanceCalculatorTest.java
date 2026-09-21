package com.arkoder.split.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class BalanceCalculatorTest {

    private static final UUID ALICE = new UUID(0, 1);
    private static final UUID BOB = new UUID(0, 2);
    private static final UUID CAROL = new UUID(0, 3);
    private static final List<UUID> GROUP = List.of(ALICE, BOB, CAROL);

    @Test
    @DisplayName("the payer is credited the full amount and debited their own share")
    void computesNetPositions() {
        ExpenseEntry groceries = expense(ALICE, "60.00", Map.of(
                ALICE, "20.00", BOB, "20.00", CAROL, "20.00"));

        Map<UUID, Long> net = BalanceCalculator.netCents(GROUP, List.of(groceries));

        assertThat(net).containsExactly(
                Map.entry(ALICE, 4000L),
                Map.entry(BOB, -2000L),
                Map.entry(CAROL, -2000L));
    }

    @Test
    @DisplayName("balances cancel out across several expenses")
    void netsOutSeveralExpenses() {
        ExpenseEntry groceries = expense(ALICE, "60.00", Map.of(
                ALICE, "20.00", BOB, "20.00", CAROL, "20.00"));
        ExpenseEntry taxi = expense(BOB, "30.00", Map.of(
                ALICE, "10.00", BOB, "10.00", CAROL, "10.00"));

        Map<UUID, Long> net = BalanceCalculator.netCents(GROUP, List.of(groceries, taxi));

        assertThat(net).containsExactly(
                Map.entry(ALICE, 3000L),
                Map.entry(BOB, 0L),
                Map.entry(CAROL, -3000L));
        assertThat(sum(net)).isZero();
    }

    @Test
    @DisplayName("someone who did not take part in an expense owes nothing for it")
    void ignoresNonParticipants() {
        ExpenseEntry barbecue = expense(ALICE, "10.00", Map.of(ALICE, "5.00", BOB, "5.00"));

        Map<UUID, Long> net = BalanceCalculator.netCents(GROUP, List.of(barbecue));

        assertThat(net).containsEntry(ALICE, 500L)
                .containsEntry(BOB, -500L)
                .containsEntry(CAROL, 0L);
        assertThat(sum(net)).isZero();
    }

    @Test
    @DisplayName("every member shows up even when the group has no expense yet")
    void reportsZeroForAnEmptyGroup() {
        Map<UUID, Long> net = BalanceCalculator.netCents(GROUP, List.of());

        assertThat(net).containsExactly(
                Map.entry(ALICE, 0L),
                Map.entry(BOB, 0L),
                Map.entry(CAROL, 0L));
    }

    @Test
    @DisplayName("odd cents do not break the zero-sum invariant")
    void staysBalancedWithUnevenSplits() {
        UUID[] members = {ALICE, BOB, CAROL};
        ExpenseEntry uneven = new ExpenseEntry(ALICE, new BigDecimal("10.00"),
                ShareSplitter.splitEqually(new BigDecimal("10.00"), List.of(members)));

        Map<UUID, Long> net = BalanceCalculator.netCents(GROUP, List.of(uneven));

        assertThat(sum(net)).isZero();
        assertThat(net).containsEntry(ALICE, 1000L - 334L);
    }

    private static ExpenseEntry expense(UUID payer, String amount, Map<UUID, String> shares) {
        Map<UUID, BigDecimal> parsed = shares.entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(Map.Entry::getKey, e -> new BigDecimal(e.getValue())));
        return new ExpenseEntry(payer, new BigDecimal(amount), parsed);
    }

    private static long sum(Map<UUID, Long> net) {
        return net.values().stream().mapToLong(Long::longValue).sum();
    }
}
