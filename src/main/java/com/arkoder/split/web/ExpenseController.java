package com.arkoder.split.web;

import com.arkoder.split.service.ExpenseService;
import com.arkoder.split.web.dto.CreateExpenseRequest;
import com.arkoder.split.web.dto.ExpenseResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/groups/{groupId}/expenses")
class ExpenseController {

    private final ExpenseService expenseService;

    ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    ResponseEntity<ExpenseResponse> create(@PathVariable UUID groupId,
                                           @Valid @RequestBody CreateExpenseRequest request) {
        ExpenseResponse expense = expenseService.create(groupId, request);
        return ResponseEntity
                .created(URI.create("/groups/" + groupId + "/expenses/" + expense.id()))
                .body(expense);
    }

    @GetMapping
    List<ExpenseResponse> list(@PathVariable UUID groupId) {
        return expenseService.list(groupId);
    }
}
