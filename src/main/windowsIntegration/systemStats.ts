import si from 'systeminformation'

export interface SystemStatsSnapshot {
  cpuLoad: number
  memUsedPercent: number
  diskUsedPercent: number
  batteryPercent: number | null
  isCharging: boolean | null
  temperatureC: number | null
}

/** Real, live system telemetry for the post-auth security dashboard. */
export async function getSystemStats(): Promise<SystemStatsSnapshot> {
  const [cpu, mem, disks, battery, temp] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.battery(),
    si.cpuTemperature()
  ])

  const primaryDisk = disks[0]
  const diskUsedPercent = primaryDisk ? primaryDisk.use : 0

  return {
    cpuLoad: Math.round(cpu.currentLoad),
    memUsedPercent: Math.round((mem.active / mem.total) * 100),
    diskUsedPercent: Math.round(diskUsedPercent),
    batteryPercent: battery.hasBattery ? Math.round(battery.percent) : null,
    isCharging: battery.hasBattery ? battery.isCharging : null,
    temperatureC: temp.main > 0 ? Math.round(temp.main) : null
  }
}
