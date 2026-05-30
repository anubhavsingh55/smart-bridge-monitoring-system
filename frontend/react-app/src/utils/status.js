const thresholds = {
  temperature: { warning: 35, critical: 45 },
  humidity: { warning: 70, critical: 85 },
  vibration: { warning: 1.5, critical: 2.0 },
  battery: { warning: 50, critical: 20 },
};

const normalizeValue = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getMetricStatus = (metric, value) => {
  const numericValue = normalizeValue(value);
  if (numericValue === null) {
    return { label: "Unknown", tone: "neutral" };
  }

  if (metric === "battery") {
    if (numericValue < thresholds.battery.critical) {
      return { label: "Critical", tone: "critical" };
    }
    if (numericValue <= thresholds.battery.warning) {
      return { label: "Warning", tone: "warning" };
    }
    return { label: "Healthy", tone: "healthy" };
  }

  const { warning, critical } = thresholds[metric] || {};
  if (critical !== undefined && numericValue > critical) {
    return { label: "Critical", tone: "critical" };
  }
  if (warning !== undefined && numericValue >= warning) {
    return { label: "Warning", tone: "warning" };
  }
  return { label: "Healthy", tone: "healthy" };
};

export const getOverallStatus = (reading) => {
  if (!reading) {
    return { label: "Unknown", tone: "neutral" };
  }

  const metrics = [
    getMetricStatus("temperature", reading.temperature),
    getMetricStatus("humidity", reading.humidity),
    getMetricStatus("vibration", reading.vibration),
    getMetricStatus("battery", reading.battery_level),
  ];

  if (metrics.some((metric) => metric.tone === "critical")) {
    return { label: "Critical", tone: "critical" };
  }
  if (metrics.some((metric) => metric.tone === "warning")) {
    return { label: "Warning", tone: "warning" };
  }
  if (metrics.every((metric) => metric.tone === "healthy")) {
    return { label: "Healthy", tone: "healthy" };
  }
  return { label: "Unknown", tone: "neutral" };
};

export const getConnectionHealth = (secondsSinceUpdate) => {
  if (secondsSinceUpdate === null || secondsSinceUpdate === undefined) {
    return { label: "Unknown", tone: "neutral" };
  }
  if (secondsSinceUpdate <= 10) {
    return { label: "Healthy", tone: "healthy" };
  }
  if (secondsSinceUpdate <= 20) {
    return { label: "Warning", tone: "warning" };
  }
  return { label: "Critical", tone: "critical" };
};
