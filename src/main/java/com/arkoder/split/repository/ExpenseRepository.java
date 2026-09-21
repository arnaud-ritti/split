package com.arkoder.split.repository;

import com.arkoder.split.domain.Expense;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    /**
     * One query for the whole ledger of a group: payer, shares and share holders are all
     * join-fetched, so neither balance computation nor response mapping triggers an N+1.
     */
    @Query("""
            select e from Expense e
            join fetch e.payer
            left join fetch e.shares s
            left join fetch s.member
            where e.group.id = :groupId
            order by e.createdAt
            """)
    List<Expense> findAllForGroup(UUID groupId);
}
