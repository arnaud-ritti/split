package com.arkoder.split.web;

import com.arkoder.split.service.BalanceService;
import com.arkoder.split.web.dto.BalanceResponse;
import com.arkoder.split.web.dto.SettlementResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/groups/{groupId}")
class BalanceController {

    private final BalanceService balanceService;

    BalanceController(BalanceService balanceService) {
        this.balanceService = balanceService;
    }

    /** Net position of every member. Always sums to exactly zero. */
    @GetMapping("/balances")
    List<BalanceResponse> balances(@PathVariable UUID groupId) {
        return balanceService.balances(groupId);
    }

    /** The transfers that clear those balances, with the strategy used to find them. */
    @GetMapping("/settlements")
    SettlementResponse settlements(@PathVariable UUID groupId) {
        return balanceService.settlements(groupId);
    }
}
