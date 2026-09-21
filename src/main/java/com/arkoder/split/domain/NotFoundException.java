package com.arkoder.split.domain;

import java.util.UUID;

/** A resource addressed by id does not exist. Mapped to 404 by the web layer. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String resource, UUID id) {
        super(resource + " " + id + " was not found");
    }
}
