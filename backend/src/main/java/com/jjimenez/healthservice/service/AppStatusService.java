package com.jjimenez.healthservice.service;

import com.jjimenez.healthservice.config.AppsProperties;
import com.jjimenez.healthservice.model.AppStatusDTO;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.List;
import java.util.ArrayList;

@Service
public class AppStatusService {

    private final AppsProperties appsProperties;

    public AppStatusService(AppsProperties appsProperties) {
        this.appsProperties = appsProperties;
    }

    private boolean isUnitActive(String unitName) throws IOException, InterruptedException {
        ProcessBuilder builder = new ProcessBuilder("systemctl", "is-active", unitName);
        Process process = builder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String output = reader.readLine();
        process.waitFor();
        return "active".equals(output);
    }

    private static final DateTimeFormatter ACTIVE_ENTER_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("EEE yyyy-MM-dd HH:mm:ss zzz", Locale.ENGLISH);

    private Long getUptimeSeconds(String unitName) throws IOException, InterruptedException {
        ProcessBuilder builder = new ProcessBuilder("systemctl", "show", unitName, "--property=ActiveEnterTimestamp");
        Process process = builder.start();
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String output = reader.readLine();
        process.waitFor();

        String timestampPart = output.split("=", 2)[1].trim();
        if (timestampPart.isBlank()) {
            return null;
        }

        ZonedDateTime startTime = ZonedDateTime.parse(timestampPart, ACTIVE_ENTER_TIMESTAMP_FORMAT);
        return Duration.between(startTime, ZonedDateTime.now(startTime.getZone())).getSeconds();
    }

    public List<AppStatusDTO> getAppStatuses() throws IOException, InterruptedException {
        List<AppStatusDTO> statuses = new ArrayList<>();
        
        for (AppsProperties.Entry entry: appsProperties.apps()) {

            boolean isActive = isUnitActive(entry.systemdUnit());
            Long uptimeSeconds = isActive ? getUptimeSeconds(entry.systemdUnit()) : null;
            statuses.add(new AppStatusDTO(entry.name(), isActive, uptimeSeconds));
        }

        return statuses;

    }
    
}
