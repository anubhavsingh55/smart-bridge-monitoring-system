import { NavLink } from "react-router-dom";

const navItems = [
	{
		label: "Dashboard",
		to: "/",
		icon: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M4 10l8-6 8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinejoin="round"
				/>
			</svg>
		),
	},
	{
		label: "Live Monitoring",
		to: "/live-monitoring",
		icon: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M4 12h4l2-4 4 8 2-4h4"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		),
	},
	{
		label: "Bridges",
		to: "/bridges",
		icon: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M3 17h18M4 17l2-8h12l2 8M7 9a5 5 0 0 1 10 0"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		),
	},
	{
		label: "Analytics",
		to: "/analytics",
		icon: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M4 18V9m6 9V6m6 12v-4m4 6H2"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinecap="round"
				/>
			</svg>
		),
	},
	{
		label: "Alerts",
		to: "/alerts",
		icon: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M12 9v4m0 4h.01M5 20h14l-7-16z"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		),
	},
	{
		label: "Digital Twin",
		to: "/digital-twin",
		icon: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<rect
					x="4"
					y="5"
					width="16"
					height="12"
					rx="2"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
				/>
				<path
					d="M8 19h8"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinecap="round"
				/>
			</svg>
		),
	},
	{
		label: "Reports",
		to: "/reports",
		icon: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M7 4h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinejoin="round"
				/>
				<path
					d="M14 4v4h4"
					stroke="currentColor"
					strokeWidth="1.6"
					strokeLinecap="round"
				/>
			</svg>
		),
	},
	{
		label: "Settings",
		to: "/settings",
		icon: (
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8 4l-2 .5-.7 2 .9 1.8-1.4 1.4-1.8-.9-2 .7L12 20l-.5-2-2-.7-1.8.9-1.4-1.4.9-1.8-.7-2L4 12l2-.5.7-2-.9-1.8L7.2 6l1.8.9 2-.7L12 4l.5 2 2 .7 1.8-.9 1.4 1.4-.9 1.8.7 2z"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.4"
					strokeLinejoin="round"
				/>
			</svg>
		),
	},
];

function Sidebar() {
	return (
		<aside className="sidebar">
			<div className="sidebar-header">
				<div className="sidebar-brand">SBHM</div>
				<span className="sidebar-subtitle">Monitoring Core</span>
			</div>
			<nav className="sidebar-nav">
				{navItems.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						className={({ isActive }) =>
							isActive ? "nav-link nav-link-active" : "nav-link"
						}
						end={item.to === "/"}
						title={item.label}
					>
						<span className="nav-icon" aria-hidden="true">
							{item.icon}
						</span>
						<span className="nav-text">{item.label}</span>
					</NavLink>
				))}
			</nav>
			<div className="sidebar-footer">Enterprise Monitoring Suite</div>
		</aside>
	);
}

export default Sidebar;
