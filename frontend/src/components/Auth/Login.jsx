import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.username, formData.password);

      if (result.success) {
        toast.success('Signed in');
        navigate('/dashboard');
        return;
      }

      // Password was right but the email has never been confirmed — send
      // them to verification rather than leaving them stuck on an error.
      if (result.requiresVerification) {
        toast.info('Verify your email to finish signing in');
        navigate('/verify-email', { state: { email: result.email } });
        return;
      }

      toast.error(result.error || 'Sign in failed');
    } catch (error) {
      toast.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" className="auth-aside-brand">Pass24/7</Link>
        <div>
          <h2 className="auth-aside-title">Pick up where you left off.</h2>
          <p className="auth-aside-copy">
            Your practice history, scores and saved questions are waiting.
          </p>
          <ul className="auth-points">
            <li>Past questions for WAEC, NECO, JAMB and Post-UTME</li>
            <li>Timed mocks that match the real sitting</li>
            <li>Interview and promotion prep for working professionals</li>
          </ul>
        </div>
        <span aria-hidden="true" />
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <p className="auth-eyebrow">Welcome back</p>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">Enter your details to continue.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username or email</label>
              <input
                id="username"
                type="text"
                name="username"
                className="form-control form-control-lg"
                placeholder="e.g. adebayo"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-control form-control-lg"
                placeholder="••••••••"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-meta">
              <span />
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-alt">
            New to Pass24/7? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
