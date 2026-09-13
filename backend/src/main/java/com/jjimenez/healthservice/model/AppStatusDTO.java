package com.jjimenez.healthservice.model;

public record AppStatusDTO(String name, boolean running, Long uptimeSeconds) {
}
