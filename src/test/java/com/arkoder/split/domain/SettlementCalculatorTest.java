package com.arkoder.split.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

class SettlementCalculatorTest {

    // --- Properties that must hold for either strategy -------------------------------
    // A settlement plan is only correct if applying it leaves everybody at zero. The
    // transfer count is a quality metric on top of that, never a substitute for it.

    static List<Function<Map<UUID, Long>, List<Transfer>>> strategies() {
        return List.of(SettlementCalculator::greedy, SettlementCalculator::optimal);
    }

    @ParameterizedTest
    @MethodSource("strategies")
    @DisplayName("applying the transfers brings every balance back to zero")
    void clearsAllBalances(Function<Map<UUID, Long>, List<Transfer>> strategy) {
        for (Map<UUID, Long> balances : scenarios()) {
            Map<UUID, Long> remaining = new LinkedHashMap<>(balances);

            for (Transfer transfer : strategy.apply(balances)) {
                remaining.merge(transfer.from(), transfer.amountCents(), Long::sum);
                remaining.merge(transfer.to(), -transfer.amountCents(), Long::sum);
            }

            assertThat(remaining.values()).containsOnly(0L);
        }
    }

    @ParameterizedTest
    @MethodSource("strategies")
    @DisplayName("never needs more than n-1 transfers")
    void staysUnderTheUpperBound(Function<Map<UUID, Long>, List<Transfer>> strategy) {
        for (Map<UUID, Long> balances : scenarios()) {
            long nonZero = balances.values().stream().filter(cents -> cents != 0).count();

            assertThat(strategy.apply(balances))
                    .hasSizeLessThanOrEqualTo((int) Math.max(0, nonZero - 1));
        }
    }

    @ParameterizedTest
    @MethodSource("strategies")
    @DisplayName("emits no zero-amount and no self-directed transfer")
    void emitsOnlyMeaningfulTransfers(Function<Map<UUID, Long>, List<Transfer>> strategy) {
        for (Map<UUID, Long> balances : scenarios()) {
            assertThat(strategy.apply(balances)).allSatisfy(transfer -> {
                assertThat(transfer.amountCents()).isPositive();
                assertThat(transfer.from()).isNotEqualTo(transfer.to());
            });
        }
    }

    @ParameterizedTest
    @MethodSource("strategies")
    @DisplayName("a settled group needs no transfer at all")
    void settlesNothingWhenAlreadyEven(Function<Map<UUID, Long>, List<Transfer>> strategy) {
        assertThat(strategy.apply(balances(0, 0, 0))).isEmpty();
    }

    @ParameterizedTest
    @MethodSource("strategies")
    @DisplayName("a simple debt is settled with a single transfer")
    void settlesAPairDirectly(Function<Map<UUID, Long>, List<Transfer>> strategy) {
        assertThat(strategy.apply(balances(2000, -2000)))
                .containsExactly(new Transfer(id(2), id(1), 2000));
    }

    // --- Where the two strategies part ways ------------------------------------------

    @Test
    @DisplayName("greedy is not minimal: 5 transfers where 4 are enough")
    void greedyIsNotOptimal() {
        // {+10, -5, -5} and {+6, -3, -3} each settle in 2 transfers, so 4 is the minimum.
        // Greedy cannot see those groups: it pairs the largest debtor with the largest
        // creditor, ends up splitting one debt across two creditors, and pays for that
        // with a 5th transfer.
        Map<UUID, Long> balances = balances(1000, 600, -500, -500, -300, -300);

        assertThat(SettlementCalculator.greedy(balances)).hasSize(5);
        assertThat(SettlementCalculator.optimal(balances)).hasSize(4);
    }

    @Test
    @DisplayName("both strategies agree when there is nothing clever to find")
    void agreeOnStraightforwardCases() {
        for (Map<UUID, Long> balances : List.of(
                balances(1000, -1000),
                balances(3000, -1000, -1000, -1000),
                balances(1000, 2000, 3000, -1000, -2000, -3000))) {

            assertThat(SettlementCalculator.optimal(balances))
                    .hasSameSizeAs(SettlementCalculator.greedy(balances));
        }
    }

    // --- settle() picks a strategy ----------------------------------------------------

    @Test
    @DisplayName("settle() solves exactly while the group is small enough")
    void settleUsesTheOptimalStrategy() {
        SettlementPlan plan = SettlementCalculator.settle(balances(1000, 600, -500, -500, -300, -300));

        assertThat(plan.strategy()).isEqualTo(SettlementPlan.Strategy.OPTIMAL);
        assertThat(plan.transferCount()).isEqualTo(4);
    }

    @Test
    @DisplayName("settle() falls back to greedy rather than blowing up on a large group")
    void settleFallsBackToGreedy() {
        SettlementPlan plan = SettlementCalculator.settle(tooManyMembers());

        assertThat(plan.strategy()).isEqualTo(SettlementPlan.Strategy.GREEDY);
        assertThat(plan.transfers()).isNotEmpty();
    }

    @Test
    void optimalRefusesGroupsItCannotSolveExactly() {
        Map<UUID, Long> balances = tooManyMembers();

        assertThatThrownBy(() -> SettlementCalculator.optimal(balances))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("limited to");
    }

    @Test
    @DisplayName("rejects balances that do not sum to zero, which can only mean a bug upstream")
    void rejectsUnbalancedInput() {
        assertThatThrownBy(() -> SettlementCalculator.settle(balances(1000, -900)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("sum to zero");
    }

    // --- fixtures ---------------------------------------------------------------------

    private static List<Map<UUID, Long>> scenarios() {
        return List.of(
                balances(0, 0, 0),
                balances(1000, -1000),
                balances(4000, -2000, -2000),
                balances(3000, 0, -3000),
                balances(1000, 600, -500, -500, -300, -300),
                balances(1, -1, 334, -333, -1, 0),
                balances(700, -250, -250, -200),
                balances(1500, 500, -400, -600, -1000));
    }

    private static Map<UUID, Long> tooManyMembers() {
        long[] cents = new long[SettlementCalculator.OPTIMAL_MAX_MEMBERS + 2];
        for (int i = 0; i < cents.length; i++) {
            cents[i] = i % 2 == 0 ? 100 : -100;
        }
        return balances(cents);
    }

    private static Map<UUID, Long> balances(long... cents) {
        Map<UUID, Long> balances = new LinkedHashMap<>();
        for (int i = 0; i < cents.length; i++) {
            balances.put(id(i + 1), cents[i]);
        }
        return balances;
    }

    /** Sequential UUIDs, so the greedy tie-break is pinned and the counts are stable. */
    private static UUID id(int index) {
        return new UUID(0, index);
    }
}
