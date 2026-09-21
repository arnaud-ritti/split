package com.arkoder.split.service;

import com.arkoder.split.domain.DomainValidationException;
import com.arkoder.split.domain.Expense;
import com.arkoder.split.domain.ExpenseGroup;
import com.arkoder.split.domain.GroupMember;
import com.arkoder.split.domain.NotFoundException;
import com.arkoder.split.domain.ShareSplitter;
import com.arkoder.split.repository.ExpenseGroupRepository;
import com.arkoder.split.repository.ExpenseRepository;
import com.arkoder.split.web.dto.CreateExpenseRequest;
import com.arkoder.split.web.dto.ExpenseResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ExpenseService {

    private final ExpenseGroupRepository groups;
    private final ExpenseRepository expenses;

    public ExpenseService(ExpenseGroupRepository groups, ExpenseRepository expenses) {
        this.groups = groups;
        this.expenses = expenses;
    }

    @Transactional
    public ExpenseResponse create(UUID groupId, CreateExpenseRequest request) {
        ExpenseGroup group = groups.findByIdWithMembers(groupId)
                .orElseThrow(() -> new NotFoundException("Group", groupId));

        Map<UUID, GroupMember> membersById = group.getMembers().stream()
                .collect(Collectors.toMap(GroupMember::getId, Function.identity()));

        GroupMember payer = membersById.get(request.payerId());
        if (payer == null) {
            throw new DomainValidationException(
                    "Payer " + request.payerId() + " is not a member of group " + groupId);
        }
        List<UUID> strangers = request.participantIds().stream()
                .filter(id -> !membersById.containsKey(id))
                .sorted()
                .toList();
        if (!strangers.isEmpty()) {
            throw new DomainValidationException(
                    "Participants are not members of group " + groupId + ": " + strangers);
        }

        Expense expense = new Expense(group, payer, request.description(), request.amount());
        Map<UUID, BigDecimal> shares = ShareSplitter.splitEqually(request.amount(), request.participantIds());
        shares.forEach((memberId, amount) -> expense.addShare(membersById.get(memberId), amount));

        return ExpenseResponse.from(expenses.save(expense));
    }

    public List<ExpenseResponse> list(UUID groupId) {
        if (!groups.existsById(groupId)) {
            throw new NotFoundException("Group", groupId);
        }
        return expenses.findAllForGroup(groupId).stream().map(ExpenseResponse::from).toList();
    }
}
