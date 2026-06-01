function Settings() {
	return (
		<div className="settings">
			<section className="page-section">
				<div className="section-heading">
					<div className="page-header">
						<h1>Settings</h1>
					</div>
					<p className="section-subtitle">
						System configuration and monitoring preferences (read-only).
					</p>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>System Information</h2>
					<p className="section-subtitle">
						Core platform metadata and connectivity footprint.
					</p>
				</div>
				<div className="settings-grid">
					<div className="card settings-card">
						<span className="overview-label">System Name</span>
						<span className="overview-value">
							Smart Bridge Health Monitoring
						</span>
						<span className="overview-detail">Monitoring suite</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Version</span>
						<span className="overview-value">v1.0.0</span>
						<span className="overview-detail">Operational release</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Environment</span>
						<span className="overview-value">Production</span>
						<span className="overview-detail">Live telemetry</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">API Endpoint</span>
						<span className="overview-value">http://127.0.0.1:8000</span>
						<span className="overview-detail">FastAPI gateway</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Database Status</span>
						<span className="overview-value tone-healthy">Connected</span>
						<span className="overview-detail">PostgreSQL telemetry</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Last Update Time</span>
						<span className="overview-value">Live Stream</span>
						<span className="overview-detail">Updated continuously</span>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Sensor Thresholds</h2>
					<p className="section-subtitle">
						Reference thresholds used across analytics and alerts.
					</p>
				</div>
				<div className="threshold-grid">
					<div className="card settings-card">
						<span className="overview-label">Temperature</span>
						<div className="threshold-row">
							<span>Warning</span>
							<span>35°C</span>
						</div>
						<div className="threshold-row">
							<span>Critical</span>
							<span>45°C</span>
						</div>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Humidity</span>
						<div className="threshold-row">
							<span>Warning</span>
							<span>70%</span>
						</div>
						<div className="threshold-row">
							<span>Critical</span>
							<span>85%</span>
						</div>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Vibration</span>
						<div className="threshold-row">
							<span>Warning</span>
							<span>1.5 m/s²</span>
						</div>
						<div className="threshold-row">
							<span>Critical</span>
							<span>2.0 m/s²</span>
						</div>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Battery</span>
						<div className="threshold-row">
							<span>Warning</span>
							<span>50%</span>
						</div>
						<div className="threshold-row">
							<span>Critical</span>
							<span>20%</span>
						</div>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Refresh Settings</h2>
					<p className="section-subtitle">
						Current polling cadence (read-only).
					</p>
				</div>
				<div className="settings-grid">
					<div className="card settings-card">
						<span className="overview-label">Dashboard Refresh Rate</span>
						<span className="overview-value">5s</span>
						<span className="overview-detail">Live telemetry cadence</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Live Monitoring Refresh Rate</span>
						<span className="overview-value">5s</span>
						<span className="overview-detail">Sensor feed cadence</span>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Alert Settings</h2>
					<p className="section-subtitle">
						Notification preferences for operations monitoring.
					</p>
				</div>
				<div className="settings-grid">
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
							<span className="toggle-label">Buzzer Alerts</span>
							<span className="toggle-pill toggle-on">Enabled</span>
						</div>
						<div className="toggle-row">
							<span className="toggle-label">Desktop Notifications</span>
							<span className="toggle-pill toggle-off">Disabled</span>
						</div>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>System Health</h2>
					<p className="section-subtitle">
						Current operational signals and feed health.
					</p>
				</div>
				<div className="settings-grid">
					<div className="card settings-card">
						<span className="overview-label">API Status</span>
						<span className="status-badge status-healthy">Healthy</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Database Status</span>
						<span className="status-badge status-healthy">Healthy</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Connection Status</span>
						<span className="status-badge status-warning">Warning</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Sensor Feed Status</span>
						<span className="status-badge status-healthy">Healthy</span>
					</div>
				</div>
			</section>

			<section className="page-section">
				<div className="section-heading compact">
					<h2>Project Information</h2>
					<p className="section-subtitle">
						Platform stack and operational context.
					</p>
				</div>
				<div className="settings-grid">
					<div className="card settings-card">
						<span className="overview-label">Project Name</span>
						<span className="overview-value">
							Smart Bridge Health Monitoring System
						</span>
						<span className="overview-detail">Infrastructure monitoring</span>
					</div>
					<div className="card settings-card">
						<span className="overview-label">Technology Stack</span>
						<div className="stack-list">
							<span className="stack-pill">React</span>
							<span className="stack-pill">FastAPI</span>
							<span className="stack-pill">PostgreSQL</span>
							<span className="stack-pill">Docker</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

export default Settings;
