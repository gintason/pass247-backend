import React from 'react';
import { useNavigate } from 'react-router-dom';

const FreeTrialBanner = ({ subject, remaining, total, onUpgrade }) => {
  const navigate = useNavigate();
  const progress = ((total - remaining) / total) * 100;

  return (
    <div className="card bg-gradient-primary text-white mb-4">
      <div className="card-body p-4">
        <div className="row align-items-center">
          <div className="col-md-8">
            <div className="d-flex align-items-center mb-3">
              <div className="bg-white bg-opacity-25 rounded-circle p-3 me-3">
                <i className="fas fa-gift fa-2x text-white"></i>
              </div>
              <div>
                <h4 className="fw-bold mb-1">Free Trial: {subject}</h4>
                <p className="mb-0">Try {total} questions for free before upgrading</p>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span>Progress: {total - remaining} of {total} questions</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-warning" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            <p className="small mb-0">
              <i className="fas fa-info-circle me-2"></i>
              {remaining} free questions remaining. Upgrade to access all {total}+ questions!
            </p>
          </div>
          
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            <button 
              className="btn btn-warning btn-lg"
              onClick={onUpgrade}
            >
              Upgrade Now <i className="fas fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeTrialBanner;