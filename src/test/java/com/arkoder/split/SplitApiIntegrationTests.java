package com.arkoder.split;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Full stack against a real Postgres: Liquibase builds the schema, {@code ddl-auto=validate}
 * then checks the entities still match it, and the whole request path runs end to end.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SplitApiIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("a weekend away: two expenses, three people, one reimbursement")
    void settlesAWholeGroup() throws Exception {
        UUID groupId = createGroup("Week-end Annecy");
        UUID alice = addMember(groupId, "Alice");
        UUID bob = addMember(groupId, "Bob");
        UUID carol = addMember(groupId, "Carol");

        // Alice fronts the groceries, Bob the taxi; everyone takes part in both.
        addExpense(groupId, "Groceries", "60.00", alice, alice, bob, carol);
        addExpense(groupId, "Taxi", "30.00", bob, alice, bob, carol);

        mockMvc.perform(get("/groups/{groupId}/balances", groupId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].memberName").value("Alice"))
                .andExpect(jsonPath("$[0].net").value(30.00))
                .andExpect(jsonPath("$[1].memberName").value("Bob"))
                .andExpect(jsonPath("$[1].net").value(0.00))
                .andExpect(jsonPath("$[2].memberName").value("Carol"))
                .andExpect(jsonPath("$[2].net").value(-30.00));

        mockMvc.perform(get("/groups/{groupId}/settlements", groupId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.strategy").value("OPTIMAL"))
                .andExpect(jsonPath("$.transferCount").value(1))
                .andExpect(jsonPath("$.transfers[0].fromName").value("Carol"))
                .andExpect(jsonPath("$.transfers[0].toName").value("Alice"))
                .andExpect(jsonPath("$.transfers[0].amount").value(30.00));
    }

    @Test
    @DisplayName("an indivisible amount is stored share by share, without losing a cent")
    void persistsTheRoundedShares() throws Exception {
        UUID groupId = createGroup("Colocation");
        UUID alice = addMember(groupId, "Alice");
        UUID bob = addMember(groupId, "Bob");
        UUID carol = addMember(groupId, "Carol");

        String body = mockMvc.perform(post("/groups/{groupId}/expenses", groupId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description": "Pizza",
                                  "amount": "10.00",
                                  "payerId": "%s",
                                  "participantIds": ["%s", "%s", "%s"]
                                }
                                """.formatted(alice, alice, bob, carol)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shares.length()").value(3))
                .andReturn().getResponse().getContentAsString();

        double total = JsonPath.<java.util.List<Number>>read(body, "$.shares[*].amount").stream()
                .mapToDouble(Number::doubleValue)
                .sum();
        assertThat(total).isEqualTo(10.00);

        // One participant carries the extra cent, the other two do not.
        assertThat(JsonPath.<java.util.List<Number>>read(body, "$.shares[*].amount"))
                .extracting(Number::doubleValue)
                .containsExactlyInAnyOrder(3.34, 3.33, 3.33);
    }

    @Test
    @DisplayName("balances still sum to zero once the cents stop dividing evenly")
    void keepsUnevenGroupsBalanced() throws Exception {
        UUID groupId = createGroup("Cafe");
        UUID alice = addMember(groupId, "Alice");
        UUID bob = addMember(groupId, "Bob");
        UUID carol = addMember(groupId, "Carol");

        addExpense(groupId, "Coffee", "10.00", alice, alice, bob, carol);

        String body = mockMvc.perform(get("/groups/{groupId}/balances", groupId))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        double total = JsonPath.<java.util.List<Number>>read(body, "$[*].net").stream()
                .mapToDouble(Number::doubleValue)
                .sum();
        assertThat(total).isZero();
    }

    @Test
    void reportsAnUnknownGroup() throws Exception {
        mockMvc.perform(get("/groups/{groupId}/balances", UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource not found"));
    }

    @Test
    @DisplayName("a payer who belongs to another group is refused")
    void refusesAPayerFromAnotherGroup() throws Exception {
        UUID groupId = createGroup("Week-end");
        UUID alice = addMember(groupId, "Alice");
        UUID stranger = addMember(createGroup("Autre groupe"), "Stranger");

        mockMvc.perform(post("/groups/{groupId}/expenses", groupId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description": "Groceries",
                                  "amount": "60.00",
                                  "payerId": "%s",
                                  "participantIds": ["%s"]
                                }
                                """.formatted(stranger, alice)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.title").value("Request cannot be processed"));
    }

    @Test
    @DisplayName("actuator health is reachable, confirming the permit-all chain is in place")
    void exposesHealthWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    // --- helpers ----------------------------------------------------------------------

    private UUID createGroup(String name) throws Exception {
        String body = mockMvc.perform(post("/groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\"}".formatted(name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(body, "$.id"));
    }

    private UUID addMember(UUID groupId, String name) throws Exception {
        String body = mockMvc.perform(post("/groups/{groupId}/members", groupId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"%s\"}".formatted(name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(body, "$.id"));
    }

    private void addExpense(UUID groupId, String description, String amount, UUID payer, UUID... participants)
            throws Exception {
        String ids = java.util.Arrays.stream(participants)
                .map(id -> "\"" + id + "\"")
                .collect(java.util.stream.Collectors.joining(", "));

        mockMvc.perform(post("/groups/{groupId}/expenses", groupId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "description": "%s",
                                  "amount": "%s",
                                  "payerId": "%s",
                                  "participantIds": [%s]
                                }
                                """.formatted(description, amount, payer, ids)))
                .andExpect(status().isCreated());
    }
}
