package com.jjimenez.healthservice.service;

import com.jjimenez.healthservice.model.SystemStatsDTO;
import org.springframework.stereotype.Service;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.Sensors;
import oshi.hardware.GlobalMemory;
import java.util.List;
import oshi.software.os.OSFileStore;

@Service
public class SystemMetricsService {

    private final SystemInfo systemInfo = new SystemInfo();

    public SystemStatsDTO getStats() {

        CentralProcessor processor = systemInfo.getHardware().getProcessor();
        double cpuLoad = processor.getSystemCpuLoad(1000)*100;

        HardwareAbstractionLayer hal = systemInfo.getHardware();

        Sensors sensors = hal.getSensors();
        double rawTemp = sensors.getCpuTemperature();
        Double cpuTemp = rawTemp <= 0 ? null : rawTemp;

        GlobalMemory memory = hal.getMemory();
        long ramTotal = memory.getTotal();
        long ramUsed = ramTotal - memory.getAvailable();        

        List<OSFileStore> fileStores = systemInfo.getOperatingSystem().getFileSystem().getFileStores();

        long storageTotal = 0;
        long storageUsed = 0;

        for (OSFileStore store : fileStores) {
            storageTotal += store.getTotalSpace();
            storageUsed += store.getTotalSpace() - store.getUsableSpace();
        }


        return new SystemStatsDTO(cpuLoad, cpuTemp, ramTotal, ramUsed, storageTotal, storageUsed);
    }
}
