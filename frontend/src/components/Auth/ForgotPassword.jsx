import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password/', { email });
      setSubmitted(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="forgot-password-container py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-5 text-center">
                  <div className="mb-4">
                    <i className="bi bi-envelope-check-fill display-1 text-success"></i>
                  </div>
                  <h3 className="fw-bold mb-3">Check Your Email</h3>
                  <p className="text-muted mb-4">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                  <Link to="/login" className="btn btn-primary">
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold" style={{ color: '#4400ff' }}>Forgot Password?</h2>
                  <p className="text-muted">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-bold">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 fw-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <Link to="/login" className="text-muted text-decoration-none">
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;