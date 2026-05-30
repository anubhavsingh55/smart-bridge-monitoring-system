function StatusCard({ label, value, tone = "neutral", detail }) {
  return (
    <div className={`card status-card status-${tone}`}>
      <div className="status-header">
        <span className={`status-dot status-${tone}`} aria-hidden="true" />
        <span className="status-label">{label}</span>
      </div>
      <span className="status-value">{value}</span>
      {detail && <span className="status-detail">{detail}</span>}
    </div>
  );
}

export default StatusCard;
