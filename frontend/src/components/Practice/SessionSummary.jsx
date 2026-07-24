import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';

/**
 * Used two ways:
 *
 *  1. As a child of PracticeSession, which passes the `summary` prop
 *     directly after completing a session.
 *  2. As the /session/:sessionId/result route, which renders it with NO
 *     props. That path previously always showed "No session data
 *     available" — the component expected a prop the route never supplied,
 *     and its "Start New Practice" button called an undefined callback, so
 *     it did nothing.
 *
 * When no `summary` prop is given it now fetches the session by id itself.
 */
const SessionSummary = ({ summary: summaryProp, onReview, onNewPractice }) => {
  const navigate = useNavigate();
  const { sessionId } = useParams();

  const [fetched, setFetched] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const needsFetch = !summaryProp && Boolean(sessionId);

  useEffect(() => {
    if (!needsFetch) return;

    let cancelled = false;
    const loadSession = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        // The backend scopes sessions to request.user, so this can only
        // ever return the caller's own session.
        const response = await api.get(`/api/exams/sessions/${sessionId}/`);
        const data = response.data || {};
        if (cancelled) return;
        setFetched({
          session: data,
          total_questions: data.total_questions || 0,
          correct: data.correct_answers || 0,
          wrong: data.wrong_answers || 0,
          skipped: (data.total_questions || 0) - (data.answered_questions || 0),
          answered: data.answered_questions || 0,
          percentage: data.percentage || 0,
          time_spent_seconds: data.time_spent_seconds || 0,
          total_points: (data.correct_answers || 0) * 25,
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err.response?.status === 404
              ? "That practice session doesn't exist, or it isn't yours."
              : 'Could not load this result. Try again.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSession();
    return () => { cancelled = true; };
  }, [needsFetch, sessionId]);

  const summary = summaryProp || fetched;

  // Fall back to real destinations when used as a route, where these
  // callbacks are not supplied.
  const handleNewPractice = onNewPractice || (() => navigate('/exams'));
  const handleReview = onReview || (() => navigate(`/practice/${sessionId}/review`));

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading result…</span>
        </div>
        <p className="text-muted mt-3">Loading your result…</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container py-5" style={{ minHeight: '60vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-7 text-center">
            <div className="card border-0 shadow-sm rounded-4 p-5">
              <i className="bi bi-clipboard-x display-4 text-muted mb-3"></i>
              <h4 className="fw-bold mb-2">Result not available</h4>
              <p className="text-muted mb-4">
                {loadError || 'We could not find a result for this session.'}
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button className="btn btn-primary" onClick={handleNewPractice}>
                  Start new practice
                </button>
                <button className="btn btn-outline-secondary" onClick={() => navigate('/dashboard')}>
                  Go to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract data from both possible locations
  const sessionData = summary.session || {};
  
  // FORCE Number conversion to avoid type issues
  const total = Number(summary.total_questions || sessionData.total_questions || 0);
  const correct = Number(summary.correct || sessionData.correct_answers || 0);
  const wrong = Number(summary.wrong || sessionData.wrong_answers || 0);
  const skipped = Number(summary.skipped || (total - correct - wrong) || 0);
  const answered = Number(summary.answered || (correct + wrong) || 0);
  const score = Number(summary.percentage || sessionData.percentage || 0);
  const timeSpent = Number(summary.time_spent_seconds || sessionData.time_spent_seconds || 0);
  const totalPoints = Number(summary.total_points || (correct * 25) || 0);
  
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Outstanding! You\'re a star! 🌟';
    if (score >= 70) return 'Excellent work! You\'ve mastered this topic! 🎉';
    if (score >= 50) return 'Good effort! Keep practicing to improve your score. 💪';
    if (score >= 30) return 'You\'re making progress! Review the explanations and try again. 📚';
    return 'Keep learning! Every mistake is a learning opportunity. 🎯';
  };

  const getScoreIcon = (score) => {
    if (score >= 70) return 'fa-trophy';
    if (score >= 50) return 'fa-chart-line';
    if (score >= 30) return 'fa-book-open';
    return 'fa-graduation-cap';
  };

  const handleShareResults = () => {
    const text = `I just scored ${Math.round(score)}% on ${sessionData?.question_bank_name || 'an exam'}! 🎯`;
    if (navigator.share) {
      navigator.share({
        title: 'My Exam Results',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  const handleDownloadCertificate = () => {
    alert('Certificate download feature coming soon!');
  };

  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-8">
          {/* Success Header */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <span className="display-1">{score >= 70 ? '🎉' : score >= 50 ? '📚' : '💪'}</span>
            </div>
            <h2 className="display-6 fw-bold">Practice Session Complete!</h2>
            <p className="text-muted">Here's how you performed</p>
          </div>

          {/* Main Score Card */}
          <div className="card shadow-lg border-0 mb-4">
            <div className="card-body p-4 text-center">
              {/* Score Circle */}
              <div className="mb-4 position-relative d-inline-block">
                <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto bg-${getScoreColor(score)} bg-opacity-10`} 
                     style={{
                        width: '180px',
                        height: '180px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                     onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <div className="bg-white rounded-circle shadow-sm d-flex align-items-center justify-content-center flex-column" 
                       style={{
                         width: '140px',
                         height: '140px',
                         border: '4px solid #f8f9fa'
                       }}>
                    <span className="display-3 fw-bold mb-0">{Math.round(score)}</span>
                    <span className="text-muted small">%</span>
                  </div>
                </div>
                
                {/* Score Icon Badge */}
                <div className={`position-absolute bottom-0 end-0 bg-${getScoreColor(score)} text-white rounded-circle p-3 shadow`}
                     style={{ width: '50px', height: '50px' }}>
                  <i className={`fas ${getScoreIcon(score)}`}></i>
                </div>
              </div>

              {/* Score Message */}
              <div className="mb-4">
                <h4 className="fw-bold mb-2">{Math.round(score)}% Score</h4>
                <p className={`text-${getScoreColor(score)} mb-0`}>
                  <i className={`fas ${getScoreIcon(score)} me-2`}></i>
                  {getScoreMessage(score)}
                </p>
                {totalPoints > 0 && (
                  <div className="mt-2">
                    <span className="badge bg-warning text-dark fs-6">
                      <i className="fas fa-star me-1"></i>
                      {totalPoints} Points Earned
                    </span>
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="bg-light rounded-3 p-3">
                    <i className="fas fa-question-circle text-primary fs-4 mb-2"></i>
                    <h5 className="fw-bold mb-0">{total}</h5>
                    <small className="text-muted">Total Questions</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="bg-light rounded-3 p-3">
                    <i className="fas fa-check-circle text-success fs-4 mb-2"></i>
                    <h5 className="fw-bold mb-0 text-success">{correct}</h5>
                    <small className="text-muted">Correct</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="bg-light rounded-3 p-3">
                    <i className="fas fa-times-circle text-danger fs-4 mb-2"></i>
                    <h5 className="fw-bold mb-0 text-danger">{wrong}</h5>
                    <small className="text-muted">Wrong</small>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="bg-light rounded-3 p-3">
                    <i className="fas fa-star text-warning fs-4 mb-2"></i>
                    <h5 className="fw-bold mb-0 text-warning">{totalPoints}</h5>
                    <small className="text-muted">Points</small>
                  </div>
                </div>
              </div>

              {/* Accuracy Bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="small">Accuracy</span>
                  <span className="small fw-bold">
                    {accuracy}%
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className={`progress-bar bg-${getScoreColor(score)}`} 
                    role="progressbar" 
                    style={{ width: `${Math.min(score, 100)}%` }}
                    aria-valuenow={score} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="bg-light rounded-3 p-3 mb-4">
                <h6 className="fw-bold mb-3">Detailed Breakdown</h6>
                <div className="row text-center">
                  <div className="col">
                    <div className="p-2">
                      <div className="small text-muted">Correct</div>
                      <div className="h5 mb-0 text-success">{correct}</div>
                      <div className="small">{total > 0 ? Math.round((correct/total)*100) : 0}%</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="p-2 border-start border-end">
                      <div className="small text-muted">Wrong</div>
                      <div className="h5 mb-0 text-danger">{wrong}</div>
                      <div className="small">{total > 0 ? Math.round((wrong/total)*100) : 0}%</div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="p-2">
                      <div className="small text-muted">Skipped</div>
                      <div className="h5 mb-0 text-warning">{skipped}</div>
                      <div className="small">{total > 0 ? Math.round((skipped/total)*100) : 0}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap justify-content-center gap-2">
                {onReview && wrong > 0 && (
                  <button 
                    className="btn btn-outline-warning btn-lg"
                    onClick={handleReview}
                  >
                    <i className="fas fa-redo-alt me-2"></i>
                    Review {wrong} Wrong Answer{wrong !== 1 ? 's' : ''}
                  </button>
                )}
                
                <button 
                  className="btn btn-outline-primary btn-lg"
                  onClick={() => navigate('/dashboard')}
                >
                  <i className="fas fa-home me-2"></i>
                  Dashboard
                </button>
                
                <button 
                  className="btn btn-outline-success btn-lg"
                  onClick={handleNewPractice}
                >
                  <i className="fas fa-play me-2"></i>
                  New Practice
                </button>
              </div>

              {/* Share & Print */}
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <button 
                    className="btn btn-link text-decoration-none"
                    onClick={handleShareResults}
                  >
                    <i className="fas fa-share-alt me-2"></i>
                    Share Results
                  </button>
                  
                  {score >= 70 && (
                    <button 
                      className="btn btn-link text-decoration-none text-warning"
                      onClick={handleDownloadCertificate}
                    >
                      <i className="fas fa-certificate me-2"></i>
                      Download Certificate
                    </button>
                  )}
                  
                  <button 
                    className="btn btn-link text-decoration-none text-info"
                    onClick={() => window.print()}
                  >
                    <i className="fas fa-print me-2"></i>
                    Print Results
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Encouragement Card */}
          <div className="card bg-primary bg-opacity-10 border-0">
            <div className="card-body p-4 text-center">
              <div className="mb-3">
                <span className="display-6">💪</span>
              </div>
              <h5 className="fw-bold mb-2">Keep Going!</h5>
              <p className="mb-0 small">
                Every practice session brings you one step closer to mastery. 
                {wrong > 0 ? ` The ${wrong} question${wrong !== 1 ? 's' : ''} you got wrong are opportunities to learn and improve.` : ' Perfect score! You\'re ready for more challenges!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            .btn, .gap-2, .border-top {
              display: none !important;
            }
            .card {
              box-shadow: none !important;
              border: 1px solid #ddd !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default SessionSummary;