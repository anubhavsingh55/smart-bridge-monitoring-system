function MetricCard({ label, value, unit, icon, trend, context }) {
	return (
		<div className="card metric-card">
			<div className="metric-header">
				<div className="metric-label">{label}</div>
				{icon && <span className="metric-icon">{icon}</span>}
			</div>
			<div className="metric-value">
				{value}
				{unit && <span className="metric-unit">{unit}</span>}
			</div>
			<div className="metric-footer">
				<span className={`trend trend-${trend || "steady"}`}>
					{trend === "up" && "^"}
					{trend === "down" && "v"}
					{(!trend || trend === "steady") && "o"}
				</span>
				<span className="metric-context">{context}</span>
			</div>
		</div>
	);
}

export default MetricCard;
