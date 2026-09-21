package com.arkoder.split.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * One expense paid by a single member on behalf of a set of participants.
 *
 * <p>The per-participant {@link ExpenseShare shares} are computed once, at creation time,
 * and persisted alongside the expense rather than recomputed on every read. That keeps the
 * cent-rounding decision auditable row by row, and means a future change to the splitting
 * rule does not silently rewrite history.
 */
@Entity
@Table(name = "expense")
public class Expense {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payer_id", nullable = false)
    private GroupMember payer;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseShare> shares = new ArrayList<>();

    protected Expense() {
        // for JPA
    }

    public Expense(ExpenseGroup group, GroupMember payer, String description, BigDecimal amount) {
        this.id = UUID.randomUUID();
        this.group = group;
        this.payer = payer;
        this.description = description;
        this.amount = amount;
        this.createdAt = Instant.now();
    }

    public ExpenseShare addShare(GroupMember member, BigDecimal shareAmount) {
        ExpenseShare share = new ExpenseShare(this, member, shareAmount);
        shares.add(share);
        return share;
    }

    public UUID getId() {
        return id;
    }

    public ExpenseGroup getGroup() {
        return group;
    }

    public GroupMember getPayer() {
        return payer;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<ExpenseShare> getShares() {
        return shares;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof Expense that && id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
