package com.arkoder.split.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddMemberRequest(@NotBlank @Size(max = 100) String name) {
}
