import { calculateHealthScore } from "./healthScore";
import { getMetricStatus, getOverallStatus } from "./status";

const resolveTone = (status) => {
  if (!status) {
    return null;
  }
  if (typeof status === "string") {
    return status.toLowerCase();
  }
  if (typeof status === "object") {
    if (status.tone) {
      return String(status.tone).toLowerCase();
    }
    if (status.label) {
      return String(status.label).toLowerCase();
    }
  }
  return null;
};

const resolveScore = (reading) => {
  if (!reading) {
    return null;
  }
  const candidates = [
    reading.healthScore,
    reading.health_score,
    reading.score,
  ];
  const explicitScore = candidates.find((value) => value !== undefined);
  if (explicitScore !== undefined) {
    const numeric = Number(explicitScore);
    return Number.isNaN(numeric) ? null : numeric;
  }
  return calculateHealthScore(reading).score;
};

export const generateRecommendations = (reading) => {
  const recommendations = [];
  const seen = new Set();
  const safeReading = reading ?? {};

  const addRecommendation = (message) => {
    if (!message || seen.has(message)) {
      return;
    }
    seen.add(message);
    recommendations.push(message);
  };

  const statusSource = safeReading.status ?? getOverallStatus(safeReading);
  const statusTone = resolveTone(statusSource);
  const healthScore = resolveScore(safeReading);

  if (statusTone === "critical") {
    addRecommendation("Immediate engineering intervention required.");
  }

  if (healthScore !== null && healthScore < 70) {
    addRecommendation("Comprehensive bridge inspection recommended.");
  }

  const temperatureStatus = getMetricStatus(
    "temperature",
    safeReading.temperature
  );
  if (temperatureStatus.tone === "critical") {
    addRecommendation("Immediate thermal stress inspection required.");
  } else if (temperatureStatus.tone === "warning") {
    addRecommendation("Inspect thermal expansion joints.");
  }

  const humidityStatus = getMetricStatus("humidity", safeReading.humidity);
  if (humidityStatus.tone === "critical") {
    addRecommendation("Potential corrosion risk. Engineering review recommended.");
  } else if (humidityStatus.tone === "warning") {
    addRecommendation("Inspect drainage systems and waterproofing.");
  }

  const vibrationStatus = getMetricStatus("vibration", safeReading.vibration);
  if (vibrationStatus.tone === "critical") {
    addRecommendation("Urgent structural inspection required.");
  } else if (vibrationStatus.tone === "warning") {
    addRecommendation("Inspect structural supports and fasteners.");
  }

  const batteryStatus = getMetricStatus(
    "battery",
    safeReading.battery ?? safeReading.battery_level
  );
  if (batteryStatus.tone === "critical") {
    addRecommendation("Replace sensor battery immediately.");
  } else if (batteryStatus.tone === "warning") {
    addRecommendation("Schedule sensor battery replacement.");
  }

  return { recommendations };
};
