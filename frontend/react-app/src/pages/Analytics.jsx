import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import DataTable from "../components/DataTable";
import MetricCard from "../components/MetricCard";
import useLatestReadings from "../hooks/useLatestReadings";
import {
	formatNumber,
	formatRelativeSeconds,
	formatTimestamp,
} from "../utils/formatters";
import { getConnectionHealth, getOverallStatus } from "../utils/status";

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

const parseTimestamp = (value) => {
	if (!value) {
		return null;
	}
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const getReadingTimestamp = (reading) =>
	parseTimestamp(reading?.timestamp || reading?.created_at);

const formatTimeLabel = (value) => {
	const date = parseTimestamp(value);
	if (!date) {
		return "--";
	}
	return date.toLocaleTimeString("en-GB", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
};

const bridgeOrder = ["Bridge_A", "Bridge_B", "Bridge_C", "Bridge_D"];

const kpiIcons = {
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
	battery: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<rect
				x="3"
				y="7"
				width="16"
				height="10"
				rx="2"
				stroke="currentColor"
				strokeWidth="1.6"
				fill="none"
			/>
			<rect x="19" y="10" width="2" height="4" fill="currentColor" />
		</svg>
	),
};

const chartPalette = {
	temperature: "#f59e0b",
	humidity: "#38bdf8",
	vibration: "#a78bfa",
	battery: "#34d399",
};

const distributionColors = [
	"rgba(63, 191, 143, 0.85)",
	"rgba(242, 184, 75, 0.85)",
	"rgba(224, 93, 93, 0.85)",
];

function Analytics() {
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

	const averages = useMemo(
		() => ({
			temperature: averageOf(sortedReadings, "temperature"),
			humidity: averageOf(sortedReadings, "humidity"),
			vibration: averageOf(sortedReadings, "vibration"),
			battery: averageOf(sortedReadings, "battery_level"),
		}),
		[sortedReadings]
	);

	const bridgeSnapshots = useMemo(() => {
		const latestByBridge = new Map();
		sortedReadings.forEach((reading) => {
			if (!latestByBridge.has(reading.bridge_id)) {
				latestByBridge.set(reading.bridge_id, reading);
			}
		});

		return bridgeOrder.map((bridgeId) => {
			const bridgeReadings = sortedReadings.filter(
				(reading) => reading.bridge_id === bridgeId
			);
			const latest = latestByBridge.get(bridgeId);
			return {
				bridgeId,
				latest,
				status: getOverallStatus(latest),
				averages: {
					temperature: averageOf(bridgeReadings, "temperature"),
					humidity: averageOf(bridgeReadings, "humidity"),
					vibration: averageOf(bridgeReadings, "vibration"),
				},
				readings: bridgeReadings,
			};
		});
	}, [sortedReadings]);

	const healthCounts = useMemo(() => {
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

	const trendReadings = useMemo(() => {
		return sortedReadings
			.slice(0, 40)
			.reverse()
			.map((reading) => {
				const timestamp = getReadingTimestamp(reading);
				return {
					timestamp: timestamp?.toISOString() ?? "",
					temperature: Number(reading.temperature),
					humidity: Number(reading.humidity),
					vibration: Number(reading.vibration),
					battery: Number(reading.battery_level),
				};
			});
	}, [sortedReadings]);

	const distributionData = useMemo(
		() => [
			{ name: "Healthy", value: healthCounts.healthy },
			{ name: "Warning", value: healthCounts.warning },
			{ name: "Critical", value: healthCounts.critical },
		],
		[healthCounts]
	);

	const comparisonRows = useMemo(
		() =>
			bridgeSnapshots.map((snapshot) => ({
				id: snapshot.bridgeId,
				bridgeId: snapshot.bridgeId,
				temperature: formatNumber(snapshot.averages.temperature),
				humidity: formatNumber(snapshot.averages.humidity),
				vibration: formatNumber(snapshot.averages.vibration),
				status: snapshot.status,
			})),
		[bridgeSnapshots]
	);

	const comparisonColumns = [
		{ key: "bridgeId", label: "Bridge" },
		{ key: "temperature", label: "Avg Temp", align: "right" },
		{ key: "humidity", label: "Avg Humidity", align: "right" },
		{ key: "vibration", label: "Avg Vibration", align: "right" },
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

	const insights = useMemo(() => {
		const highestTemperature = bridgeSnapshots.reduce((current, next) => {
			const nextValue = next.averages.temperature ?? -Infinity;
			const currentValue = current?.averages.temperature ?? -Infinity;
			return nextValue > currentValue ? next : current;
		}, null);

		const highestVibration = bridgeSnapshots.reduce((current, next) => {
			const nextValue = next.averages.vibration ?? -Infinity;
			const currentValue = current?.averages.vibration ?? -Infinity;
			return nextValue > currentValue ? next : current;
		}, null);

		const lowestBattery = bridgeSnapshots.reduce((current, next) => {
			const nextValue = averageOf(next.readings, "battery_level");
			const currentValue = current
				? averageOf(current.readings, "battery_level")
				: Infinity;
			if (nextValue === null || nextValue === undefined) {
				return current;
			}
			if (current === null || current === undefined) {
				return next;
			}
			return nextValue < currentValue ? next : current;
		}, null);

		const mostStable = bridgeSnapshots.reduce((current, next) => {
			const stability = (items) => {
				if (items.length === 0) {
					return null;
				}
				const mean = averageOf(items, "vibration");
				if (mean === null) {
					return null;
				}
				const variance = items.reduce((sum, item) => {
					const value = Number(item.vibration);
					if (Number.isNaN(value)) {
						return sum;
					}
					return sum + Math.pow(value - mean, 2);
				}, 0);
				return Math.sqrt(variance / items.length);
			};
			const nextStability = stability(next.readings);
			const currentStability = current ? stability(current.readings) : null;
			if (nextStability === null) {
				return current;
			}
			if (currentStability === null) {
				return next;
			}
			return nextStability < currentStability ? next : current;
		}, null);

		return [
			{
				label: "Highest Temperature Bridge",
				value: highestTemperature
					? `${highestTemperature.bridgeId} (${formatNumber(
							highestTemperature.averages.temperature
						)}°C)`
					: "--",
			},
			{
				label: "Highest Vibration Bridge",
				value: highestVibration
					? `${highestVibration.bridgeId} (${formatNumber(
							highestVibration.averages.vibration
						)} m/s²)`
					: "--",
			},
			{
				label: "Lowest Battery Bridge",
				value: lowestBattery
					? `${lowestBattery.bridgeId} (${formatNumber(
							averageOf(lowestBattery.readings, "battery_level")
						)}%)`
					: "--",
			},
			{
				label: "Most Stable Bridge",
				value: mostStable ? mostStable.bridgeId : "--",
			},
		];
	}, [bridgeSnapshots]);

	return (
		<div className="analytics">
			<section className="page-section">
				<div className="section-heading">
					<div className="page-header">
						<h1>Analytics</h1>
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
						Historical trend analysis and fleet performance insights.
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
					<h2>Analytics Overview</h2>
					<p className="section-subtitle">
						Fleet averages and health distribution across the bridge network.
					</p>
				</div>
				<div className="analytics-kpi-grid">
					<MetricCard
						label="Average Temperature"
						value={formatNumber(averages.temperature)}
						unit="°C"
						icon={kpiIcons.temperature}
						trend="steady"
						context={`Updated ${formatRelativeSeconds(lastResponseAt)}`}
					/>
					<MetricCard
						label="Average Humidity"
						value={formatNumber(averages.humidity)}
						unit="%"
						icon={kpiIcons.humidity}
						trend="steady"
						context={`Updated ${formatRelativeSeconds(lastResponseAt)}`}
					/>
					<MetricCard
						label="Average Vibration"
						value={formatNumber(averages.vibration)}
						unit="m/s²"
						icon={kpiIcons.vibration}
						trend="steady"
						context={`Updated ${formatRelativeSeconds(lastResponseAt)}`}
					/>
					<MetricCard
						label="Average Battery"
						value={formatNumber(averages.battery)}
						unit="%"
						icon={kpiIcons.battery}
						trend="steady"
						context={`Updated ${formatRelativeSeconds(lastResponseAt)}`}
					/>
					<div className="card overview-card">
						<span className="overview-label">Healthy Bridges</span>
						<span className="overview-value tone-healthy">
							{healthCounts.healthy}
						</span>
						<span className="overview-detail">Nominal status</span>
					</div>
					<div className="card overview-card">
						<span className="overview-label">Warning Bridges</span>
						<span className="overview-value tone-warning">
							{healthCounts.warning}
						</span>
						<span className="overview-detail">Monitor deviations</span>
					</div>
					<div className="card overview-card">
						<span className="overview-label">Critical Bridges</span>
						<span className="overview-value tone-critical">
							{healthCounts.critical}
						</span>
						<span className="overview-detail">Immediate attention</span>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Trend Analysis</h2>
					<p className="section-subtitle">
						Sensor trend lines based on the latest streaming window.
					</p>
				</div>
				<div className="analytics-chart-grid">
					<div className="card analytics-chart-card">
						<div className="chart-header">
							<span>Temperature Trend</span>
						</div>
						<div className="chart-canvas">
							<ResponsiveContainer width="100%" height={220}>
								<LineChart data={trendReadings} margin={{ left: 0, right: 16 }}>
									<CartesianGrid stroke="rgba(255,255,255,0.06)" />
									<XAxis
										dataKey="timestamp"
										tickFormatter={formatTimeLabel}
										stroke="#8fa3b4"
									/>
									<YAxis stroke="#8fa3b4" />
									<Tooltip
										contentStyle={{
											background: "#1a232c",
											border: "1px solid #2a3642",
											borderRadius: 12,
										}}
										labelFormatter={formatTimestamp}
									/>
									<Line
										type="monotone"
										dataKey="temperature"
										stroke={chartPalette.temperature}
										strokeWidth={2}
										dot={false}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>
					<div className="card analytics-chart-card">
						<div className="chart-header">
							<span>Humidity Trend</span>
						</div>
						<div className="chart-canvas">
							<ResponsiveContainer width="100%" height={220}>
								<LineChart data={trendReadings} margin={{ left: 0, right: 16 }}>
									<CartesianGrid stroke="rgba(255,255,255,0.06)" />
									<XAxis
										dataKey="timestamp"
										tickFormatter={formatTimeLabel}
										stroke="#8fa3b4"
									/>
									<YAxis stroke="#8fa3b4" />
									<Tooltip
										contentStyle={{
											background: "#1a232c",
											border: "1px solid #2a3642",
											borderRadius: 12,
										}}
										labelFormatter={formatTimestamp}
									/>
									<Line
										type="monotone"
										dataKey="humidity"
										stroke={chartPalette.humidity}
										strokeWidth={2}
										dot={false}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>
					<div className="card analytics-chart-card">
						<div className="chart-header">
							<span>Vibration Trend</span>
						</div>
						<div className="chart-canvas">
							<ResponsiveContainer width="100%" height={220}>
								<LineChart data={trendReadings} margin={{ left: 0, right: 16 }}>
									<CartesianGrid stroke="rgba(255,255,255,0.06)" />
									<XAxis
										dataKey="timestamp"
										tickFormatter={formatTimeLabel}
										stroke="#8fa3b4"
									/>
									<YAxis stroke="#8fa3b4" />
									<Tooltip
										contentStyle={{
											background: "#1a232c",
											border: "1px solid #2a3642",
											borderRadius: 12,
										}}
										labelFormatter={formatTimestamp}
									/>
									<Line
										type="monotone"
										dataKey="vibration"
										stroke={chartPalette.vibration}
										strokeWidth={2}
										dot={false}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>
					<div className="card analytics-chart-card">
						<div className="chart-header">
							<span>Battery Trend</span>
						</div>
						<div className="chart-canvas">
							<ResponsiveContainer width="100%" height={220}>
								<LineChart data={trendReadings} margin={{ left: 0, right: 16 }}>
									<CartesianGrid stroke="rgba(255,255,255,0.06)" />
									<XAxis
										dataKey="timestamp"
										tickFormatter={formatTimeLabel}
										stroke="#8fa3b4"
									/>
									<YAxis stroke="#8fa3b4" />
									<Tooltip
										contentStyle={{
											background: "#1a232c",
											border: "1px solid #2a3642",
											borderRadius: 12,
										}}
										labelFormatter={formatTimestamp}
									/>
									<Line
										type="monotone"
										dataKey="battery"
										stroke={chartPalette.battery}
										strokeWidth={2}
										dot={false}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Bridge Comparison</h2>
					<p className="section-subtitle">
						Average sensor readings per bridge across the active window.
					</p>
				</div>
				<DataTable
					columns={comparisonColumns}
					rows={comparisonRows}
					emptyMessage="No bridge data available."
				/>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Health Distribution</h2>
					<p className="section-subtitle">
						Current health state across the bridge fleet.
					</p>
				</div>
				<div className="health-distribution">
					<div className="card analytics-chart-card">
						<div className="chart-header">
							<span>Fleet Health Split</span>
						</div>
						<div className="chart-canvas">
							<ResponsiveContainer width="100%" height={240}>
								<PieChart>
									<Pie
										data={distributionData}
										dataKey="value"
										nameKey="name"
										innerRadius={60}
										outerRadius={90}
										paddingAngle={4}
									>
										{distributionData.map((entry, index) => (
											<Cell
												key={entry.name}
												fill={distributionColors[index % distributionColors.length]}
											/>
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											background: "#1a232c",
											border: "1px solid #2a3642",
											borderRadius: 12,
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
					<div className="card analytics-chart-card">
						<div className="chart-header">
							<span>Bridge Health Counts</span>
						</div>
						<div className="chart-canvas">
							<ResponsiveContainer width="100%" height={240}>
								<BarChart data={distributionData} margin={{ left: 0, right: 16 }}>
									<CartesianGrid stroke="rgba(255,255,255,0.06)" />
									<XAxis dataKey="name" stroke="#8fa3b4" />
									<YAxis stroke="#8fa3b4" allowDecimals={false} />
									<Tooltip
										contentStyle={{
											background: "#1a232c",
											border: "1px solid #2a3642",
											borderRadius: 12,
										}}
									/>
									<Bar dataKey="value">
										{distributionData.map((entry, index) => (
											<Cell
												key={entry.name}
												fill={distributionColors[index % distributionColors.length]}
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Insights Panel</h2>
					<p className="section-subtitle">
						Automated highlights based on recent bridge performance.
					</p>
				</div>
				<div className="insights-grid">
					{insights.map((insight) => (
						<div key={insight.label} className="card insight-card">
							<span className="overview-label">{insight.label}</span>
							<span className="overview-value">{insight.value}</span>
							<span className="overview-detail">Computed from live data</span>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}

export default Analytics;
