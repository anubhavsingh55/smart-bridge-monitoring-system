import { useEffect, useMemo, useState } from "react";

import useLatestReadings from "../hooks/useLatestReadings";
import { formatRelativeSeconds } from "../utils/formatters";
import { getConnectionHealth } from "../utils/status";

const formatTime = (date) =>
  date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

function Navbar() {
	const [time, setTime] = useState(formatTime(new Date()));
	const { apiOnline, lastResponseAt } = useLatestReadings(5000);

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

	return (
		<header className="navbar">
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
