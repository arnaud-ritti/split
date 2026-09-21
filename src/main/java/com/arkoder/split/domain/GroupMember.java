package com.arkoder.split.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "group_member",
        uniqueConstraints = @UniqueConstraint(name = "uq_group_member_group_name",
                columnNames = {"group_id", "name"}))
public class GroupMember {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @Column(nullable = false, length = 100)
    private String name;

    protected GroupMember() {
        // for JPA
    }

    GroupMember(ExpenseGroup group, String name) {
        this.id = UUID.randomUUID();
        this.group = group;
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public ExpenseGroup getGroup() {
        return group;
    }

    public String getName() {
        return name;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof GroupMember that && id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
