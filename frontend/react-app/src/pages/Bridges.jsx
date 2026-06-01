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

const metricLabels = {
  temperature: "temperature",
  humidity: "humidity",
  vibration: "vibration",
  battery: "battery",
};

function Bridges() {
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

    return Array.from(latestByBridge.entries()).map(([bridgeId, reading]) => {
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
        metrics: [
          {
            label: "Temperature",
            value: formatNumber(reading.temperature),
            unit: "°C",
            status: getMetricStatus("temperature", reading.temperature),
          },
          {
            label: "Humidity",
            value: formatNumber(reading.humidity),
            unit: "%",
            status: getMetricStatus("humidity", reading.humidity),
          },
          {
            label: "Vibration",
            value: formatNumber(reading.vibration),
            unit: "m/s²",
            status: getMetricStatus("vibration", reading.vibration),
          },
          {
            label: "Battery",
            value: formatNumber(reading.battery_level),
            unit: "%",
            status: getMetricStatus("battery", reading.battery_level),
          },
        ],
      };
    });
  }, [sortedReadings]);

  const fleetSummary = useMemo(() => {
    const counts = { healthy: 0, warning: 0, critical: 0 };
    bridgeSnapshots.forEach((snapshot) => {
      if (snapshot.status.tone === "healthy") {
        counts.healthy += 1;
      } else if (snapshot.status.tone === "warning") {
        counts.warning += 1;
      } else if (snapshot.status.tone === "critical") {
        counts.critical += 1;
      }
    });
    return counts;
  }, [bridgeSnapshots]);

  const telemetryRows = useMemo(
    () =>
      bridgeSnapshots.map((snapshot) => ({
        id: snapshot.bridgeId,
        bridgeId: snapshot.bridgeId,
        temperature: formatNumber(snapshot.reading?.temperature),
        humidity: formatNumber(snapshot.reading?.humidity),
        vibration: formatNumber(snapshot.reading?.vibration),
        battery: formatNumber(snapshot.reading?.battery_level),
        timestamp: snapshot.lastUpdate,
        status: snapshot.status,
      })),
    [bridgeSnapshots]
  );

  const columns = [
    { key: "bridgeId", label: "Bridge ID" },
    { key: "temperature", label: "Temperature", align: "right" },
    { key: "humidity", label: "Humidity", align: "right" },
    { key: "vibration", label: "Vibration", align: "right" },
    { key: "battery", label: "Battery", align: "right" },
    { key: "timestamp", label: "Last Update" },
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

  const bridgeCount = bridgeSnapshots.length;

  return (
    <div className="bridges">
      <section className="page-section">
        <div className="section-heading">
          <div className="page-header">
            <h1>Bridges</h1>
            <div className="page-actions">
              <span className={`status-badge status-${overallStatus.tone}`}>
                Fleet {overallStatus.label}
              </span>
              <span className="data-freshness">
                Last Refresh: {formatRelativeSeconds(lastUpdatedAt)}
              </span>
            </div>
          </div>
          <p className="section-subtitle">
            Bridge fleet overview and structural health status.
          </p>
        </div>
        <div className="bridges-header-grid">
          <div className="card overview-card">
            <span className="overview-label">Bridges Online</span>
            <span className="overview-value">{bridgeCount}</span>
            <span className="overview-detail">Reporting live telemetry</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Healthy</span>
            <span className="overview-value tone-healthy">
              {fleetSummary.healthy}
            </span>
            <span className="overview-detail">Within nominal thresholds</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Warning</span>
            <span className="overview-value tone-warning">
              {fleetSummary.warning}
            </span>
            <span className="overview-detail">Investigate deviations</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Critical</span>
            <span className="overview-value tone-critical">
              {fleetSummary.critical}
            </span>
            <span className="overview-detail">Immediate attention</span>
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
            Refresh Interval: {refreshMs / 1000}s
          </span>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Bridge Health Overview</h2>
          <p className="section-subtitle">
            Latest health snapshot per bridge with key metric status.
          </p>
        </div>
        {bridgeSnapshots.length === 0 ? (
          <div className="card empty-state">No bridge telemetry available.</div>
        ) : (
          <div className="bridge-detail-grid">
            {bridgeSnapshots.map((snapshot) => (
              <div key={snapshot.bridgeId} className="bridge-detail-card">
                <BridgeCard
                  bridgeId={snapshot.bridgeId}
                  status={snapshot.status}
                  lastUpdate={snapshot.lastUpdate}
                  connection={snapshot.connection}
                />
                <div className="bridge-metric-grid">
                  {snapshot.metrics.map((metric) => (
                    <div key={metric.label} className="bridge-metric">
                      <span className="bridge-metric-label">{metric.label}</span>
                      <span className="bridge-metric-value">
                        {metric.value}
                        {metric.unit}
                      </span>
                      <span
                        className={`status-badge status-${metric.status.tone}`}
                      >
                        {metric.status.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Bridge Telemetry</h2>
          <p className="section-subtitle">
            Latest reading captured per bridge.
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={telemetryRows}
          emptyMessage="No bridge readings available yet."
        />
      </section>
    </div>
  );
}

export default Bridges;
