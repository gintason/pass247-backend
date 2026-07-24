import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    location: '',
    bio: '',
    preferred_exam_type: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/api/auth/profile/');
      const profile = response.data;
      setFormData({
        first_name: profile.user.first_name || '',
        last_name: profile.user.last_name || '',
        email: profile.user.email || '',
        phone_number: profile.phone_number || '',
        location: profile.location || '',
        bio: profile.bio || '',
        preferred_exam_type: profile.preferred_exam_type || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/api/auth/profile/update/', formData);
      if (response.data.success) {
        toast.success('Profile updated successfully!');
        if (updateUser) {
          updateUser(response.data.user);
        }
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const examTypes = [
    { value: 'JSS', label: 'JSSCE (Junior Secondary)' },
    { value: 'WASSCE', label: 'WAEC/NECO (Senior Secondary)' },
    { value: 'UTME', label: 'UTME/JAMB (University Entrance)' },
    { value: 'POST_UTME', label: 'Post-UTME (University Screening)' }
  ];

  return (
    <div className="profile-container py-4">
      <div className="container">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-4 mb-4">
            <div className="card border-0 shadow">
              <div className="card-body text-center p-4">
                <div className="mb-3">
                  <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '100px', height: '100px' }}>
                    <span className="display-5">
                      {formData.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <h4 className="fw-bold mb-1">
                  {formData.first_name} {formData.last_name}
                </h4>
                <p className="text-muted mb-2">{formData.email}</p>
                {user?.is_premium ? (
                  <span className="badge bg-warning text-dark px-3 py-2">
                    <i className="bi bi-crown-fill me-1"></i>Premium Member
                  </span>
                ) : (
                  <span className="badge bg-secondary px-3 py-2">Free Member</span>
                )}
                <hr className="my-3" />
                <button 
                  className="btn btn-outline-primary w-100"
                  onClick={() => navigate('/dashboard')}
                >
                  <i className="bi bi-house-door me-2"></i>Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="col-md-8">
            <div className="card border-0 shadow">
              <div className="card-header bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">Edit Profile</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        className="form-control"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        className="form-control"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Phone Number</label>
                    <input
                      type="tel"
                      name="phone_number"
                      className="form-control"
                      value={formData.phone_number}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Bio</label>
                    <textarea
                      name="bio"
                      className="form-control"
                      rows="3"
                      value={formData.bio}
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold">Preferred Exam Type</label>
                    <select
                      name="preferred_exam_type"
                      className="form-select"
                      value={formData.preferred_exam_type}
                      onChange={handleChange}
                    >
                      <option value="">Select an exam type</option>
                      {examTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;