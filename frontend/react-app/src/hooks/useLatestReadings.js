import { useEffect, useState } from "react";

import api from "../services/api";

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLatestTimestamp = (data) => {
  const latest = data[0];
  return parseTimestamp(latest?.timestamp || latest?.created_at);
};

function useLatestReadings(refreshMs = 5000) {
  const [readings, setReadings] = useState([]);
  const [apiOnline, setApiOnline] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [lastResponseAt, setLastResponseAt] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const fetchReadings = async () => {
      try {
        const response = await api.get("/api/sensors/readings/latest");
        if (!isMounted) {
          return;
        }
        const data = Array.isArray(response.data) ? response.data : [];
        setReadings(data);
        setApiOnline(true);
        setLastUpdatedAt(getLatestTimestamp(data));
        setLastResponseAt(new Date());
      } catch (error) {
        if (isMounted) {
          setApiOnline(false);
          setReadings([]);
        }
      }
    };

    fetchReadings();
    intervalId = setInterval(fetchReadings, refreshMs);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [refreshMs]);

  return {
    readings,
    apiOnline,
    lastUpdatedAt,
    lastResponseAt,
  };
}

export default useLatestReadings;
