package com.jjimenez.healthservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

@ConfigurationProperties(prefix = "healthcheck")
public record AppsProperties (List<Entry> apps) {

    public record Entry(String name, String systemdUnit){
    }

}
