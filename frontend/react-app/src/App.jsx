import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import MonitoringCenter from "./pages/MonitoringCenter";
import BridgeManagement from "./pages/BridgeManagement";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/monitoring-center" element={<MonitoringCenter />} />
        <Route path="/bridges" element={<BridgeManagement />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/live-monitoring"
          element={<Navigate to="/monitoring-center" replace />}
        />
        <Route
          path="/alerts"
          element={<Navigate to="/monitoring-center" replace />}
        />
        <Route
          path="/digital-twin"
          element={<Navigate to="/bridges" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
