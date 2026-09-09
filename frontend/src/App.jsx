import { Routes, Route, Navigate } from 'react-router-dom';

// Citizen pages
import Home from './pages/citizen/Home';
import SubmitComplaint from './pages/citizen/SubmitComplaint';
import TrackComplaint from './pages/citizen/TrackComplaint';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminOverview from './pages/admin/AdminOverview';
import AdminMap from './pages/admin/AdminMap';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Layouts
import CitizenLayout from './layouts/CitizenLayout';
import AdminLayout from './layouts/AdminLayout';

function App() {
  return (
    <Routes>
      {/* ── Citizen Portal ─────────────────────────────── */}
      <Route element={<CitizenLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<SubmitComplaint />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route path="/track/:id" element={<TrackComplaint />} />
      </Route>

      {/* ── Admin Dashboard ────────────────────────────── */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="map" element={<AdminMap />} />
        <Route path="complaints" element={<AdminComplaints />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
