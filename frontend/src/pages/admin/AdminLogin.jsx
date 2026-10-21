import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import api from '../../utils/api';
import './AdminLogin.css';

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      navigate('/admin');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Network error: Unable to connect to backend server'
          : 'Login failed. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-card card">
        <div className="login-header">
          <Shield size={32} className="login-icon" />
          <h1>Admin Login</h1>
          <p>Civic Grievance Intelligence Dashboard</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@grievance.local"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          id="admin-login-btn"
          style={{ width: '100%' }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
