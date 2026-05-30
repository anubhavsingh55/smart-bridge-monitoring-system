export const formatNumber = (value, fallback = "--") => {
  if (Number.isNaN(value) || value === null || value === undefined) {
    return fallback;
  }
  return Number(value).toFixed(2);
};

export const formatTimestamp = (value) => {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

export const formatRelativeSeconds = (date) => {
  if (!date) {
    return "--";
  }
  const deltaSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }
  const minutes = Math.floor(deltaSeconds / 60);
  return `${minutes}m ago`;
};
