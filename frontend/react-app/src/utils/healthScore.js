const normalizeValue = (value) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const clampScore = (value, min, max) => {
  if (value === null || value === undefined) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const scoreTemperature = (value) => {
  const temperature = normalizeValue(value);
  if (temperature === null) {
    return 0;
  }
  if (temperature <= 35) {
    return 25;
  }
  if (temperature <= 45) {
    const score = 25 - (temperature - 35) * 1.5;
    return clampScore(score, 10, 25);
  }
  return 0;
};

const scoreHumidity = (value) => {
  const humidity = normalizeValue(value);
  if (humidity === null) {
    return 0;
  }
  if (humidity <= 70) {
    return 20;
  }
  if (humidity <= 85) {
    const score = 20 - (humidity - 70);
    return clampScore(score, 5, 20);
  }
  return 0;
};

const scoreVibration = (value) => {
  const vibration = normalizeValue(value);
  if (vibration === null) {
    return 0;
  }
  if (vibration <= 1.5) {
    return 35;
  }
  if (vibration <= 2.0) {
    const score = 35 - (vibration - 1.5) * 50;
    return clampScore(score, 10, 35);
  }
  return 0;
};

const scoreBattery = (value) => {
  const battery = normalizeValue(value);
  if (battery === null) {
    return 0;
  }
  if (battery >= 50) {
    return 20;
  }
  if (battery >= 20) {
    const score = 5 + (battery - 20) * 0.5;
    return clampScore(score, 5, 20);
  }
  return 0;
};

export const calculateHealthScore = (reading) => {
  if (!reading) {
    return { score: 0, status: "Critical" };
  }

  const totalScore =
    scoreTemperature(reading.temperature) +
    scoreHumidity(reading.humidity) +
    scoreVibration(reading.vibration) +
    scoreBattery(reading.battery ?? reading.battery_level);

  const score = Math.round(clampScore(totalScore, 0, 100));
  const status = getHealthScoreStatus(score);

  return { score, status };
};

export const getHealthScoreStatus = (value) => {
  const numeric = normalizeValue(value);
  if (numeric === null) {
    return "Critical";
  }
  if (numeric >= 90) {
    return "Healthy";
  }
  if (numeric >= 70) {
    return "Warning";
  }
  return "Critical";
};
