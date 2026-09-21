package com.arkoder.split.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

/** What a single participant owes for a single expense. */
@Entity
@Table(name = "expense_share",
        uniqueConstraints = @UniqueConstraint(name = "uq_expense_share_expense_member",
                columnNames = {"expense_id", "member_id"}))
public class ExpenseShare {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private GroupMember member;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    protected ExpenseShare() {
        // for JPA
    }

    ExpenseShare(Expense expense, GroupMember member, BigDecimal amount) {
        this.id = UUID.randomUUID();
        this.expense = expense;
        this.member = member;
        this.amount = amount;
    }

    public UUID getId() {
        return id;
    }

    public Expense getExpense() {
        return expense;
    }

    public GroupMember getMember() {
        return member;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof ExpenseShare that && id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
