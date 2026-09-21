package com.arkoder.split.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class ShareSplitterTest {

    private static final UUID ALICE = new UUID(0, 1);
    private static final UUID BOB = new UUID(0, 2);
    private static final UUID CAROL = new UUID(0, 3);

    @Test
    @DisplayName("hands the leftover cents to the first participants in UUID order")
    void splitsTenEurosBetweenThree() {
        Map<UUID, BigDecimal> shares =
                ShareSplitter.splitEqually(new BigDecimal("10.00"), List.of(CAROL, ALICE, BOB));

        assertThat(shares).containsExactly(
                Map.entry(ALICE, new BigDecimal("3.34")),
                Map.entry(BOB, new BigDecimal("3.33")),
                Map.entry(CAROL, new BigDecimal("3.33")));
    }

    @Test
    @DisplayName("is not affected by the order participants are passed in")
    void isDeterministic() {
        BigDecimal amount = new BigDecimal("10.00");

        assertThat(ShareSplitter.splitEqually(amount, List.of(CAROL, BOB, ALICE)))
                .isEqualTo(ShareSplitter.splitEqually(amount, List.of(ALICE, BOB, CAROL)));
    }

    @ParameterizedTest(name = "{0} split {1} ways loses nothing")
    @CsvSource({
            "10.00, 3",
            "0.01, 3",
            "0.10, 7",
            "100.00, 6",
            "33.33, 2",
            "999999.99, 13",
            "7.05, 1"
    })
    @DisplayName("shares always add back up to the exact total")
    void sharesSumBackToTheTotal(BigDecimal amount, int participantCount) {
        List<UUID> participants = participants(participantCount);

        Map<UUID, BigDecimal> shares = ShareSplitter.splitEqually(amount, participants);

        assertThat(shares).hasSize(participantCount);
        assertThat(shares.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo(amount);
    }

    @Test
    @DisplayName("a single participant owes the whole amount")
    void singleParticipantOwesEverything() {
        assertThat(ShareSplitter.splitEqually(new BigDecimal("42.17"), List.of(ALICE)))
                .containsExactly(Map.entry(ALICE, new BigDecimal("42.17")));
    }

    @Test
    @DisplayName("a participant listed twice still only owes one share")
    void deduplicatesParticipants() {
        Map<UUID, BigDecimal> shares =
                ShareSplitter.splitEqually(new BigDecimal("10.00"), List.of(ALICE, BOB, ALICE));

        assertThat(shares).containsExactly(
                Map.entry(ALICE, new BigDecimal("5.00")),
                Map.entry(BOB, new BigDecimal("5.00")));
    }

    @Test
    void rejectsAnExpenseWithNoParticipants() {
        assertThatThrownBy(() -> ShareSplitter.splitEqually(new BigDecimal("10.00"), Set.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least one participant");
    }

    @Test
    void rejectsANonPositiveAmount() {
        assertThatThrownBy(() -> ShareSplitter.splitEqually(BigDecimal.ZERO, List.of(ALICE)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("strictly positive");
    }

    @Test
    @DisplayName("refuses sub-cent precision rather than silently rounding it away")
    void rejectsMoreThanTwoDecimals() {
        assertThatThrownBy(() -> ShareSplitter.splitEqually(new BigDecimal("10.001"), List.of(ALICE)))
                .isInstanceOf(ArithmeticException.class);
    }

    private static List<UUID> participants(int count) {
        return java.util.stream.IntStream.rangeClosed(1, count)
                .mapToObj(i -> new UUID(0, i))
                .toList();
    }
}
