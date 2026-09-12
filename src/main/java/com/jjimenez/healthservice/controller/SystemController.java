package com.jjimenez.healthservice.controller;

import com.jjimenez.healthservice.service.SystemMetricsService;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import com.jjimenez.healthservice.model.SystemStatsDTO;

@RestController
public class SystemController {

    private final SystemMetricsService systemMetricsService;
    
    public SystemController(SystemMetricsService systemMetricsService){
        this.systemMetricsService = systemMetricsService;
    }

    @GetMapping("/api/system")
    public SystemStatsDTO getStats(){
        return systemMetricsService.getStats();
    }

}
