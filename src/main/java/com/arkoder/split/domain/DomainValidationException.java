package com.arkoder.split.domain;

/**
 * A request is syntactically valid but breaks a business rule that Bean Validation cannot
 * express on its own, typically because it involves other rows. Mapped to 422.
 */
public class DomainValidationException extends RuntimeException {

    public DomainValidationException(String message) {
        super(message);
    }
}
