package com.arkoder.split.web.dto;

import com.arkoder.split.domain.SettlementPlan;
import java.util.List;

/**
 * @param strategy which algorithm produced this plan. OPTIMAL guarantees the minimum
 *                 number of transfers; GREEDY is the fallback used for groups too large
 *                 to solve exactly, and may use more transfers than strictly necessary.
 */
public record SettlementResponse(
        SettlementPlan.Strategy strategy,
        int transferCount,
        List<TransferResponse> transfers) {
}
