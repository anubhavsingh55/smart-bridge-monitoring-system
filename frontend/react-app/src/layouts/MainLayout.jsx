import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MainLayout() {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const location = useLocation();

	// Close sidebar when route changes on mobile
	useEffect(() => {
		setIsSidebarOpen(false);
	}, [location]);

	const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

	return (
		<div className="app-shell">
			<div 
				className={`sidebar-overlay ${isSidebarOpen ? "visible" : ""}`} 
				onClick={() => setIsSidebarOpen(false)}
			/>
			<Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
			<div className="app-content">
				<Navbar onMenuClick={toggleSidebar} />
				<main className="page">
					<Outlet />
				</main>
			</div>
		</div>
	);
}

export default MainLayout;
