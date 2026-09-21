package com.arkoder.split.web.dto;

import com.arkoder.split.domain.GroupMember;
import java.util.UUID;

public record MemberResponse(UUID id, String name) {

    public static MemberResponse from(GroupMember member) {
        return new MemberResponse(member.getId(), member.getName());
    }
}
