import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    exam_interest: 'ACADEMIC'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (/^\d+$/.test(formData.password)) {
      toast.error('Password cannot be entirely numeric');
      return;
    }

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      // The account is created but inactive until the emailed code is
      // entered, so go straight to verification.
      toast.success('Account created. Check your email for a code.');
      navigate('/verify-email', {
        state: { email: result.email || formData.email }
      });
      return;
    }

    // The API returns a list of field errors; surface the first few rather
    // than a single generic failure.
    if (Array.isArray(result.errors) && result.errors.length) {
      result.errors.slice(0, 3).forEach((message) => toast.error(message));
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-shell auth-shell--plain">

      <main className="auth-main">
        <div className="auth-card auth-card--wide">
          <p className="auth-eyebrow">Step 1 of 2</p>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Takes a minute. We&apos;ll email you a code to confirm.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="row">
              <div className="col-sm-6 mb-3">
                <label htmlFor="first_name" className="form-label">First name</label>
                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  className="form-control"
                  placeholder="Adebayo"
                  autoComplete="given-name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-sm-6 mb-3">
                <label htmlFor="last_name" className="form-label">Last name</label>
                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  className="form-control"
                  placeholder="Okonkwo"
                  autoComplete="family-name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                id="username"
                type="text"
                name="username"
                className="form-control"
                placeholder="How you'll sign in"
                autoComplete="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-control"
                placeholder="you@example.com"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <small className="auth-hint">We send your verification code here.</small>
            </div>

            <div className="row">
              <div className="col-sm-6 mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <small className="auth-hint">8+ characters, not all numbers.</small>
              </div>
              <div className="col-sm-6 mb-3">
                <label htmlFor="confirm_password" className="form-label">Confirm password</label>
                <input
                  id="confirm_password"
                  type="password"
                  name="confirm_password"
                  className="form-control"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="exam_interest" className="form-label">I&apos;m preparing for</label>
              <select
                id="exam_interest"
                name="exam_interest"
                className="form-select"
                value={formData.exam_interest}
                onChange={handleChange}
              >
                <option value="ACADEMIC">Academic exams</option>
                <option value="INTERVIEW">Job interviews</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-alt">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Register;
