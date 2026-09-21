package com.arkoder.split;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * The only source of a datasource in this project: there is no compose file and no
 * {@code spring.datasource.*} in application.properties. Imported by the integration test
 * and by {@link TestSplitApplication} for local runs, so both hit the same Postgres.
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
