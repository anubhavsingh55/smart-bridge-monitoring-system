import { useEffect, useMemo, useState } from "react";

import BridgeCard from "../components/BridgeCard";
import DataTable from "../components/DataTable";
import useLatestReadings from "../hooks/useLatestReadings";
import {
  formatNumber,
  formatRelativeSeconds,
  formatTimestamp,
} from "../utils/formatters";
import { calculateHealthScore } from "../utils/healthScore";
import { generateRecommendations } from "../utils/recommendations";
import {
  getConnectionHealth,
  getMetricStatus,
  getOverallStatus,
} from "../utils/status";

const bridgeIds = ["Bridge_A", "Bridge_B", "Bridge_C", "Bridge_D"];

const sensorNodes = [
  { id: "S1", label: "Sensor 1", left: "12%", top: "18%" },
  { id: "S2", label: "Sensor 2", left: "32%", top: "10%" },
  { id: "S3", label: "Sensor 3", left: "52%", top: "18%" },
  { id: "S4", label: "Sensor 4", left: "20%", top: "58%" },
  { id: "S5", label: "Sensor 5", left: "48%", top: "62%" },
  { id: "S6", label: "Sensor 6", left: "74%", top: "54%" },
];

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getReadingTimestamp = (reading) =>
  parseTimestamp(reading?.timestamp || reading?.created_at);


function BridgeManagement() {
  const refreshMs = 5000;
  const { readings, apiOnline, lastUpdatedAt, lastResponseAt } =
    useLatestReadings(refreshMs);
  const [selectedBridge, setSelectedBridge] = useState(bridgeIds[0]);

  const sortedReadings = useMemo(() => {
    return [...readings].sort((first, second) => {
      const firstTime = getReadingTimestamp(first)?.getTime() || 0;
      const secondTime = getReadingTimestamp(second)?.getTime() || 0;
      return secondTime - firstTime;
    });
  }, [readings]);

  const latestByBridge = useMemo(() => {
    const latest = new Map();
    sortedReadings.forEach((reading) => {
      if (!latest.has(reading.bridge_id)) {
        latest.set(reading.bridge_id, reading);
      }
    });
    return latest;
  }, [sortedReadings]);

  useEffect(() => {
    if (latestByBridge.size === 0) {
      return;
    }
    if (!latestByBridge.has(selectedBridge)) {
      const fallback = bridgeIds.find((id) => latestByBridge.has(id));
      if (fallback) {
        setSelectedBridge(fallback);
      }
    }
  }, [latestByBridge, selectedBridge]);

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
  }, [latestByBridge]);

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

  const selectedReading = latestByBridge.get(selectedBridge);
  const selectedStatus = getOverallStatus(selectedReading);
  const healthScoreResult = useMemo(
    () => calculateHealthScore(selectedReading),
    [selectedReading]
  );
  const healthScore = healthScoreResult.score;
  const lastUpdate = formatTimestamp(getReadingTimestamp(selectedReading));

  const maintenanceRecommendations = useMemo(() => {
    const input = {
      ...(selectedReading ?? {}),
      healthScore: healthScoreResult.score,
      status: selectedStatus,
    };
    return generateRecommendations(input).recommendations;
  }, [selectedReading, healthScoreResult.score, selectedStatus]);

  const metricDetails = useMemo(
    () => [
      {
        label: "Temperature",
        value: formatNumber(selectedReading?.temperature),
        unit: "°C",
        status: getMetricStatus("temperature", selectedReading?.temperature),
      },
      {
        label: "Humidity",
        value: formatNumber(selectedReading?.humidity),
        unit: "%",
        status: getMetricStatus("humidity", selectedReading?.humidity),
      },
      {
        label: "Vibration",
        value: formatNumber(selectedReading?.vibration),
        unit: "m/s²",
        status: getMetricStatus("vibration", selectedReading?.vibration),
      },
      {
        label: "Battery",
        value: formatNumber(selectedReading?.battery_level),
        unit: "%",
        status: getMetricStatus("battery", selectedReading?.battery_level),
      },
    ],
    [selectedReading]
  );

  return (
    <div className="bridge-management">
      <section className="page-section">
        <div className="section-heading">
          <div className="page-header">
            <h1>Bridge Management</h1>
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
            Bridge-specific operations, digital twin diagnostics, and sensor health.
          </p>
        </div>
        <div className="bridges-header-grid">
          <div className="card overview-card">
            <span className="overview-label">Bridges Online</span>
            <span className="overview-value">{bridgeSnapshots.length}</span>
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
          <h2>Bridge List</h2>
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

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Bridge Selector</h2>
          <p className="section-subtitle">
            Choose a bridge to inspect digital twin diagnostics.
          </p>
        </div>
        <div className="bridge-selector">
          {bridgeIds.map((bridgeId) => (
            <button
              key={bridgeId}
              type="button"
              className={`bridge-chip ${
                bridgeId === selectedBridge ? "bridge-chip-active" : ""
              }`}
              onClick={() => setSelectedBridge(bridgeId)}
            >
              {bridgeId}
            </button>
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="twin-layout">
          <div className="card twin-visual">
            <div className="twin-visual-header">
              <h2>Digital Twin Visualization</h2>
              <span className={`status-badge status-${selectedStatus.tone}`}>
                {selectedStatus.label}
              </span>
            </div>
            <div className="twin-canvas">
              <svg
                className={`twin-svg twin-${selectedStatus.tone}`}
                viewBox="0 0 900 260"
                role="img"
                aria-label="Bridge schematic"
              >
                <rect x="60" y="90" width="780" height="22" rx="6" />
                <rect x="80" y="120" width="740" height="10" rx="5" />
                <rect x="140" y="132" width="90" height="90" rx="8" />
                <rect x="405" y="132" width="90" height="90" rx="8" />
                <rect x="670" y="132" width="90" height="90" rx="8" />
                <line x1="180" y1="222" x2="180" y2="242" />
                <line x1="450" y1="222" x2="450" y2="242" />
                <line x1="715" y1="222" x2="715" y2="242" />
              </svg>
              {sensorNodes.map((node) => (
                <div
                  key={node.id}
                  className={`sensor-node sensor-${selectedStatus.tone}`}
                  style={{ left: node.left, top: node.top }}
                >
                  <div className="sensor-node-header">
                    <span className="sensor-id">{node.label}</span>
                    <span className={`status-badge status-${selectedStatus.tone}`}>
                      {selectedStatus.label}
                    </span>
                  </div>
                  <div className="sensor-metrics">
                    {metricDetails.map((metric) => (
                      <div key={metric.label} className="sensor-metric">
                        <span className="sensor-metric-label">{metric.label}</span>
                        <span className="sensor-metric-value">
                          {metric.value}
                          {metric.unit}
                        </span>
                        <span
                          className={`status-dot status-${metric.status.tone}`}
                          aria-hidden="true"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="twin-legend">
              <span className="legend-title">Health Legend</span>
              <div className="legend-items">
                <span className="legend-item">
                  <span className="status-dot status-healthy" aria-hidden="true" />
                  Healthy
                </span>
                <span className="legend-item">
                  <span className="status-dot status-warning" aria-hidden="true" />
                  Warning
                </span>
                <span className="legend-item">
                  <span className="status-dot status-critical" aria-hidden="true" />
                  Critical
                </span>
              </div>
            </div>
          </div>

          <div className="twin-panel">
            <div className="card twin-summary">
              <div className="summary-header">
                <h2>Bridge Summary</h2>
                <span className={`status-badge status-${selectedStatus.tone}`}>
                  {selectedStatus.label}
                </span>
              </div>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Bridge Name</span>
                  <span className="summary-value">{selectedBridge}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Health Score</span>
                  <span className="summary-value">{healthScore}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Last Updated</span>
                  <span className="summary-value">{lastUpdate}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Data Freshness</span>
                  <span className="summary-value">
                    {formatRelativeSeconds(lastResponseAt)}
                  </span>
                </div>
              </div>
              <div className="summary-metrics">
                {metricDetails.map((metric) => (
                  <div key={metric.label} className="summary-metric">
                    <span className="summary-metric-label">{metric.label}</span>
                    <span className="summary-metric-value">
                      {metric.value}
                      {metric.unit}
                    </span>
                    <span className={`status-badge status-${metric.status.tone}`}>
                      {metric.status.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card twin-alert">
              <h2>Bridge Alert</h2>
              <p className="section-subtitle">
                {selectedStatus.tone === "critical" &&
                  "Critical Bridge Warning"}
                {selectedStatus.tone === "warning" && "Warning Condition"}
                {selectedStatus.tone === "healthy" &&
                  "Bridge Operating Normally"}
                {selectedStatus.tone === "neutral" && "Awaiting sensor data"}
              </p>
              <div className="alert-state">
                <span className={`status-dot status-${selectedStatus.tone}`} />
                <span className="alert-state-label">
                  {selectedStatus.label}
                </span>
              </div>
            </div>

            <div className="card twin-alert">
              <h2>Maintenance Recommendations</h2>
              {maintenanceRecommendations.length === 0 ? (
                <p className="section-subtitle">No recommendations available.</p>
              ) : (
                <ul className="activity-list">
                  {maintenanceRecommendations.map((item) => (
                    <li key={item} className="activity-item">
                      <span className="activity-primary">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
    </div>
  );
}

export default BridgeManagement;
