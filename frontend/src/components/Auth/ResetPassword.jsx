import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { resetId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

    try {
      await api.post(`/api/auth/reset-password/${resetId}/`, {
        password: formData.password
      });
      toast.success('Password reset successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card border-0 shadow-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold" style={{ color: '#4400ff' }}>Reset Password</h2>
                  <p className="text-muted">Enter your new password below</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">New Password</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control form-control-lg"
                      placeholder="********"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted">At least 8 characters, not entirely numeric</small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold">Confirm Password</label>
                    <input
                      type="password"
                      name="confirm_password"
                      className="form-control form-control-lg"
                      placeholder="********"
                      value={formData.confirm_password}
                      onChange={handleChange}
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
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
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

export default ResetPassword;