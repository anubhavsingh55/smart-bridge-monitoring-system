import { useMemo } from "react";

import MetricCard from "../components/MetricCard";
import StatusCard from "../components/StatusCard";
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

const averageOf = (items, field) => {
	if (items.length === 0) {
		return null;
	}
	const total = items.reduce((sum, item) => {
		const value = Number(item[field]);
		return Number.isNaN(value) ? sum : sum + value;
	}, 0);
	return total / items.length;
};

const trendFromReadings = (latest, previous) => {
	if (latest === null || latest === undefined) {
		return "steady";
	}
	if (previous === null || previous === undefined) {
		return "steady";
	}
	if (latest > previous) {
		return "up";
	}
	if (latest < previous) {
		return "down";
	}
	return "steady";
};

const kpiIcons = {
	total: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M4 7h16M4 12h16M4 17h16"
				stroke="currentColor"
				strokeWidth="1.6"
				fill="none"
				strokeLinecap="round"
			/>
		</svg>
	),
	temperature: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M10 3v10a4 4 0 1 0 4 0V3"
				stroke="currentColor"
				strokeWidth="1.6"
				fill="none"
				strokeLinecap="round"
			/>
			<circle cx="12" cy="17" r="2" fill="currentColor" />
		</svg>
	),
	humidity: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M12 3c3 4 6 7 6 10a6 6 0 1 1-12 0c0-3 3-6 6-10z"
				stroke="currentColor"
				strokeWidth="1.6"
				fill="none"
				strokeLinejoin="round"
			/>
		</svg>
	),
	vibration: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M4 13h4l2-4 4 8 2-4h4"
				stroke="currentColor"
				strokeWidth="1.6"
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
};

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

function Dashboard() {
	const { readings, apiOnline, lastUpdatedAt, lastResponseAt } =
		useLatestReadings(5000);

	const totals = useMemo(
		() => ({
			total: readings.length,
			temperature: averageOf(readings, "temperature"),
			humidity: averageOf(readings, "humidity"),
			vibration: averageOf(readings, "vibration"),
			battery: averageOf(readings, "battery_level"),
		}),
		[readings]
	);

	const sortedReadings = useMemo(() => {
		return [...readings].sort((first, second) => {
			const firstTime = getReadingTimestamp(first)?.getTime() || 0;
			const secondTime = getReadingTimestamp(second)?.getTime() || 0;
			return secondTime - firstTime;
		});
	}, [readings]);

	const recentActivity = useMemo(() => {
		return sortedReadings.slice(0, 5).map((reading) => {
			const metricStatuses = {
				temperature: getMetricStatus("temperature", reading.temperature),
				humidity: getMetricStatus("humidity", reading.humidity),
				vibration: getMetricStatus("vibration", reading.vibration),
				battery: getMetricStatus("battery", reading.battery_level),
			};
			const criticalMetric = Object.entries(metricStatuses).find(
				([, status]) => status.tone === "critical"
			);
			const warningMetric = Object.entries(metricStatuses).find(
				([, status]) => status.tone === "warning"
			);
			const flaggedMetric = criticalMetric || warningMetric;
			const metricLabel = flaggedMetric
				? metricLabels[flaggedMetric[0]]
				: null;
			const tone = flaggedMetric ? flaggedMetric[1].label : "Updated";
			const message = metricLabel
				? `Bridge ${reading.bridge_id} ${tone.toLowerCase()} ${metricLabel}`
				: `Bridge ${reading.bridge_id} updated`;
			return {
				id: reading.id,
				bridgeId: reading.bridge_id,
				timestamp: formatTimestamp(getReadingTimestamp(reading)),
				status: getOverallStatus(reading),
				message,
			};
		});
	}, [sortedReadings]);
	const latestReading = sortedReadings[0];
	const previousReading = readings[1];
	const overallStatus = getOverallStatus(latestReading);
	const healthScore = useMemo(
		() => calculateHealthScore(latestReading),
		[latestReading]
	);
	const topRecommendation = useMemo(() => {
		const input = latestReading
			? { ...latestReading, healthScore: healthScore.score, status: overallStatus }
			: { healthScore: healthScore.score, status: overallStatus };
		const recommendations = generateRecommendations(input).recommendations;
		return recommendations[0] || "No maintenance recommendations.";
	}, [latestReading, healthScore.score, overallStatus]);
	const bridgesMonitored = useMemo(() => {
		const uniqueBridges = new Set(readings.map((item) => item.bridge_id));
		return uniqueBridges.size;
	}, [readings]);

	const secondsSinceUpdate = useMemo(() => {
		if (!lastResponseAt) {
			return null;
		}
		return Math.round((Date.now() - lastResponseAt.getTime()) / 1000);
	}, [lastResponseAt]);

	const connectionHealth = getConnectionHealth(secondsSinceUpdate);
	const systemSummary = useMemo(() => {
		const counts = { healthy: 0, warning: 0, critical: 0 };
		readings.forEach((reading) => {
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
	}, [readings]);

	return (
		<div className="dashboard">
			<section className="page-section">
				<div className="section-heading">
					<div className="page-header">
						<h1>Dashboard</h1>
						<div className="page-actions">
							<span className={`status-badge status-${overallStatus.tone}`}>
								Bridge Health: {overallStatus.label}
							</span>
							<span className="data-freshness">
								Data Freshness: {formatRelativeSeconds(lastResponseAt)}
							</span>
						</div>
					</div>
					<p className="section-subtitle">
						Real-time overview of bridge sensor health and system telemetry.
					</p>
				</div>
				<div className="overview-grid">
					<div className="card overview-card">
						<span className="overview-label">Active Bridges</span>
						<span className="overview-value">{bridgesMonitored}</span>
						<span className="overview-detail">Receiving live readings</span>
					</div>
					<div className="card overview-card">
						<span className="overview-label">Latest Reading</span>
						<span className="overview-value">
							{formatTimestamp(lastUpdatedAt)}
						</span>
						<span className="overview-detail">Timestamp from edge sensors</span>
					</div>
					<div className="card overview-card">
						<span className="overview-label">Connection Health</span>
						<span className={`overview-value tone-${connectionHealth.tone}`}>
							{connectionHealth.label}
						</span>
						<span className="overview-detail">Network update cadence</span>
					</div>
					<div className="card overview-card">
						<span className="overview-label">Overall Status</span>
						<span className={`overview-value tone-${overallStatus.tone}`}>
							{overallStatus.label}
						</span>
						<span className="overview-detail">Latest bridge snapshot</span>
					</div>
				</div>
				<div className="section-heading compact">
					<h2>Top Recommendation</h2>
					<p className="section-subtitle">
						Most severe maintenance action based on live telemetry.
					</p>
				</div>
				<div className="card">
					<span className="overview-label">Most Severe Recommendation</span>
					<span className="summary-detail">{topRecommendation}</span>
				</div>
				<div className="kpi-grid">
					<MetricCard
						label="Total Readings"
						value={totals.total}
						icon={kpiIcons.total}
						trend="steady"
						context={`Updated ${formatRelativeSeconds(lastResponseAt)}`}
					/>
					<MetricCard
						label="Health Score"
						value={healthScore.score}
						icon={kpiIcons.total}
						trend="steady"
						context={healthScore.status}
					/>
					<MetricCard
						label="Average Temperature"
						value={formatNumber(totals.temperature)}
						unit="°C"
						icon={kpiIcons.temperature}
						trend={trendFromReadings(
							latestReading?.temperature,
							previousReading?.temperature
						)}
						context={`Updated ${formatRelativeSeconds(lastResponseAt)}`}
					/>
					<MetricCard
						label="Average Humidity"
						value={formatNumber(totals.humidity)}
						unit="%"
						icon={kpiIcons.humidity}
						trend={trendFromReadings(
							latestReading?.humidity,
							previousReading?.humidity
						)}
						context={`Updated ${formatRelativeSeconds(lastResponseAt)}`}
					/>
					<MetricCard
						label="Average Vibration"
						value={formatNumber(totals.vibration)}
						unit="m/s²"
						icon={kpiIcons.vibration}
						trend={trendFromReadings(
							latestReading?.vibration,
							previousReading?.vibration
						)}
						context={`Updated ${formatRelativeSeconds(lastResponseAt)}`}
					/>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>System Status</h2>
					<p className="section-subtitle">
						Connectivity, database reachability, and stream health.
					</p>
				</div>
				<div className="status-grid">
					<StatusCard
						label="API Status"
						value={apiOnline ? "Online" : "Offline"}
						tone={apiOnline ? "healthy" : "critical"}
						detail="FastAPI edge gateway"
					/>
					<StatusCard
						label="Database Status"
						value={apiOnline ? "Connected" : "Unavailable"}
						tone={apiOnline ? "healthy" : "critical"}
						detail="PostgreSQL telemetry store"
					/>
					<StatusCard
						label="Connection Health"
						value={connectionHealth.label}
						tone={connectionHealth.tone}
						detail="Stream update cadence"
					/>
					<StatusCard
						label="Last Updated"
						value={formatTimestamp(lastUpdatedAt)}
						tone="neutral"
						detail={`Data freshness ${formatRelativeSeconds(lastResponseAt)}`}
					/>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>System Summary</h2>
					<p className="section-subtitle">
						Aggregate bridge status and KPI balance across the fleet.
					</p>
				</div>
				<div className="summary-grid">
					<div className="card summary-card">
						<span className="summary-label">Healthy Bridges</span>
						<span className="summary-value">
							{systemSummary.healthy}
						</span>
						<span className="summary-detail">Within nominal thresholds</span>
					</div>
					<div className="card summary-card">
						<span className="summary-label">Warning Bridges</span>
						<span className="summary-value">
							{systemSummary.warning}
						</span>
						<span className="summary-detail">Inspect sensor deviation</span>
					</div>
					<div className="card summary-card">
						<span className="summary-label">Critical Bridges</span>
						<span className="summary-value">
							{systemSummary.critical}
						</span>
						<span className="summary-detail">Immediate review needed</span>
					</div>
					<div className="card summary-card">
						<span className="summary-label">Average Battery</span>
						<span className="summary-value">
							{formatNumber(totals.battery)}
							<span className="summary-unit">%</span>
						</span>
						<span className="summary-detail">
							{getMetricStatus("battery", totals.battery).label}
						</span>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Recent Activity</h2>
					<p className="section-subtitle">
						Latest five updates from the live monitoring stream.
					</p>
				</div>
				<div className="card activity-card">
					{recentActivity.length === 0 ? (
						<p className="empty-state">No recent activity.</p>
					) : (
						<ul className="activity-list">
							{recentActivity.map((item) => (
								<li key={item.id} className="activity-item">
									<span className="activity-primary">
										{item.message}
									</span>
									<span className="activity-secondary">{item.timestamp}</span>
									<span
										className={`status-badge status-${item.status.tone}`}
									>
										{item.status.label}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>
		</div>
	);
}

export default Dashboard;
