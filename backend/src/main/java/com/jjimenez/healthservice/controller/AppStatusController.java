package com.jjimenez.healthservice.controller;

import com.jjimenez.healthservice.service.AppStatusService;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import com.jjimenez.healthservice.model.AppStatusDTO;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.ArrayList;
import java.io.IOException;

@RestController
public class AppStatusController {

    AppStatusService appStatus;

    public AppStatusController(AppStatusService appStatus) {
        this.appStatus = appStatus;
    }

    @GetMapping("/api/apps")
    public ResponseEntity<?> getStatus() {

        try {
            return ResponseEntity.ok(appStatus.getAppStatuses());
        } catch (IOException | InterruptedException e) {
            return ResponseEntity.internalServerError().body("Failed to check app statuses: " + e.getMessage());
        }

    }
}
