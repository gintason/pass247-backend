import React from 'react';
import { useNavigate } from 'react-router-dom';
import UpgradeCTA from './UpgradeCTA';

/**
 * Shown in place of subscriber-only content (Study Notes, Syllabus, Past
 * Questions, quizzes, extra interview answers). The button / tab stays
 * visible; the content needs a subscription.
 */
const LockedContent = ({
  title = 'Subscribers only',
  message = 'Subscribe to unlock Study Notes, Syllabuses, Past Questions, unlimited questions and quizzes.',
  icon = 'bi-lock-fill',
  compact = false,
  signedIn = true,
}) => {
  const navigate = useNavigate();
  return (
    <div className={`locked-content ${compact ? 'locked-content--compact' : ''}`}>
      <div className="locked-content__icon"><i className={`bi ${icon}`}></i></div>
      <h5 className="locked-content__title">🔒 {title}</h5>
      <p className="locked-content__text">{message}</p>
      {!signedIn ? (
        <div className="d-flex flex-wrap justify-content-center gap-2">
          <button type="button" className="btn btn-primary" onClick={() => {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
            navigate('/login');
          }}>Log in</button>
          <button type="button" className="btn btn-outline-primary" onClick={() => navigate('/register')}>
            Create a free account
          </button>
        </div>
      ) : compact ? (
        <button type="button" className="btn btn-warning fw-bold" onClick={() => navigate('/payment-plans')}>
          <i className="bi bi-star-fill me-1"></i> Subscribe to unlock
        </button>
      ) : (
        <div className="text-start mt-3"><UpgradeCTA title="Unlock everything on Pass 24/7" message={message} /></div>
      )}
      <style>{`
        .locked-content { text-align: center; padding: 2rem 1rem; border: 2px dashed #e4e1ee;
          border-radius: 18px; background: linear-gradient(180deg, #faf9ff, #fff); }
        .locked-content--compact { padding: 1rem; border-style: solid; }
        .locked-content__icon { width: 56px; height: 56px; margin: 0 auto .75rem; border-radius: 50%;
          display: grid; place-items: center; background: #ede9fe; color: #4400ff; font-size: 1.5rem; }
        .locked-content--compact .locked-content__icon { width: 40px; height: 40px; font-size: 1.1rem; }
        .locked-content__title { font-weight: 800; margin-bottom: .35rem; }
        .locked-content__text { color: #5b5670; max-width: 56ch; margin: 0 auto 1rem; }
      `}</style>
    </div>
  );
};

export default LockedContent;
