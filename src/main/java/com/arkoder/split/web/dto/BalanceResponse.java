package com.arkoder.split.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Net position of one member. Positive means the group owes them money, negative means
 * they owe the group. Across a group these always sum to exactly zero.
 */
public record BalanceResponse(UUID memberId, String memberName, BigDecimal net) {
}
