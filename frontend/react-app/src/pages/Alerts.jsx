import { useMemo } from "react";

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
				alertType: "Metric Alert",
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

function Alerts() {
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

	const latestByBridge = useMemo(() => {
		const latest = new Map();
		sortedReadings.forEach((reading) => {
			if (!latest.has(reading.bridge_id)) {
				latest.set(reading.bridge_id, reading);
			}
		});
		return Array.from(latest.values());
	}, [sortedReadings]);

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

	const activeAlerts = useMemo(() => {
		return [...currentAlerts].sort((first, second) => {
			const firstTime = first.timestamp?.getTime() || 0;
			const secondTime = second.timestamp?.getTime() || 0;
			return secondTime - firstTime;
		});
	}, [currentAlerts]);

	const allAlertFeed = useMemo(() => {
		const alerts = sortedReadings.flatMap((reading) => toAlertEntries(reading));
		return alerts
			.sort((first, second) => {
				const firstTime = first.timestamp?.getTime() || 0;
				const secondTime = second.timestamp?.getTime() || 0;
				return secondTime - firstTime;
			})
			.slice(0, 6)
			.map((alert) => ({
				...alert,
				feedText: `${alert.bridgeId} ${alert.metric} ${alert.severity.label}`,
			}));
	}, [sortedReadings]);

	const alertStats = useMemo(() => {
		const counts = {
			temperature: 0,
			humidity: 0,
			vibration: 0,
			battery: 0,
		};
		currentAlerts.forEach((alert) => {
			const entry = Object.entries(metricConfig).find(
				([, config]) => config.label === alert.metric
			);
			if (entry) {
				counts[entry[0]] += 1;
			}
		});
		return counts;
	}, [currentAlerts]);

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
		{ key: "bridgeId", label: "Bridge ID" },
		{ key: "alertType", label: "Alert Type" },
		{ key: "metric", label: "Metric" },
		{ key: "value", label: "Current Value", align: "right" },
		{
			key: "severity",
			label: "Severity",
			render: (row) => (
				<span className={`status-badge status-${row.severity.tone}`}>
					{row.severity.label}
				</span>
			),
		},
		{
			key: "timestamp",
			label: "Timestamp",
			render: (row) => formatTimestamp(row.timestamp),
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
		<div className="alerts">
			<section className="page-section">
				<div className="section-heading">
					<div className="page-header">
						<h1>Alerts</h1>
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
						Active warnings and critical conditions across bridge sensors.
					</p>
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
						Last Updated: {formatTimestamp(lastUpdatedAt)}
					</span>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Alert Summary</h2>
					<p className="section-subtitle">
						Current alert footprint across the live bridge fleet.
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
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Active Alerts</h2>
					<p className="section-subtitle">
						Warning and critical conditions detected in the latest readings.
					</p>
				</div>
				<DataTable
					columns={alertColumns}
					rows={activeAlerts}
					emptyMessage="No active alerts detected."
					rowClassName={(row) =>
						row.severity.tone === "critical" ? "alert-row-critical" : undefined
					}
				/>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Alert Feed</h2>
					<p className="section-subtitle">
						Latest alert activity across the monitoring stream.
					</p>
				</div>
				<div className="card alert-feed-card">
					{allAlertFeed.length === 0 ? (
						<p className="empty-state">No recent alert activity.</p>
					) : (
						<ul className="alert-feed-list">
							{allAlertFeed.map((alert) => (
								<li key={alert.id} className="alert-feed-item">
									<span className="alert-feed-primary">{alert.feedText}</span>
									<span className="alert-feed-secondary">
										{formatTimestamp(alert.timestamp)}
									</span>
									<span
										className={`status-badge status-${alert.severity.tone}`}
									>
										{alert.severity.label}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Alert Statistics</h2>
					<p className="section-subtitle">
						Alert distribution by metric category.
					</p>
				</div>
				<div className="alert-stats-grid">
					<div className="card overview-card">
						<span className="overview-label">Temperature Alerts</span>
						<span className="overview-value">{alertStats.temperature}</span>
						<span className="overview-detail">Thermal deviations</span>
					</div>
					<div className="card overview-card">
						<span className="overview-label">Humidity Alerts</span>
						<span className="overview-value">{alertStats.humidity}</span>
						<span className="overview-detail">Moisture anomalies</span>
					</div>
					<div className="card overview-card">
						<span className="overview-label">Vibration Alerts</span>
						<span className="overview-value">{alertStats.vibration}</span>
						<span className="overview-detail">Structural instability</span>
					</div>
					<div className="card overview-card">
						<span className="overview-label">Battery Alerts</span>
						<span className="overview-value">{alertStats.battery}</span>
						<span className="overview-detail">Power risk</span>
					</div>
				</div>
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

export default Alerts;
