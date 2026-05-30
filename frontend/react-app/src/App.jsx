import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import LiveMonitoring from "./pages/LiveMonitoring";
import Bridges from "./pages/Bridges";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import DigitalTwin from "./pages/DigitalTwin";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live-monitoring" element={<LiveMonitoring />} />
        <Route path="/bridges" element={<Bridges />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/digital-twin" element={<DigitalTwin />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
