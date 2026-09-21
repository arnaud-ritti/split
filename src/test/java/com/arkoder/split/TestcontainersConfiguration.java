package com.arkoder.split;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * The only source of a datasource for tests and local runs: there is no
 * {@code spring.datasource.*} in application.properties. The compose file at the root sets
 * those properties, but it describes a deployed stack and never takes part here. Imported
 * by the integration test and by {@link TestSplitApplication}, so both hit the same
 * Postgres.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    @SuppressWarnings("rawtypes") // Testcontainers 2.x: PostgreSQLContainer is no longer generic
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer("postgres:18-alpine");
    }
}
