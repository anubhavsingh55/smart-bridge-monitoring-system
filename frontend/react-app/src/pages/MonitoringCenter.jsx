import { useEffect, useMemo, useRef, useState } from "react";

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

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getReadingTimestamp = (reading) =>
  parseTimestamp(reading?.timestamp || reading?.created_at);

const metricConfig = {
  temperature: { label: "Temperature", unit: "°C", field: "temperature" },
  humidity: { label: "Humidity", unit: "%", field: "humidity" },
  vibration: { label: "Vibration", unit: "m/s²", field: "vibration" },
  battery: { label: "Battery", unit: "%", field: "battery_level" },
};

const metricKeys = Object.keys(metricConfig);

const toAlertEntries = (reading) => {
  if (!reading) {
    return [];
  }
  const timestamp = getReadingTimestamp(reading);
  return metricKeys
    .map((key) => {
      const config = metricConfig[key];
      const value = reading[config.field];
      const status = getMetricStatus(key, value);
      return {
        id: `${reading.id}-${key}`,
        bridgeId: reading.bridge_id,
        alertType: "Metric Threshold",
        metric: config.label,
        value: `${formatNumber(value)}${config.unit}`,
        severity: status,
        timestamp,
      };
    })
    .filter(
      (entry) =>
        entry.severity.tone === "warning" || entry.severity.tone === "critical"
    );
};

function MonitoringCenter() {
  const refreshMs = 5000;
  const { readings, apiOnline, lastUpdatedAt, lastResponseAt } =
    useLatestReadings(refreshMs);
  const [alertHistory, setAlertHistory] = useState([]);
  const previousMetricTones = useRef(new Map());
  const previousBridgeStatus = useRef(new Map());

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

  const latestByBridge = useMemo(() => {
    const latest = new Map();
    sortedReadings.forEach((reading) => {
      if (!latest.has(reading.bridge_id)) {
        latest.set(reading.bridge_id, reading);
      }
    });
    return Array.from(latest.values());
  }, [sortedReadings]);

  useEffect(() => {
    if (latestByBridge.length === 0) {
      return;
    }

    const nextMetricTones = new Map(previousMetricTones.current);
    const nextBridgeStatus = new Map(previousBridgeStatus.current);
    const newAlerts = [];

    latestByBridge.forEach((reading) => {
      const bridgeId = reading.bridge_id;
      const timestamp = getReadingTimestamp(reading) || new Date();
      const overallStatus = getOverallStatus(reading);
      const previousStatus = nextBridgeStatus.get(bridgeId);

      if (!previousStatus) {
        newAlerts.push({
          id: `${bridgeId}-connected-${timestamp.getTime()}`,
          bridgeId,
          alertType: "Bridge Event",
          metric: "Connection",
          value: "Bridge connected",
          severity: { label: "Info", tone: "info" },
          timestamp,
        });
      } else if (
        previousStatus.tone !== "healthy" &&
        overallStatus.tone === "healthy"
      ) {
        newAlerts.push({
          id: `${bridgeId}-recovered-${timestamp.getTime()}`,
          bridgeId,
          alertType: "Bridge Event",
          metric: "Recovery",
          value: "Bridge recovered",
          severity: { label: "Info", tone: "info" },
          timestamp,
        });
      }

      nextBridgeStatus.set(bridgeId, overallStatus);

      metricKeys.forEach((key) => {
        const config = metricConfig[key];
        const value = reading[config.field];
        const metricStatus = getMetricStatus(key, value);
        const cacheKey = `${bridgeId}-${key}`;
        const previousTone = nextMetricTones.get(cacheKey);

        if (
          metricStatus.tone !== previousTone &&
          (metricStatus.tone === "warning" ||
            metricStatus.tone === "critical")
        ) {
          newAlerts.push({
            id: `${bridgeId}-${key}-${metricStatus.tone}-${timestamp.getTime()}`,
            bridgeId,
            alertType: "Metric Threshold",
            metric: config.label,
            value: `${formatNumber(value)}${config.unit}`,
            severity: metricStatus,
            timestamp,
          });
        }

        nextMetricTones.set(cacheKey, metricStatus.tone);
      });
    });

    if (newAlerts.length > 0) {
      setAlertHistory((current) =>
        [...newAlerts, ...current].slice(0, 200)
      );
    }

    previousMetricTones.current = nextMetricTones;
    previousBridgeStatus.current = nextBridgeStatus;
  }, [latestByBridge]);

  const hasCriticalAlert = useMemo(() => {
    return latestByBridge.some(
      (reading) => getOverallStatus(reading).tone === "critical"
    );
  }, [latestByBridge]);

  const bridgeSnapshots = useMemo(() => {
    const latest = new Map();
    sortedReadings.forEach((reading) => {
      if (!latest.has(reading.bridge_id)) {
        latest.set(reading.bridge_id, reading);
      }
    });
    return bridgeIds.map((bridgeId) => {
      const reading = latest.get(bridgeId);
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
        healthScore: calculateHealthScore(reading).score,
        recommendations: generateRecommendations({
          ...reading,
          healthScore: calculateHealthScore(reading).score,
          status: getOverallStatus(reading),
        }).recommendations,
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
    { key: "healthScore", label: "Health Score", align: "right" },
    {
      key: "recommendations",
      label: "Recommendations",
      render: (row) =>
        row.recommendations.length > 0
          ? row.recommendations.join(" • ")
          : "None",
    },
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

  const currentAlerts = useMemo(() => {
    return latestByBridge.flatMap((reading) => toAlertEntries(reading));
  }, [latestByBridge]);

  const summary = useMemo(() => {
    const critical = currentAlerts.filter(
      (alert) => alert.severity.tone === "critical"
    ).length;
    const warning = currentAlerts.filter(
      (alert) => alert.severity.tone === "warning"
    ).length;
    const healthyBridges = latestByBridge.filter(
      (reading) => getOverallStatus(reading).tone === "healthy"
    ).length;
    return {
      total: critical + warning,
      critical,
      warning,
      healthyBridges,
    };
  }, [currentAlerts, latestByBridge]);

  const liveAlertFeed = useMemo(() => {
    return [...alertHistory].sort((first, second) => {
      const firstTime = first.timestamp?.getTime() || 0;
      const secondTime = second.timestamp?.getTime() || 0;
      return secondTime - firstTime;
    });
  }, [alertHistory]);

  const criticalIncidents = useMemo(() => {
    return liveAlertFeed.filter((alert) => alert.severity.tone === "critical");
  }, [liveAlertFeed]);

  const riskRanking = useMemo(() => {
    return latestByBridge
      .map((reading) => {
        const metricStatuses = metricKeys.map((key) => {
          const config = metricConfig[key];
          const value = reading[config.field];
          return getMetricStatus(key, value);
        });
        const criticalCount = metricStatuses.filter(
          (status) => status.tone === "critical"
        ).length;
        const warningCount = metricStatuses.filter(
          (status) => status.tone === "warning"
        ).length;
        const riskScore = criticalCount * 2 + warningCount;
        return {
          id: reading.bridge_id,
          bridgeId: reading.bridge_id,
          status: getOverallStatus(reading),
          criticalCount,
          warningCount,
          lastUpdate: formatTimestamp(getReadingTimestamp(reading)),
          riskScore,
        };
      })
      .sort((a, b) => {
        if (b.riskScore !== a.riskScore) {
          return b.riskScore - a.riskScore;
        }
        return a.bridgeId.localeCompare(b.bridgeId);
      });
  }, [latestByBridge]);

  const alertColumns = [
    {
      key: "timestamp",
      label: "Timestamp",
      render: (row) => formatTimestamp(row.timestamp),
    },
    { key: "bridgeId", label: "Bridge ID" },
    { key: "alertType", label: "Alert Type" },
    { key: "metric", label: "Metric" },
    { key: "value", label: "Current Value", align: "right" },
    {
      key: "severity",
      label: "Severity",
      render: (row) => (
        <span
          className={`status-badge status-${row.severity.tone} ${
            row.severity.tone === "critical" ? "critical-pulse" : ""
          }`}
        >
          {row.severity.label}
        </span>
      ),
    },
  ];

  const riskColumns = [
    { key: "bridgeId", label: "Bridge" },
    {
      key: "status",
      label: "Risk Level",
      render: (row) => (
        <span className={`status-badge status-${row.status.tone}`}>
          {row.status.label}
        </span>
      ),
    },
    { key: "criticalCount", label: "Critical Metrics", align: "right" },
    { key: "warningCount", label: "Warning Metrics", align: "right" },
    { key: "lastUpdate", label: "Last Update" },
  ];

  return (
    <div className="monitoring-center">
      <section className="page-section">
        <div className="section-heading">
          <div className="page-header">
            <h1>Monitoring Center</h1>
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
            Live telemetry, alert intelligence, and operator response tools.
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
            <span className="overview-label">Last Update Time</span>
            <span className="overview-value">
              {formatTimestamp(lastUpdatedAt)}
            </span>
            <span className="overview-detail">Latest sensor timestamp</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Records Loaded</span>
            <span className="overview-value">{sortedReadings.length}</span>
            <span className="overview-detail">
              Healthy {statusBreakdown.healthy} / Warning {statusBreakdown.warning} / Critical {statusBreakdown.critical}
            </span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Critical Indicator</span>
            <span className={`overview-value tone-${hasCriticalAlert ? "critical" : "healthy"}`}>
              {hasCriticalAlert ? "Active" : "Clear"}
            </span>
            <span className="overview-detail">Critical alerts flag</span>
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
          {hasCriticalAlert && (
            <span className="status-badge status-critical">
              Critical Alerts Active
            </span>
          )}
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Bridge Status Overview</h2>
          <p className="section-subtitle">
            Immediate bridge health snapshots for operators on duty.
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
          <h2>Live Sensor Stream</h2>
          <p className="section-subtitle">
            Newest readings surface first. Scroll for live history.
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={tableRows}
          emptyMessage="Waiting for live sensor readings..."
        />
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Alert Center</h2>
          <p className="section-subtitle">
            Critical and warning activity with alert intelligence.
          </p>
        </div>
        <div className="alert-summary-grid">
          <div className="card overview-card">
            <span className="overview-label">Total Alerts</span>
            <span className="overview-value">{summary.total}</span>
            <span className="overview-detail">Active warnings & critical</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Critical Alerts</span>
            <span className="overview-value tone-critical">
              {summary.critical}
            </span>
            <span className="overview-detail">Immediate attention</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Warning Alerts</span>
            <span className="overview-value tone-warning">
              {summary.warning}
            </span>
            <span className="overview-detail">Monitor deviations</span>
          </div>
          <div className="card overview-card">
            <span className="overview-label">Healthy Bridges</span>
            <span className="overview-value tone-healthy">
              {summary.healthyBridges}
            </span>
            <span className="overview-detail">Stable conditions</span>
          </div>
        </div>
        <div className="settings-grid" style={{ marginTop: 16 }}>
          <div className="card settings-card">
            <div className="toggle-row">
              <span className="toggle-label">Warning Notifications</span>
              <span className="toggle-pill toggle-on">Enabled</span>
            </div>
            <div className="toggle-row">
              <span className="toggle-label">Critical Notifications</span>
              <span className="toggle-pill toggle-on">Enabled</span>
            </div>
          </div>
          <div className="card settings-card">
            <div className="toggle-row">
              <span className="toggle-label">Buzzer Controls</span>
              <span className="toggle-pill toggle-on">Enabled</span>
            </div>
            <div className="toggle-row">
              <span className="toggle-label">Alert Acknowledgement</span>
              <span className="toggle-pill toggle-off">Planned</span>
            </div>
          </div>
          <div className="card settings-card">
            <span className="overview-label">Alert Feed Status</span>
            <span className="overview-value">Streaming</span>
            <span className="overview-detail">Operator visibility enabled</span>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Live Alert Feed</h2>
          <p className="section-subtitle">
            Newest alerts first with real-time severity updates.
          </p>
        </div>
        <DataTable
          columns={alertColumns}
          rows={liveAlertFeed}
          emptyMessage="No alerts recorded in this session."
          rowClassName={(row) =>
            row.severity.tone === "critical" ? "alert-row-critical" : undefined
          }
        />
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Critical Incidents</h2>
          <p className="section-subtitle">
            Critical alerts that require immediate response.
          </p>
        </div>
        <DataTable
          columns={alertColumns}
          rows={criticalIncidents}
          emptyMessage="No critical incidents recorded."
          rowClassName={(row) =>
            row.severity.tone === "critical" ? "alert-row-critical" : undefined
          }
        />
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Bridge Risk Ranking</h2>
          <p className="section-subtitle">
            Ranked by current severity across live bridge readings.
          </p>
        </div>
        <DataTable
          columns={riskColumns}
          rows={riskRanking}
          emptyMessage="No bridge risk data available."
        />
      </section>
    </div>
  );
}

export default MonitoringCenter;
