package com.arkoder.split.web.dto;

import com.arkoder.split.domain.ExpenseGroup;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record GroupResponse(UUID id, String name, Instant createdAt, List<MemberResponse> members) {

    public static GroupResponse from(ExpenseGroup group) {
        List<MemberResponse> members = group.getMembers().stream()
                .sorted(Comparator.comparing(member -> member.getName().toLowerCase()))
                .map(MemberResponse::from)
                .toList();
        return new GroupResponse(group.getId(), group.getName(), group.getCreatedAt(), members);
    }
}
