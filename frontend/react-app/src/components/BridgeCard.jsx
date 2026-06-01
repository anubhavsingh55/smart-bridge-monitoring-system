function BridgeCard({ bridgeId, status, lastUpdate, connection }) {
	return (
		<div className="card bridge-card">
			<div className="bridge-card-header">
				<div>
					<span className="bridge-label">Bridge</span>
					<h3 className="bridge-title">{bridgeId}</h3>
				</div>
				<span className={`status-badge status-${status.tone}`}>
					{status.label}
				</span>
			</div>
			<div className="bridge-meta">
				<div className="bridge-meta-row">
					<span className="bridge-meta-label">Last Update</span>
					<span className="bridge-meta-value">{lastUpdate}</span>
				</div>
				<div className="bridge-meta-row">
					<span className="bridge-meta-label">Connection</span>
					<span className={`bridge-meta-value tone-${connection.tone}`}>
						{connection.label}
					</span>
				</div>
			</div>
		</div>
	);
}

export default BridgeCard;
