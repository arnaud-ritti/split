package com.arkoder.split.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferResponse(UUID fromId, String fromName, UUID toId, String toName, BigDecimal amount) {
}
