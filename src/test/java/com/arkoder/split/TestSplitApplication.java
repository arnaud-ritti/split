package com.arkoder.split;

import org.springframework.boot.SpringApplication;

/**
 * Local entry point: starts the app with a Postgres container attached.
 * Run it with {@code ./mvnw spring-boot:test-run} or straight from the IDE.
 */
public class TestSplitApplication {

    public static void main(String[] args) {
        SpringApplication.from(SplitApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
