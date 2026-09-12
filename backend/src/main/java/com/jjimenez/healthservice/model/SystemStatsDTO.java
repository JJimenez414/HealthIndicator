package com.jjimenez.healthservice.model;

public record SystemStatsDTO(double cpuLoadPercent, Double cpuTempCelsius, long ramTotalBytes, long ramUsedBytes, long storageTotalBytes, long storageUsedBytes) {
}
