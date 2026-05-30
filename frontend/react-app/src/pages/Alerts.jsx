import { useMemo } from "react";

import useLatestReadings from "../hooks/useLatestReadings";
import { formatRelativeSeconds } from "../utils/formatters";
import { getConnectionHealth, getOverallStatus } from "../utils/status";

function Alerts() {
	const { readings, apiOnline, lastResponseAt } = useLatestReadings(5000);
	const latestReading = readings[0];
	const overallStatus = getOverallStatus(latestReading);

	const secondsSinceUpdate = useMemo(() => {
		if (!lastResponseAt) {
			return null;
		}
		return Math.round((Date.now() - lastResponseAt.getTime()) / 1000);
	}, [lastResponseAt]);

	const connectionHealth = getConnectionHealth(secondsSinceUpdate);

	return (
		<section className="page-section">
			<div className="page-header">
				<h1>Alerts</h1>
				<div className="page-actions">
					<span className={`status-badge status-${overallStatus.tone}`}>
						Overall {overallStatus.label}
					</span>
					<span className="data-freshness">
						Data Freshness: {formatRelativeSeconds(lastResponseAt)}
					</span>
				</div>
			</div>
			<div className="status-strip">
				<span className={`status-badge status-${apiOnline ? "healthy" : "critical"}`}>
					API {apiOnline ? "Online" : "Offline"}
				</span>
				<span className={`status-badge status-${connectionHealth.tone}`}>
					Connection {connectionHealth.label}
				</span>
			</div>
			<p className="coming-soon">Coming Soon</p>
		</section>
	);
}

export default Alerts;
