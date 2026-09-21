package com.arkoder.split.service;

import com.arkoder.split.domain.BalanceCalculator;
import com.arkoder.split.domain.ExpenseEntry;
import com.arkoder.split.domain.ExpenseGroup;
import com.arkoder.split.domain.GroupMember;
import com.arkoder.split.domain.Money;
import com.arkoder.split.domain.NotFoundException;
import com.arkoder.split.domain.SettlementCalculator;
import com.arkoder.split.domain.SettlementPlan;
import com.arkoder.split.repository.ExpenseGroupRepository;
import com.arkoder.split.repository.ExpenseRepository;
import com.arkoder.split.web.dto.BalanceResponse;
import com.arkoder.split.web.dto.SettlementResponse;
import com.arkoder.split.web.dto.TransferResponse;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bridges the persisted ledger and the pure calculators: it loads the group and its
 * expenses, hands plain cents and ids to {@link BalanceCalculator} and
 * {@link SettlementCalculator}, then puts the member names back on the results.
 */
@Service
@Transactional(readOnly = true)
public class BalanceService {

    private final ExpenseGroupRepository groups;
    private final ExpenseRepository expenses;

    public BalanceService(ExpenseGroupRepository groups, ExpenseRepository expenses) {
        this.groups = groups;
        this.expenses = expenses;
    }

    public List<BalanceResponse> balances(UUID groupId) {
        Ledger ledger = load(groupId);
        return toBalanceResponses(ledger);
    }

    public SettlementResponse settlements(UUID groupId) {
        Ledger ledger = load(groupId);
        SettlementPlan plan = SettlementCalculator.settle(ledger.netCents());

        List<TransferResponse> transfers = plan.transfers().stream()
                .map(transfer -> new TransferResponse(
                        transfer.from(), ledger.nameOf(transfer.from()),
                        transfer.to(), ledger.nameOf(transfer.to()),
                        Money.fromCents(transfer.amountCents())))
                .toList();

        return new SettlementResponse(plan.strategy(), plan.transferCount(), transfers);
    }

    private List<BalanceResponse> toBalanceResponses(Ledger ledger) {
        return ledger.netCents().entrySet().stream()
                .map(entry -> new BalanceResponse(
                        entry.getKey(), ledger.nameOf(entry.getKey()), Money.fromCents(entry.getValue())))
                .sorted(Comparator.comparing(balance -> balance.memberName().toLowerCase()))
                .toList();
    }

    private Ledger load(UUID groupId) {
        ExpenseGroup group = groups.findByIdWithMembers(groupId)
                .orElseThrow(() -> new NotFoundException("Group", groupId));

        Map<UUID, String> namesById = group.getMembers().stream()
                .collect(Collectors.toMap(GroupMember::getId, GroupMember::getName));

        List<ExpenseEntry> entries = expenses.findAllForGroup(groupId).stream()
                .map(ExpenseEntry::from)
                .toList();

        return new Ledger(namesById, BalanceCalculator.netCents(namesById.keySet(), entries));
    }

    private record Ledger(Map<UUID, String> namesById, Map<UUID, Long> netCents) {

        String nameOf(UUID memberId) {
            return namesById.get(memberId);
        }
    }
}
