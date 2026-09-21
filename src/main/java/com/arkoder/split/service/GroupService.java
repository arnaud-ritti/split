package com.arkoder.split.service;

import com.arkoder.split.domain.ExpenseGroup;
import com.arkoder.split.domain.GroupMember;
import com.arkoder.split.domain.NotFoundException;
import com.arkoder.split.repository.ExpenseGroupRepository;
import com.arkoder.split.web.dto.GroupResponse;
import com.arkoder.split.web.dto.MemberResponse;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GroupService {

    private final ExpenseGroupRepository groups;

    public GroupService(ExpenseGroupRepository groups) {
        this.groups = groups;
    }

    @Transactional
    public GroupResponse create(String name) {
        return GroupResponse.from(groups.save(new ExpenseGroup(name)));
    }

    public GroupResponse get(UUID groupId) {
        return GroupResponse.from(require(groupId));
    }

    @Transactional
    public MemberResponse addMember(UUID groupId, String memberName) {
        ExpenseGroup group = require(groupId);
        GroupMember member = group.addMember(memberName);
        groups.save(group);
        return MemberResponse.from(member);
    }

    private ExpenseGroup require(UUID groupId) {
        return groups.findByIdWithMembers(groupId)
                .orElseThrow(() -> new NotFoundException("Group", groupId));
    }
}
