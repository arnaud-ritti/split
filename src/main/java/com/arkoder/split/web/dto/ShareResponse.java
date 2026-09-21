package com.arkoder.split.web.dto;

import com.arkoder.split.domain.ExpenseShare;
import java.math.BigDecimal;
import java.util.UUID;

public record ShareResponse(UUID memberId, String memberName, BigDecimal amount) {

    public static ShareResponse from(ExpenseShare share) {
        return new ShareResponse(share.getMember().getId(), share.getMember().getName(), share.getAmount());
    }
}
