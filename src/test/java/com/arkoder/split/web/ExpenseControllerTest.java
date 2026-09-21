package com.arkoder.split.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.arkoder.split.config.SecurityConfig;
import com.arkoder.split.domain.DomainValidationException;
import com.arkoder.split.domain.NotFoundException;
import com.arkoder.split.service.ExpenseService;
import com.arkoder.split.web.dto.CreateExpenseRequest;
import com.arkoder.split.web.dto.ExpenseResponse;
import com.arkoder.split.web.dto.ShareResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * SecurityConfig has to be imported explicitly: spring-boot-starter-security-test puts the
 * default (authenticating) filter chain into the slice, so without it every POST here would
 * come back as 401. Importing the real chain is better than switching filters off, since it
 * is the chain that actually ships.
 */
@WebMvcTest(ExpenseController.class)
@Import(SecurityConfig.class)
class ExpenseControllerTest {

    private static final UUID GROUP_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ALICE = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID BOB = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ExpenseService expenseService;

    @Test
    @DisplayName("creating an expense returns 201 with a Location header and the computed shares")
    void createsAnExpense() throws Exception {
        UUID expenseId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        given(expenseService.create(eq(GROUP_ID), any(CreateExpenseRequest.class)))
                .willReturn(new ExpenseResponse(
                        expenseId, "Groceries", new BigDecimal("60.00"), ALICE, "Alice", Instant.EPOCH,
                        List.of(new ShareResponse(ALICE, "Alice", new BigDecimal("30.00")),
                                new ShareResponse(BOB, "Bob", new BigDecimal("30.00")))));

        mockMvc.perform(post("/groups/{groupId}/expenses", GROUP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description": "Groceries",
                                  "amount": "60.00",
                                  "payerId": "%s",
                                  "participantIds": ["%s", "%s"]
                                }
                                """.formatted(ALICE, ALICE, BOB)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/groups/" + GROUP_ID + "/expenses/" + expenseId))
                .andExpect(jsonPath("$.payerName").value("Alice"))
                .andExpect(jsonPath("$.shares.length()").value(2));
    }

    @Test
    @DisplayName("a negative amount is rejected with a problem detail listing the offending field")
    void rejectsANegativeAmount() throws Exception {
        mockMvc.perform(post("/groups/{groupId}/expenses", GROUP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description": "Groceries",
                                  "amount": "-5.00",
                                  "payerId": "%s",
                                  "participantIds": ["%s"]
                                }
                                """.formatted(ALICE, ALICE)))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Validation failed"))
                .andExpect(jsonPath("$.errors[*].field").value("amount"));
    }

    @Test
    @DisplayName("an expense with no participant is rejected before reaching the service")
    void rejectsAnEmptyParticipantList() throws Exception {
        mockMvc.perform(post("/groups/{groupId}/expenses", GROUP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description": "Groceries",
                                  "amount": "60.00",
                                  "payerId": "%s",
                                  "participantIds": []
                                }
                                """.formatted(ALICE)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field").value("participantIds"));
    }

    @Test
    @DisplayName("an unknown group comes back as 404 problem+json")
    void reportsAnUnknownGroup() throws Exception {
        given(expenseService.list(GROUP_ID)).willThrow(new NotFoundException("Group", GROUP_ID));

        mockMvc.perform(get("/groups/{groupId}/expenses", GROUP_ID))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Resource not found"));
    }

    @Test
    @DisplayName("a payer outside the group is a 422, not a 400: the payload itself is fine")
    void reportsAPayerFromAnotherGroup() throws Exception {
        given(expenseService.create(eq(GROUP_ID), any(CreateExpenseRequest.class)))
                .willThrow(new DomainValidationException("Payer " + BOB + " is not a member of group " + GROUP_ID));

        mockMvc.perform(post("/groups/{groupId}/expenses", GROUP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description": "Groceries",
                                  "amount": "60.00",
                                  "payerId": "%s",
                                  "participantIds": ["%s"]
                                }
                                """.formatted(BOB, ALICE)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.title").value("Request cannot be processed"));
    }

    @Test
    @DisplayName("a group id that is not a UUID is a 400, not a 500")
    void rejectsAMalformedGroupId() throws Exception {
        mockMvc.perform(get("/groups/{groupId}/expenses", "not-a-uuid"))
                .andExpect(status().isBadRequest());
    }
}
