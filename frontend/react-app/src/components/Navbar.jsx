import { useEffect, useMemo, useRef, useState } from "react";

import useLatestReadings from "../hooks/useLatestReadings";
import { formatRelativeSeconds } from "../utils/formatters";
import { getConnectionHealth, getMetricStatus, getOverallStatus } from "../utils/status";

const formatTime = (date) =>
  date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const metricConfig = {
	temperature: { label: "Temperature", unit: "°C", field: "temperature" },
	humidity: { label: "Humidity", unit: "%", field: "humidity" },
	vibration: { label: "Vibration", unit: "m/s²", field: "vibration" },
	battery: { label: "Battery", unit: "%", field: "battery_level" },
};

const metricKeys = Object.keys(metricConfig);

const playBuzzer = () => {
	if (typeof window === "undefined") {
		return;
	}
	const AudioContext = window.AudioContext || window.webkitAudioContext;
	if (!AudioContext) {
		return;
	}
	const context = new AudioContext();
	const oscillator = context.createOscillator();
	const gainNode = context.createGain();
	oscillator.type = "square";
	oscillator.frequency.setValueAtTime(380, context.currentTime);
	gainNode.gain.setValueAtTime(0.05, context.currentTime);
	oscillator.connect(gainNode);
	gainNode.connect(context.destination);
	oscillator.start();
	oscillator.stop(context.currentTime + 0.35);
	oscillator.onended = () => {
		context.close();
	};
};

function Navbar() {
	const [time, setTime] = useState(formatTime(new Date()));
	const { readings, apiOnline, lastResponseAt } = useLatestReadings(5000);
	const [toasts, setToasts] = useState([]);
	const previousAlertKeys = useRef(new Set());
	const previousCriticalBridges = useRef(new Map());

	useEffect(() => {
		const timerId = setInterval(() => {
			setTime(formatTime(new Date()));
		}, 1000);

		return () => clearInterval(timerId);
	}, []);

	const secondsSinceUpdate = useMemo(() => {
		if (!lastResponseAt) {
			return null;
		}
		return Math.round((Date.now() - lastResponseAt.getTime()) / 1000);
	}, [lastResponseAt]);

	const connectionHealth = getConnectionHealth(secondsSinceUpdate);
	const freshnessLabel = lastResponseAt
		? formatRelativeSeconds(lastResponseAt)
		: "--";

	const latestByBridge = useMemo(() => {
		const latest = new Map();
		readings.forEach((reading) => {
			if (!latest.has(reading.bridge_id)) {
				latest.set(reading.bridge_id, reading);
			}
		});
		return Array.from(latest.values());
	}, [readings]);

	const hasCriticalAlert = useMemo(() => {
		return latestByBridge.some(
			(reading) => getOverallStatus(reading).tone === "critical"
		);
	}, [latestByBridge]);

	useEffect(() => {
		if (latestByBridge.length === 0) {
			return;
		}
		const activeAlertKeys = new Set();
		const criticalBridgeUpdates = new Map(previousCriticalBridges.current);
		let shouldBuzzer = false;

		latestByBridge.forEach((reading) => {
			const bridgeId = reading.bridge_id;
			const status = getOverallStatus(reading);
			const wasCritical = criticalBridgeUpdates.get(bridgeId) || false;
			const isCritical = status.tone === "critical";
			if (!wasCritical && isCritical) {
				shouldBuzzer = true;
			}
			criticalBridgeUpdates.set(bridgeId, isCritical);
			metricKeys.forEach((key) => {
				const config = metricConfig[key];
				const value = reading[config.field];
				const metricStatus = getMetricStatus(key, value);
				if (
					metricStatus.tone === "warning" ||
					metricStatus.tone === "critical"
				) {
					activeAlertKeys.add(`${bridgeId}-${key}-${metricStatus.tone}`);
				}
			});
		});

		const newAlerts = Array.from(activeAlertKeys).filter(
			(key) => !previousAlertKeys.current.has(key)
		);

		if (newAlerts.length > 0) {
			const createdToasts = newAlerts.map((key) => {
				const [bridgeId, metricKey, tone] = key.split("-");
				const config = metricConfig[metricKey];
				return {
					id: `${key}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
					tone,
					message: `${bridgeId} ${config.label} ${
						tone === "critical" ? "Critical" : "Warning"
					}`,
				};
			});

			setToasts((current) => [...current, ...createdToasts].slice(-4));
			createdToasts.forEach((toast) => {
				const timeoutMs = toast.tone === "warning" ? 5000 : 10000;
				setTimeout(() => {
					setToasts((current) =>
						current.filter((item) => item.id !== toast.id)
					);
				}, timeoutMs);
			});
		}

		if (shouldBuzzer) {
			playBuzzer();
		}

		previousAlertKeys.current = activeAlertKeys;
		previousCriticalBridges.current = criticalBridgeUpdates;
	}, [latestByBridge]);

	return (
		<header className="navbar">
			<div className="toast-container" aria-live="polite">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={`toast toast-${toast.tone}`}
					>
						<span className="toast-title">
							{toast.tone === "critical" ? "Critical Alert" : "Warning"}
						</span>
						<span className="toast-message">{toast.message}</span>
						<button
							type="button"
							className="toast-dismiss"
							onClick={() =>
								setToasts((current) =>
									current.filter((item) => item.id !== toast.id)
								)
							}
						>
							Dismiss
						</button>
					</div>
				))}
			</div>
			<div className="navbar-title">
				<span className="navbar-title-text">Smart Bridge Health Monitoring</span>
				<span className="navbar-subtitle">
					Industrial asset integrity dashboard
				</span>
			</div>
			<div className="navbar-meta">
				<div className="navbar-time">
					<span className="navbar-label">Current Time</span>
					<span className="navbar-value">{time}</span>
				</div>
				<div className="navbar-status">
					<span
						className={`status-dot status-${apiOnline ? "healthy" : "critical"}`}
						aria-hidden="true"
					/>
					<span className="navbar-value">
						System {apiOnline ? "Operational" : "Offline"}
					</span>
					{hasCriticalAlert ? (
						<span className="navbar-critical critical-pulse">
							🔴 Critical Alert Active
						</span>
					) : (
						<span className="navbar-healthy">🟢 System Healthy</span>
					)}
					<span className={`status-badge status-${connectionHealth.tone}`}>
						Connection {connectionHealth.label}
					</span>
				</div>
				<div className="navbar-meta-group">
					<span className="navbar-label">Data Freshness</span>
					<span className="navbar-value">{freshnessLabel}</span>
				</div>
				<div className="navbar-user">
					<div className="avatar" aria-hidden="true" />
					<div className="navbar-user-meta">
						<span className="navbar-label">Operator</span>
						<span className="navbar-value">Monitoring Desk</span>
					</div>
				</div>
			</div>
		</header>
	);
}

export default Navbar;
