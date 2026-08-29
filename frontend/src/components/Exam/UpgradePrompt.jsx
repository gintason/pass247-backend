import React from 'react';
import { useNavigate } from 'react-router-dom';

const UpgradePrompt = ({ data, onClose }) => {
  const navigate = useNavigate();

  if (!data) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-crown me-2"></i>
              Upgrade to Continue Learning
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          
          <div className="modal-body p-4">
            <div className="text-center mb-4">
              <div className="display-1 mb-3">🎯</div>
              <h4 className="fw-bold">{data.message}</h4>
              <p className="text-muted">
                You've completed {data.questions_attempted} free questions. 
                Unlock the full question bank and many more features!
              </p>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="card h-100 border-primary">
                  <div className="card-body text-center">
                    <div className="text-primary mb-3">
                      <i className="fas fa-calendar-alt fa-3x"></i>
                    </div>
                    <h5 className="fw-bold">Monthly</h5>
                    <h3 className="text-primary">₦3,500</h3>
                    <p className="text-muted small">per month</p>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-check text-success me-2"></i>All subjects</li>
                      <li><i className="fas fa-check text-success me-2"></i>Full question bank</li>
                      <li><i className="fas fa-check text-success me-2"></i>Progress tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card h-100 border-warning">
                  <div className="card-body text-center">
                    <div className="text-warning mb-3">
                      <i className="fas fa-calendar-alt fa-3x"></i>
                    </div>
                    <span className="badge bg-warning text-dark mb-2">Popular</span>
                    <h5 className="fw-bold">Quarterly</h5>
                    <h3 className="text-warning">₦8,500</h3>
                    <p className="text-muted small">₦2,833/month</p>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-check text-success me-2"></i>Save 19%</li>
                      <li><i className="fas fa-check text-success me-2"></i>All features</li>
                      <li><i className="fas fa-check text-success me-2"></i>Priority support</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card h-100 border-success">
                  <div className="card-body text-center">
                    <div className="text-success mb-3">
                      <i className="fas fa-calendar-alt fa-3x"></i>
                    </div>
                    <h5 className="fw-bold">Yearly</h5>
                    <h3 className="text-success">₦40,000</h3>
                    <p className="text-muted small">₦3,333/month</p>
                    <ul className="list-unstyled">
                      <li><i className="fas fa-check text-success me-2"></i>Save 5%</li>
                      <li><i className="fas fa-check text-success me-2"></i>All features</li>
                      <li><i className="fas fa-check text-success me-2"></i>Certificate included</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-light p-3 rounded mb-3">
              <h6 className="fw-bold mb-2">What you get:</h6>
              <div className="row">
                <div className="col-6">
                  <p><i className="fas fa-check-circle text-success me-2"></i>5,000+ questions</p>
                  <p><i className="fas fa-check-circle text-success me-2"></i>Detailed explanations</p>
                  <p><i className="fas fa-check-circle text-success me-2"></i>Mock exams</p>
                </div>
                <div className="col-6">
                  <p><i className="fas fa-check-circle text-success me-2"></i>Progress tracking</p>
                  <p><i className="fas fa-check-circle text-success me-2"></i>Performance analytics</p>
                  <p><i className="fas fa-check-circle text-success me-2"></i>24/7 support</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Maybe Later
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                navigate('/payment-plans');
                onClose();
              }}
            >
              Upgrade Now <i className="fas fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;