import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = ({ 
  title, 
  subtitle, 
  primaryButtonText, 
  primaryButtonLink,
  secondaryButtonText,
  secondaryButtonLink,
  imageUrl 
}) => {
  const navigate = useNavigate();

  return (
    <section className="hero-section" style={{ 
      background: 'linear-gradient(135deg, #4400ff 0%, #ffcc00 100%)',
      minHeight: '600px',
      display: 'flex',
      alignItems: 'center'
    }}>
      <div className="container py-5">
        <div className="row align-items-center">
          <div className="col-lg-6 text-white">
            <h1 className="display-3 fw-bold mb-4">{title}</h1>
            <p className="lead mb-4">{subtitle}</p>
            <div className="d-flex gap-3 flex-wrap">
              {primaryButtonText && (
                <button 
                  className="btn btn-warning btn-lg px-4 py-3"
                  onClick={() => navigate(primaryButtonLink)}
                >
                  {primaryButtonText} <i className="fas fa-arrow-right ms-2"></i>
                </button>
              )}
              {secondaryButtonText && (
                <button 
                  className="btn btn-outline-light btn-lg px-4 py-3"
                  onClick={() => navigate(secondaryButtonLink)}
                >
                  {secondaryButtonText}
                </button>
              )}
            </div>
          </div>
          <div className="col-lg-6 mt-4 mt-lg-0">
            <img 
              src={imageUrl || '/images/hero-default.svg'} 
              alt="Hero" 
              className="img-fluid"
              style={{ maxHeight: '400px' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/500x400?text=Interview+Prep';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;