import { useEffect, useMemo, useState } from "react";

import DataTable from "../components/DataTable";
import api from "../services/api";
import {
  formatNumber,
  formatRelativeSeconds,
  formatTimestamp,
} from "../utils/formatters";
import { calculateHealthScore, getHealthScoreStatus } from "../utils/healthScore";
import { generateRecommendations } from "../utils/recommendations";
import { getOverallStatus } from "../utils/status";

const parseTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getReadingTimestamp = (reading) =>
  parseTimestamp(reading?.timestamp || reading?.created_at);

const scoreToneMap = {
  Healthy: "healthy",
  Warning: "warning",
  Critical: "critical",
};

function Reports() {
  const [readings, setReadings] = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);
  const [reportGeneratedAt] = useState(() => new Date());

  useEffect(() => {
    let isMounted = true;
    const fetchReadings = async () => {
      try {
        const response = await api.get("/api/sensors/readings/latest");
        if (!isMounted) {
          return;
        }
        const data = Array.isArray(response.data) ? response.data : [];
        setReadings(data);
        setApiOnline(true);
        const latestTimestamp = getReadingTimestamp(data[0]);
        setLastUpdatedAt(latestTimestamp);
      } catch (error) {
        if (isMounted) {
          setApiOnline(false);
          setReadings([]);
        }
      }
    };

    fetchReadings();

    return () => {
      isMounted = false;
    };
  }, []);

  const latestByBridge = useMemo(() => {
    const latest = new Map();
    readings.forEach((reading) => {
      if (!latest.has(reading.bridge_id)) {
        latest.set(reading.bridge_id, reading);
      }
    });
    return Array.from(latest.values());
  }, [readings]);

  const summaryCounts = useMemo(() => {
    const counts = { healthy: 0, warning: 0, critical: 0 };
    latestByBridge.forEach((reading) => {
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
  }, [latestByBridge]);

  const healthScore = useMemo(() => {
    if (latestByBridge.length === 0) {
      return 0;
    }
    const totalScore = latestByBridge.reduce(
      (sum, reading) => sum + calculateHealthScore(reading).score,
      0
    );
    return Math.round(totalScore / latestByBridge.length);
  }, [latestByBridge]);

  const scoreLabel = getHealthScoreStatus(healthScore);
  const scoreTone = scoreToneMap[scoreLabel] ?? "critical";

  const bridgeSummaries = useMemo(
    () =>
      latestByBridge.map((reading) => {
        const status = getOverallStatus(reading);
        const healthScoreValue = calculateHealthScore(reading).score;
        const recommendations = generateRecommendations({
          ...reading,
          healthScore: healthScoreValue,
          status,
        }).recommendations;
        return {
          id: reading.id ?? reading.bridge_id,
          bridgeId: reading.bridge_id,
          timestamp: getReadingTimestamp(reading),
          temperature: reading.temperature,
          humidity: reading.humidity,
          vibration: reading.vibration,
          battery: reading.battery_level,
          healthScore: healthScoreValue,
          status,
          recommendations,
        };
      }),
    [latestByBridge]
  );

  const reportRows = useMemo(
    () =>
      bridgeSummaries.map((summary) => ({
        id: summary.id,
        bridgeId: summary.bridgeId,
        healthScore: summary.healthScore,
        status: summary.status,
      })),
    [bridgeSummaries]
  );

  const columns = [
    { key: "bridgeId", label: "Bridge ID" },
    { key: "healthScore", label: "Health Score", align: "right" },
    {
      key: "status",
      label: "Health Status",
      render: (row) => (
        <span className={`status-badge status-${row.status.tone}`}>
          {row.status.label}
        </span>
      ),
    },
  ];

  const exportCsv = () => {
    const now = new Date();
    const fileDate = now.toISOString().slice(0, 10);
    const header = [
      "Bridge_ID",
      "Timestamp",
      "Temperature",
      "Humidity",
      "Vibration",
      "Battery",
      "Health_Score",
      "Status",
      "Recommendations",
    ];
    const rows = bridgeSummaries.map((summary) => {
      const recommendations = summary.recommendations;
      return [
        summary.bridgeId,
        formatTimestamp(summary.timestamp),
        formatNumber(summary.temperature),
        formatNumber(summary.humidity),
        formatNumber(summary.vibration),
        formatNumber(summary.battery),
        summary.healthScore,
        summary.status.label,
        recommendations.length > 0 ? recommendations.join(" | ") : "None",
      ];
    });
    const csvLines = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bridge_Health_Report_${fileDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <section className="page-section">
        <div className="section-heading">
          <div className="page-header">
            <h1>Reports</h1>
            <div className="page-actions">
              <span className={`status-badge status-${scoreTone}`}>
                Health Score {healthScore}
              </span>
              <span className="data-freshness">
                Data Freshness: {formatRelativeSeconds(lastUpdatedAt)}
              </span>
            </div>
          </div>
          <p className="section-subtitle">
            Generate compliance-ready health reports from live telemetry.
          </p>
        </div>
        <div className="status-strip">
          <span className={`status-badge status-${apiOnline ? "healthy" : "critical"}`}>
            API {apiOnline ? "Online" : "Offline"}
          </span>
          <span className="status-badge status-neutral">
            Last Updated: {formatTimestamp(lastUpdatedAt)}
          </span>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Executive Summary</h2>
          <p className="section-subtitle">
            Management-ready overview of bridge health conditions.
          </p>
        </div>
        <div className="card">
          <h3>SMART BRIDGE HEALTH MONITORING REPORT</h3>
          <div className="overview-grid">
            <div className="overview-card">
              <span className="overview-label">Report Generated</span>
              <span className="overview-value">
                {formatTimestamp(reportGeneratedAt)}
              </span>
              <span className="overview-detail">Reporting timestamp</span>
            </div>
            <div className="overview-card">
              <span className="overview-label">Total Bridges Monitored</span>
              <span className="overview-value">{latestByBridge.length}</span>
              <span className="overview-detail">Active bridge assets</span>
            </div>
            <div className="overview-card">
              <span className="overview-label">Healthy Bridges</span>
              <span className="overview-value">{summaryCounts.healthy}</span>
              <span className="overview-detail">Stable condition</span>
            </div>
            <div className="overview-card">
              <span className="overview-label">Warning Bridges</span>
              <span className="overview-value">{summaryCounts.warning}</span>
              <span className="overview-detail">Needs attention</span>
            </div>
            <div className="overview-card">
              <span className="overview-label">Critical Bridges</span>
              <span className="overview-value">{summaryCounts.critical}</span>
              <span className="overview-detail">Immediate response</span>
            </div>
            <div className="overview-card">
              <span className="overview-label">Average Fleet Health Score</span>
              <span className={`overview-value tone-${scoreTone}`}>
                {healthScore}
              </span>
              <span className="overview-detail">{scoreLabel}</span>
            </div>
            <div className="overview-card">
              <span className="overview-label">Overall Fleet Status</span>
              <span className={`overview-value tone-${scoreTone}`}>
                {scoreLabel}
              </span>
              <span className="overview-detail">System condition</span>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Fleet Health Summary</h2>
          <p className="section-subtitle">
            Current health distribution across all monitored bridges.
          </p>
        </div>
        <div className="card">
          <DataTable
            columns={[
              { key: "metric", label: "Metric" },
              { key: "value", label: "Value", align: "right" },
            ]}
            rows={[
              {
                id: "total",
                metric: "Total Bridges",
                value: latestByBridge.length,
              },
              { id: "healthy", metric: "Healthy", value: summaryCounts.healthy },
              { id: "warning", metric: "Warning", value: summaryCounts.warning },
              {
                id: "critical",
                metric: "Critical",
                value: summaryCounts.critical,
              },
              {
                id: "fleet",
                metric: "Average Health Score",
                value: healthScore,
              },
            ]}
            emptyMessage="No fleet summary available."
          />
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Bridge Health Details</h2>
          <p className="section-subtitle">
            Health score and status by bridge.
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={reportRows}
          emptyMessage="No bridge health details available."
        />
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Sensor Summary</h2>
          <p className="section-subtitle">
            Latest telemetry snapshot for each bridge.
          </p>
        </div>
        <DataTable
          columns={[
            { key: "bridgeId", label: "Bridge" },
            { key: "temperature", label: "Temp", align: "right" },
            { key: "humidity", label: "Humidity", align: "right" },
            { key: "vibration", label: "Vibration", align: "right" },
            { key: "battery", label: "Battery", align: "right" },
          ]}
          rows={bridgeSummaries.map((summary) => ({
            id: summary.id,
            bridgeId: summary.bridgeId,
            temperature: formatNumber(summary.temperature),
            humidity: formatNumber(summary.humidity),
            vibration: formatNumber(summary.vibration),
            battery: formatNumber(summary.battery),
          }))}
          emptyMessage="No sensor summary available."
        />
      </section>

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Maintenance Recommendations</h2>
          <p className="section-subtitle">
            Recommended actions derived from current telemetry.
          </p>
        </div>
        <DataTable
          columns={[
            { key: "bridgeId", label: "Bridge ID" },
            {
              key: "recommendations",
              label: "Recommendations",
              render: (row) =>
                row.recommendations.length > 0 ? (
                  <ul className="recommendation-list">
                    {row.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  "None"
                ),
            },
          ]}
          rows={bridgeSummaries.map((summary) => ({
            id: summary.id,
            bridgeId: summary.bridgeId,
            recommendations: summary.recommendations,
          }))}
          emptyMessage="No maintenance recommendations available."
        />
      </section>

      {summaryCounts.critical > 0 && (
        <section className="page-section">
          <div className="section-heading compact">
            <h2>Critical Issues</h2>
            <p className="section-subtitle">
              Immediate attention required for critical bridges.
            </p>
          </div>
          <DataTable
            columns={[
              { key: "bridgeId", label: "Bridge ID" },
              {
                key: "criticalRecommendations",
                label: "Critical Findings",
                render: (row) =>
                  row.recommendations.length > 0 ? (
                    <ul className="recommendation-list">
                      {row.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    "No critical recommendations available."
                  ),
              },
            ]}
            rows={bridgeSummaries
              .filter((summary) => summary.status.tone === "critical")
              .map((summary) => ({
                id: summary.id,
                bridgeId: summary.bridgeId,
                recommendations: summary.recommendations,
              }))}
            emptyMessage="No critical bridges detected."
          />
        </section>
      )}

      <section className="page-section">
        <div className="section-heading compact">
          <h2>Report Export</h2>
          <p className="section-subtitle">
            Export the latest telemetry snapshot as a CSV file.
          </p>
        </div>
        <div className="card">
          <div className="bridge-selector">
            <button
              type="button"
              className="bridge-chip"
              onClick={exportCsv}
            >
              Export Health Report (CSV)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Reports;
