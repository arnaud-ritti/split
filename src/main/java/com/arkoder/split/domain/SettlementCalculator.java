package com.arkoder.split.domain;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.UUID;

/**
 * Turns net balances into the transfers that clear them.
 *
 * <p>Two strategies are implemented, because the difference between them is the whole
 * point of the exercise.
 *
 * <p><b>Greedy</b> repeatedly makes the largest debtor pay the largest creditor. It runs in
 * O(n log n) and always finishes in at most n-1 transfers, but that is an upper bound, not
 * the minimum. For balances {@code [+10, +6, -5, -5, -3, -3]} it produces 5 transfers where
 * 4 suffice.
 *
 * <p><b>Optimal</b> exploits the exact characterisation of the problem:
 *
 * <pre>
 *   min transfers = (members with a non-zero balance)
 *                 - (max number of disjoint subsets that each sum to zero)
 * </pre>
 *
 * <p>A zero-sum subset of size k is settled in exactly k-1 transfers and never fewer, so
 * maximising the number of such subsets minimises the total. That maximum is found with a
 * DP over bitmasks; the greedy pass is then re-run inside each subset, where it really is
 * optimal (a zero-sum group with no proper zero-sum subset needs at least k-1 transfers,
 * and greedy never exceeds k-1).
 *
 * <p>Finding the partition is NP-hard in general (it is a subset-sum partition), hence the
 * {@link #OPTIMAL_MAX_MEMBERS} cut-off. A MILP solver minimising the number of used edges
 * under flow conservation reaches the same optimum, but would pull in a heavyweight
 * dependency for a problem that fits in this file. It would become the right call if a
 * secondary objective were added (minimise the total amount moved, weight by who is
 * willing to pay whom), which the DP cannot express.
 */
public final class SettlementCalculator {

    /**
     * Above this many non-zero balances, fall back to greedy. Sub-mask enumeration is
     * O(3^n) in the worst case; 3^18 is a few hundred milliseconds, and expense-sharing
     * groups this large are already unusual.
     */
    public static final int OPTIMAL_MAX_MEMBERS = 18;

    private SettlementCalculator() {
    }

    /** Uses {@link #optimal} when the group is small enough, {@link #greedy} otherwise. */
    public static SettlementPlan settle(Map<UUID, Long> netCents) {
        List<Account> accounts = nonZeroAccounts(netCents);
        return accounts.size() <= OPTIMAL_MAX_MEMBERS
                ? new SettlementPlan(optimal(accounts), SettlementPlan.Strategy.OPTIMAL)
                : new SettlementPlan(greedy(accounts), SettlementPlan.Strategy.GREEDY);
    }

    public static List<Transfer> greedy(Map<UUID, Long> netCents) {
        return greedy(nonZeroAccounts(netCents));
    }

    public static List<Transfer> optimal(Map<UUID, Long> netCents) {
        return optimal(nonZeroAccounts(netCents));
    }

    private static List<Transfer> greedy(List<Account> accounts) {
        // Ties are broken by UUID so that the output is reproducible: without it the plan
        // would depend on map iteration order.
        Comparator<Account> mostNegativeFirst =
                Comparator.comparingLong(Account::cents).thenComparing(Account::id);
        Comparator<Account> mostPositiveFirst =
                Comparator.comparingLong(Account::cents).reversed().thenComparing(Account::id);

        PriorityQueue<Account> debtors = new PriorityQueue<>(mostNegativeFirst);
        PriorityQueue<Account> creditors = new PriorityQueue<>(mostPositiveFirst);
        for (Account account : accounts) {
            (account.cents() < 0 ? debtors : creditors).add(account);
        }

        List<Transfer> transfers = new ArrayList<>();
        while (!debtors.isEmpty() && !creditors.isEmpty()) {
            Account debtor = debtors.poll();
            Account creditor = creditors.poll();

            long amount = Math.min(-debtor.cents(), creditor.cents());
            transfers.add(new Transfer(debtor.id(), creditor.id(), amount));

            long debtorLeft = debtor.cents() + amount;
            long creditorLeft = creditor.cents() - amount;
            if (debtorLeft != 0) {
                debtors.add(new Account(debtor.id(), debtorLeft));
            }
            if (creditorLeft != 0) {
                creditors.add(new Account(creditor.id(), creditorLeft));
            }
        }
        return transfers;
    }

    private static List<Transfer> optimal(List<Account> accounts) {
        int n = accounts.size();
        if (n == 0) {
            return List.of();
        }
        if (n > OPTIMAL_MAX_MEMBERS) {
            throw new IllegalArgumentException("optimal settlement is limited to "
                    + OPTIMAL_MAX_MEMBERS + " non-zero balances, got " + n);
        }

        int full = (1 << n) - 1;

        // subsetSum[mask] = sum of the balances selected by mask.
        long[] subsetSum = new long[full + 1];
        for (int mask = 1; mask <= full; mask++) {
            int lowestIndex = Integer.numberOfTrailingZeros(mask);
            subsetSum[mask] = subsetSum[mask & (mask - 1)] + accounts.get(lowestIndex).cents();
        }

        // groups[mask] = max number of zero-sum subsets mask can be partitioned into, or -1
        // if it cannot be partitioned at all. chosenSubset[mask] remembers one such subset,
        // so the partition can be rebuilt rather than merely counted.
        int[] groups = new int[full + 1];
        int[] chosenSubset = new int[full + 1];
        Arrays.fill(groups, -1);
        groups[0] = 0;

        for (int mask = 1; mask <= full; mask++) {
            if (subsetSum[mask] != 0) {
                continue; // a mask that does not sum to zero is not partitionable
            }
            // Pinning the lowest set bit into the subset enumerates each partition once and
            // guarantees rest < mask, so groups[rest] is already final.
            int lowestBit = mask & -mask;
            for (int subset = mask; subset > 0; subset = (subset - 1) & mask) {
                if ((subset & lowestBit) == 0 || subsetSum[subset] != 0) {
                    continue;
                }
                int rest = mask ^ subset;
                if (groups[rest] >= 0 && groups[rest] + 1 > groups[mask]) {
                    groups[mask] = groups[rest] + 1;
                    chosenSubset[mask] = subset;
                }
            }
        }

        if (groups[full] < 0) {
            // Unreachable: nonZeroAccounts already rejects balances that do not sum to zero.
            throw new IllegalStateException("net balances do not sum to zero");
        }

        List<Transfer> transfers = new ArrayList<>();
        for (int mask = full; mask != 0; ) {
            int subset = chosenSubset[mask];
            transfers.addAll(greedy(select(accounts, subset)));
            mask ^= subset;
        }
        return transfers;
    }

    private static List<Account> select(List<Account> accounts, int mask) {
        List<Account> selected = new ArrayList<>(Integer.bitCount(mask));
        for (int i = 0; i < accounts.size(); i++) {
            if ((mask & (1 << i)) != 0) {
                selected.add(accounts.get(i));
            }
        }
        return selected;
    }

    private static List<Account> nonZeroAccounts(Map<UUID, Long> netCents) {
        long total = netCents.values().stream().mapToLong(Long::longValue).sum();
        if (total != 0) {
            throw new IllegalArgumentException("net balances must sum to zero but summed to " + total);
        }
        return netCents.entrySet().stream()
                .filter(entry -> entry.getValue() != 0)
                .map(entry -> new Account(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(Account::id))
                .toList();
    }

    private record Account(UUID id, long cents) {
    }
}
