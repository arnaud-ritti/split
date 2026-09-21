package com.arkoder.split.repository;

import com.arkoder.split.domain.ExpenseGroup;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, UUID> {

    /**
     * Fetches the members in the same round trip. With {@code open-in-view=false} the
     * persistence context is gone by the time the response is serialised, so anything the
     * caller needs has to be loaded here.
     */
    @Query("select g from ExpenseGroup g left join fetch g.members where g.id = :id")
    Optional<ExpenseGroup> findByIdWithMembers(UUID id);
}
