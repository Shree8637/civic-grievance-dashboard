import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, List, BarChart3, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import './AdminLayout.css';

function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Grievance<br />Dashboard</h2>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className="sidebar-link">
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </NavLink>
          <NavLink to="/admin/map" className="sidebar-link">
            <Map size={20} />
            <span>Hotspot Map</span>
          </NavLink>
          <NavLink to="/admin/complaints" className="sidebar-link">
            <List size={20} />
            <span>Complaints</span>
          </NavLink>
          <NavLink to="/admin/analytics" className="sidebar-link">
            <BarChart3 size={20} />
            <span>Analytics</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {user && <p className="sidebar-user">{user.name}</p>}
          <button onClick={handleLogout} className="sidebar-logout" id="admin-logout-btn">
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
