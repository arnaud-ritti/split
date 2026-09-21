package com.arkoder.split.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * A group of people sharing expenses. Its {@link #getId() id} is the shareable link:
 * there is no authentication, knowing the UUID is what grants access.
 */
@Entity
@Table(name = "expense_group")
public class ExpenseGroup {

    @Id
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GroupMember> members = new ArrayList<>();

    protected ExpenseGroup() {
        // for JPA
    }

    public ExpenseGroup(String name) {
        this.id = UUID.randomUUID();
        this.name = name;
        this.createdAt = Instant.now();
    }

    public GroupMember addMember(String memberName) {
        GroupMember member = new GroupMember(this, memberName);
        members.add(member);
        return member;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public List<GroupMember> getMembers() {
        return members;
    }

    @Override
    public boolean equals(Object other) {
        return other instanceof ExpenseGroup that && id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
