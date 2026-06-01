import { useMemo } from "react";

import BridgeCard from "../components/BridgeCard";
import DataTable from "../components/DataTable";
import useLatestReadings from "../hooks/useLatestReadings";
import {
  formatNumber,
  formatRelativeSeconds,
  formatTimestamp,
} from "../utils/formatters";
import {
  getConnectionHealth,
  getMetricStatus,
  getOverallStatus,
} from "../utils/status";

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getReadingTimestamp = (reading) =>
  parseTimestamp(reading?.timestamp || reading?.created_at);

const bridgeIds = ["Bridge_A", "Bridge_B", "Bridge_C", "Bridge_D"];

function LiveMonitoring() {
  const refreshMs = 5000;
  const { readings, apiOnline, lastUpdatedAt, lastResponseAt } =
    useLatestReadings(refreshMs);

  const sortedReadings = useMemo(() => {
    return [...readings].sort((first, second) => {
      const firstTime = getReadingTimestamp(first)?.getTime() || 0;
      const secondTime = getReadingTimestamp(second)?.getTime() || 0;
      return secondTime - firstTime;
    });
  }, [readings]);

  const latestReading = sortedReadings[0];
  const overallStatus = getOverallStatus(latestReading);

  const secondsSinceUpdate = useMemo(() => {
    if (!lastResponseAt) {
      return null;
    }
    return Math.round((Date.now() - lastResponseAt.getTime()) / 1000);
  }, [lastResponseAt]);

  const connectionHealth = getConnectionHealth(secondsSinceUpdate);

  const bridgeSnapshots = useMemo(() => {
    const latestByBridge = new Map();
    sortedReadings.forEach((reading) => {
      if (!latestByBridge.has(reading.bridge_id)) {
        latestByBridge.set(reading.bridge_id, reading);
      }
    });
    return bridgeIds.map((bridgeId) => {
      const reading = latestByBridge.get(bridgeId);
      const readingTimestamp = getReadingTimestamp(reading);
      const bridgeSeconds = readingTimestamp
        ? Math.round((Date.now() - readingTimestamp.getTime()) / 1000)
        : null;
      return {
        bridgeId,
        reading,
        lastUpdate: formatTimestamp(readingTimestamp),
        status: getOverallStatus(reading),
        connection: getConnectionHealth(bridgeSeconds),
      };
    });
  }, [sortedReadings]);

  const tableRows = useMemo(
    () =>
      sortedReadings.map((reading) => ({
        id: reading.id,
        bridgeId: reading.bridge_id,
        temperature: formatNumber(reading.temperature),
        humidity: formatNumber(reading.humidity),
        vibration: formatNumber(reading.vibration),
        battery: formatNumber(reading.battery_level),
        timestamp: formatTimestamp(getReadingTimestamp(reading)),
        status: getOverallStatus(reading),
      })),
    [sortedReadings]
  );

  const columns = [
    { key: "bridgeId", label: "Bridge ID" },
    { key: "temperature", label: "Temperature", align: "right" },
    { key: "humidity", label: "Humidity", align: "right" },
    { key: "vibration", label: "Vibration", align: "right" },
    { key: "battery", label: "Battery", align: "right" },
    { key: "timestamp", label: "Timestamp" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`status-badge status-${row.status.tone}`}>
          {row.status.label}
        </span>
      ),
    },
  ];

  const statusBreakdown = useMemo(() => {
    const counts = { healthy: 0, warning: 0, critical: 0 };
    sortedReadings.forEach((reading) => {
      const status = getOverallStatus(reading);
      if (status.tone === "healthy") {
        counts.healthy += 1;
      } else if (status.tone === "warning") {
        counts.warning += 1;
      } else if (status.tone === "critical") {
        counts.critical += 1;
      }
    });
    return counts;
  }, [sortedReadings]);

  const metricWarnings = useMemo(() => {
    const metrics = latestReading
      ? [
          getMetricStatus("temperature", latestReading.temperature),
          getMetricStatus("humidity", latestReading.humidity),
          getMetricStatus("vibration", latestReading.vibration),
          getMetricStatus("battery", latestReading.battery_level),
        ]
      : [];
    return metrics.filter((metric) => metric.tone !== "healthy").length;
  }, [latestReading]);

  return (
    <div className="live-monitoring">
      <section className="page-section">
        <div className="section-heading">
          <div className="page-header">
            <h1>Live Monitoring</h1>
            <div className="page-actions">
              <span className={`status-badge status-${overallStatus.tone}`}>
                System {overallStatus.label}
              </span>
              <span className="data-freshness">
                Last Refresh: {formatRelativeSeconds(lastUpdatedAt)}
              </span>
            </div>
          </div>
          <p className="section-subtitle">
            Real-time bridge telemetry streaming from the live sensor network.
          </p>
        </div>
        <div className="live-header-grid">
          <div className="card overview-card">
            <span className="overview-label">System Status</span>
            <span className={`overview-value tone-${overallStatus.tone}`}>
              {overallStatus.label}
            </span>
            <span className="overview-detail">
              {metricWarnings > 0
                ? `${metricWarnings} metrics require attention`
                : "All core metrics within range"}
            </span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Last Refresh Time</span>
            <span className="overview-value">
              {formatTimestamp(lastUpdatedAt)}
            </span>
            <span className="overview-detail">Latest sensor timestamp</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Refresh Interval</span>
            <span className="overview-value">{refreshMs / 1000}s</span>
            <span className="overview-detail">Polling cadence</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Records Loaded</span>
            <span className="overview-value">{sortedReadings.length}</span>
            <span className="overview-detail">
              Healthy {statusBreakdown.healthy} / Warning {statusBreakdown.warning} / Critical {statusBreakdown.critical}
            </span>
          </div>
        </div>
        <div className="status-strip">
          <span
            className={`status-badge status-${apiOnline ? "healthy" : "critical"}`}
          >
            API {apiOnline ? "Online" : "Offline"}
          </span>
          <span className={`status-badge status-${connectionHealth.tone}`}>
            Connection {connectionHealth.label}
          </span>
          <span className="status-badge status-neutral">
            Last Response: {formatRelativeSeconds(lastResponseAt)}
          </span>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Bridge Health Overview</h2>
          <p className="section-subtitle">
            Latest updates across critical bridge segments.
          </p>
        </div>
        <div className="bridge-overview-grid">
          {bridgeSnapshots.map((snapshot) => (
            <BridgeCard
              key={snapshot.bridgeId}
              bridgeId={snapshot.bridgeId}
              status={snapshot.status}
              lastUpdate={snapshot.lastUpdate}
              connection={snapshot.connection}
            />
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Live Sensor Data</h2>
          <p className="section-subtitle">
            Newest readings surface first. Scroll for historical entries.
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={tableRows}
          emptyMessage="Waiting for live sensor readings..."
        />
      </section>
    </div>
  );
}

export default LiveMonitoring;
