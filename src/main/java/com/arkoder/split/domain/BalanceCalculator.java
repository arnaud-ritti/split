package com.arkoder.split.domain;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Net balance per member: {@code what they paid out} minus {@code what they owe}.
 *
 * <p>A positive balance means the group owes that member money; a negative one means they
 * owe the group. Because every expense's shares sum exactly to its amount
 * ({@link ShareSplitter}), the net balances sum exactly to zero — which is the precondition
 * {@link SettlementCalculator} relies on.
 */
public final class BalanceCalculator {

    private BalanceCalculator() {
    }

    /**
     * @param memberIds every member of the group, so that members with no activity still
     *                  appear with a zero balance
     * @return net balance in cents, keyed by member, in {@code memberIds} order
     */
    public static Map<UUID, Long> netCents(Collection<UUID> memberIds, Collection<ExpenseEntry> expenses) {
        Map<UUID, Long> net = new LinkedHashMap<>();
        memberIds.forEach(id -> net.put(id, 0L));

        for (ExpenseEntry expense : expenses) {
            net.merge(expense.payerId(), Money.toCents(expense.amount()), Long::sum);
            expense.shares().forEach((memberId, share) ->
                    net.merge(memberId, -Money.toCents(share), Long::sum));
        }
        return net;
    }
}
