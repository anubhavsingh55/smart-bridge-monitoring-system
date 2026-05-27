import time
from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import streamlit as st


st.set_page_config(
	page_title="Smart Bridge Health Monitoring System",
	layout="wide",
	initial_sidebar_state="expanded",
)


DATA_PATH = Path(__file__).resolve().parents[1] / "cleaned dataset" / "cleaned_bridge_dataset.csv"

TEMPERATURE_COL = "Temperature_C"
VIBRATION_COL = "Vibration_ms2"
STRESS_COL = "Simulated_Localized_Stress_Index"
HUMIDITY_COL = "Humidity_percent"
CRACK_RISK_COL = "Crack_Propagation_mm"

TEMP_THRESHOLD = 60.0
VIBRATION_THRESHOLD = 0.8
STRESS_THRESHOLD = 100.0

WINDOW_SIZE = 60
REFRESH_SECONDS = 1.0


@st.cache_data(show_spinner=False)
def load_data(path: Path) -> pd.DataFrame:
	df = pd.read_csv(path)
	if "Timestamp" in df.columns:
		df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce")
	return df


def ensure_columns(df: pd.DataFrame, required: list[str]) -> None:
	missing = [col for col in required if col not in df.columns]
	if missing:
		st.error(f"Missing required columns: {', '.join(missing)}")
		st.stop()


def get_alert_level(row: pd.Series) -> tuple[str, str, list[str]]:
	breaches = []
	if row[TEMPERATURE_COL] > TEMP_THRESHOLD:
		breaches.append(f"Temperature > {TEMP_THRESHOLD}")
	if row[VIBRATION_COL] > VIBRATION_THRESHOLD:
		breaches.append(f"Vibration > {VIBRATION_THRESHOLD}")
	if row[STRESS_COL] > STRESS_THRESHOLD:
		breaches.append(f"Stress > {STRESS_THRESHOLD}")

	if breaches:
		return "CRITICAL", "#ff4d4f", breaches

	warning = False
	warning |= row[TEMPERATURE_COL] > TEMP_THRESHOLD * 0.8
	warning |= row[VIBRATION_COL] > VIBRATION_THRESHOLD * 0.8
	warning |= row[STRESS_COL] > STRESS_THRESHOLD * 0.8

	if warning:
		return "WARNING", "#fadb14", []

	return "SAFE", "#52c41a", []


def format_value(value: float, unit: str) -> str:
	if pd.isna(value):
		return "—"
	return f"{value:.2f} {unit}".strip()


def build_trend_chart(df: pd.DataFrame, x_col: str, y_col: str, title: str, color: str) -> go.Figure:
	fig = go.Figure()
	fig.add_trace(
		go.Scatter(
			x=df[x_col],
			y=df[y_col],
			mode="lines",
			line=dict(color=color, width=2),
			name=title,
		)
	)
	fig.update_layout(
		template="plotly_dark",
		margin=dict(l=10, r=10, t=40, b=10),
		height=320,
		title=title,
		xaxis_title="Time",
		yaxis_title="Value",
	)
	return fig


st.markdown(
	"""
	<style>
	.stApp {
		background: radial-gradient(circle at top left, #111827 0%, #0b1220 45%, #05070d 100%);
		color: #e5e7eb;
	}
	.block-container { padding-top: 1.5rem; }
	.metric-card {
		background: rgba(15, 23, 42, 0.9);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 12px;
		padding: 14px 16px;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
	}
	.metric-label { font-size: 0.85rem; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }
	.metric-value { font-size: 1.6rem; font-weight: 700; }
	.status-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		border-radius: 999px;
		font-weight: 600;
		background: rgba(15, 23, 42, 0.9);
		border: 1px solid rgba(148, 163, 184, 0.3);
	}
	.alert-panel {
		background: rgba(15, 23, 42, 0.9);
		border-radius: 12px;
		padding: 16px;
		border: 1px solid rgba(148, 163, 184, 0.25);
	}
	</style>
	""",
	unsafe_allow_html=True,
)


df = load_data(DATA_PATH)
ensure_columns(
	df,
	[TEMPERATURE_COL, VIBRATION_COL, STRESS_COL, HUMIDITY_COL, CRACK_RISK_COL],
)

if "row_idx" not in st.session_state:
	st.session_state["row_idx"] = 0

st.session_state["row_idx"] = (st.session_state["row_idx"] + 1) % len(df)
row_idx = st.session_state["row_idx"]
current_row = df.iloc[row_idx]

start_idx = max(0, row_idx - WINDOW_SIZE + 1)
window_df = df.iloc[start_idx : row_idx + 1].copy()

if "Timestamp" in df.columns and window_df["Timestamp"].notna().any():
	window_df["_x"] = window_df["Timestamp"]
	last_updated = current_row.get("Timestamp")
else:
	window_df["_x"] = range(start_idx, row_idx + 1)
	last_updated = row_idx

alert_level, alert_color, alert_breaches = get_alert_level(current_row)


st.title("Smart Bridge Health Monitoring System")

with st.sidebar:
	st.markdown("## Bridge Status")
	st.markdown(
		f"<div class='status-pill' style='color:{alert_color}'>● {alert_level}</div>",
		unsafe_allow_html=True,
	)

	st.markdown("## System Health Indicator")
	if "Structural_Health_Index_SHI" in df.columns:
		shi = current_row.get("Structural_Health_Index_SHI")
		st.metric("SHI", f"{shi:.2f}" if pd.notna(shi) else "—")
	else:
		st.metric("SHI", "—")

	st.markdown("## Last Updated")
	st.write(last_updated if pd.notna(last_updated) else "—")


metric_cols = st.columns(5)
metrics = [
	("Temperature", format_value(current_row[TEMPERATURE_COL], "°C")),
	("Vibration", format_value(current_row[VIBRATION_COL], "m/s²")),
	("Structural Stress", format_value(current_row[STRESS_COL], "index")),
	("Humidity", format_value(current_row[HUMIDITY_COL], "%")),
	("Crack Risk Score", format_value(current_row[CRACK_RISK_COL], "mm")),
]

for col, (label, value) in zip(metric_cols, metrics, strict=False):
	with col:
		st.markdown(
			f"""
			<div class="metric-card">
				<div class="metric-label">{label}</div>
				<div class="metric-value">{value}</div>
			</div>
			""",
			unsafe_allow_html=True,
		)

chart_cols = st.columns(3)
with chart_cols[0]:
	st.plotly_chart(
		build_trend_chart(window_df, "_x", TEMPERATURE_COL, "Temperature Trend", "#f97316"),
		use_container_width=True,
	)
with chart_cols[1]:
	st.plotly_chart(
		build_trend_chart(window_df, "_x", VIBRATION_COL, "Vibration Trend", "#38bdf8"),
		use_container_width=True,
	)
with chart_cols[2]:
	st.plotly_chart(
		build_trend_chart(window_df, "_x", STRESS_COL, "Stress Trend", "#f43f5e"),
		use_container_width=True,
	)

st.markdown("## Alert System")
alert_text = "No active alerts." if not alert_breaches else " | ".join(alert_breaches)
st.markdown(
	f"""
	<div class="alert-panel" style="border-color:{alert_color}">
		<div style="font-size:1.1rem; font-weight:700; color:{alert_color};">{alert_level}</div>
		<div style="margin-top:6px; color:#cbd5f5;">{alert_text}</div>
	</div>
	""",
	unsafe_allow_html=True,
)


time.sleep(REFRESH_SECONDS)
st.rerun()
