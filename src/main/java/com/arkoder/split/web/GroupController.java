package com.arkoder.split.web;

import com.arkoder.split.service.GroupService;
import com.arkoder.split.web.dto.AddMemberRequest;
import com.arkoder.split.web.dto.CreateGroupRequest;
import com.arkoder.split.web.dto.GroupResponse;
import com.arkoder.split.web.dto.MemberResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/groups")
class GroupController {

    private final GroupService groupService;

    GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    ResponseEntity<GroupResponse> create(@Valid @RequestBody CreateGroupRequest request) {
        GroupResponse group = groupService.create(request.name());
        return ResponseEntity.created(URI.create("/groups/" + group.id())).body(group);
    }

    @GetMapping("/{groupId}")
    GroupResponse get(@PathVariable UUID groupId) {
        return groupService.get(groupId);
    }

    @PostMapping("/{groupId}/members")
    ResponseEntity<MemberResponse> addMember(@PathVariable UUID groupId,
                                             @Valid @RequestBody AddMemberRequest request) {
        MemberResponse member = groupService.addMember(groupId, request.name());
        return ResponseEntity.created(URI.create("/groups/" + groupId)).body(member);
    }
}
