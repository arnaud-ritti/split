package com.arkoder.split.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * There is no authentication by design: a group is reachable by anyone holding its UUID,
 * which is the shareable link. Spring Security is still on the classpath, so without this
 * chain every endpoint would answer 401.
 *
 * <p>CSRF is disabled because this is a stateless API with no cookie-based session, and it
 * is the only thing that would otherwise reject POSTs from curl or Swagger UI. HTTP Basic
 * and the login form are switched off so no request can end up challenged; the in-memory
 * user that would go with them is excluded in application.properties.
 */
@Configuration(proxyBeanMethods = false)
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(requests -> requests.anyRequest().permitAll())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .build();
    }
}
