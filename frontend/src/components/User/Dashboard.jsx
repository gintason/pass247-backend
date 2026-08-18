import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

// Configure axios defaults
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
  };
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalQuestions: 0,
    averageScore: 0,
    completedExams: 0
  });
  const [recentSessions, setRecentSessions] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [trials, setTrials] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user stats.
      // This call is wrapped like the others below. Previously it sat bare in
      // the outer try, so any failure took the whole dashboard down with
      // "Failed to load dashboard data" — which is what happened when the
      // endpoint returned 402 to non-premium users. A single unavailable
      // panel should degrade to zeroes, not blank the page.
      try {
        const statsResponse = await axios.get('/api/exams/stats/');
        if (statsResponse.data) {
          setStats({
            totalSessions: statsResponse.data.stats?.totalSessions || 0,
            totalQuestions: statsResponse.data.stats?.totalQuestions || 0,
            averageScore: statsResponse.data.stats?.averageScore || 0,
            completedExams: statsResponse.data.stats?.completedSessions || 0
          });
        }
      } catch (err) {
        console.log('Stats not available:', err.message);
        setStats({
          totalSessions: 0,
          totalQuestions: 0,
          averageScore: 0,
          completedExams: 0
        });
      }
      
      // Fetch recent sessions - UPDATED URL
      try {
        const sessionsResponse = await axios.get('/api/exams/sessions/');
        const sessions = sessionsResponse.data.results || sessionsResponse.data || [];
        // Sort by most recent and take last 5
        const sorted = sessions
          .filter(s => s.status === 'COMPLETED')
          .sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at))
          .slice(0, 5);
        setRecentSessions(sorted);
      } catch (err) {
        console.log('Sessions not available:', err.message);
        setRecentSessions([]);
      }
      
      // Fetch performance data - UPDATED URL
      try {
        const perfResponse = await axios.get('/api/exams/performance/');
        setPerformance(perfResponse.data.results || perfResponse.data || []);
      } catch (err) {
        console.log('Performance not available:', err.message);
        setPerformance([]);
      }
      
      // Fetch trial status.
      // This previously called '/api/exams/trial-status/' first, which always
      // 404s: that path is registered as 'api/trial-status/' *inside*
      // exams/urls.py, which mounts at '/api/exams/', so the real URL is
      // '/api/exams/trial-status/'. The code then silently retried
      // '/api/exams/trial/status/' (the FreeTrialViewSet 'status' action),
      // which is the endpoint that actually works and is what the rest of the
      // app uses. Calling it directly removes a guaranteed failed request on
      // every dashboard load.
      try {
        const trialResponse = await axios.get('/api/exams/trial/status/');
        setTrials(trialResponse.data.trials || trialResponse.data || []);
      } catch (err) {
        console.log('Trial status not available:', err.message);
        setTrials([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">
          <h4>Error Loading Dashboard</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="container">
        {/* Welcome */}
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">
              Welcome back, {user?.first_name || user?.username || 'Student'}
            </h1>
            <p className="dash-sub">Pick up where you left off.</p>
          </div>
          <div className="dash-header-actions">
            {!user?.is_premium && (
              <button
                className="btn btn-warning"
                onClick={() => navigate('/payment-plans')}
              >
                <i className="bi bi-crown-fill me-2"></i>
                Upgrade to Premium
              </button>
            )}
            <button
              className="btn btn-outline-secondary"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Sign out
            </button>
          </div>
        </div>

        {/* Stats. Neutral tiles: the number is the content, so it leads and
            uses the tabular data face. The previous four saturated card
            colours carried no meaning, and white on #ffc100 failed contrast. */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Practice sessions', value: stats.totalSessions || 0, icon: 'bi-collection-play', unit: null },
            { label: 'Questions answered', value: stats.totalQuestions || 0, icon: 'bi-patch-question', unit: null },
            { label: 'Average score', value: (stats.averageScore?.toFixed(1) || 0), icon: 'bi-graph-up-arrow', unit: '%' },
            { label: 'Exams completed', value: stats.completedExams || 0, icon: 'bi-trophy', unit: null },
          ].map((stat, index) => (
            <div className="col-md-3 col-6" key={stat.label}>
              <motion.div
                className="dash-stat"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * (index + 1) }}
              >
                <span className="dash-stat-icon" aria-hidden="true">
                  <i className={`bi ${stat.icon}`}></i>
                </span>
                <span className="dash-stat-label">{stat.label}</span>
                <span className="dash-stat-value">
                  {stat.value}{stat.unit && <span className="dash-stat-unit">{stat.unit}</span>}
                </span>
              </motion.div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          {/* Recent Sessions */}
          <div className="col-lg-8">
            <div className="card border-0 shadow h-100">
              <div className="card-header bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">Recent Practice Sessions</h5>
              </div>
              <div className="card-body">
                {recentSessions.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {recentSessions.map((session, index) => (
                      <motion.div 
                        key={session.id}
                        className="list-group-item px-0"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">
                              {session.question_bank_name || session.question_bank?.name || 'Practice Session'}
                            </h6>
                            <small className="text-muted">
                              {formatDate(session.completed_at || session.created_at)}
                            </small>
                            <div className="mt-1">
                              <small className="text-muted me-2">
                                ✅ {session.correct_answers || 0} correct
                              </small>
                              <small className="text-muted me-2">
                                ❌ {session.wrong_answers || 0} wrong
                              </small>
                              <small className="text-muted">
                                📝 {session.answered_questions || 0}/{session.total_questions || 0} answered
                              </small>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className={`badge bg-${getScoreColor(session.percentage)} me-2 p-2`}>
                              {session.percentage?.toFixed(1) || 0}%
                            </span>
                            <br />
                            <button 
                              className="btn btn-sm btn-outline-primary mt-1"
                              onClick={() => navigate(`/session/${session.id}/result`)}
                            >
                              <i className="bi bi-eye me-1"></i>View Result
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-4">
                    No practice sessions yet. 
                    <Link to="/exams" className="d-block mt-2">Start practicing now!</Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Progress */}
          <div className="col-lg-4">
            <div className="card border-0 shadow mb-4">
              <div className="card-header bg-white border-0 pt-4">
                <h5 className="fw-bold mb-0">Quick Actions</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <Link to="/exams" className="btn btn-primary">
                    <i className="bi bi-play-circle me-2"></i>Start Practice
                  </Link>
                  <Link to="/profile" className="btn btn-outline-primary">
                    <i className="bi bi-person me-2"></i>View Profile
                  </Link>
                  {!user?.is_premium && (
                    <Link to="/payment-plans" className="btn btn-warning">
                      <i className="bi bi-crown me-2"></i>Upgrade Plan
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Free Trial Progress */}
            {trials.length > 0 && !user?.is_premium && (
              <div className="card border-0 shadow">
                <div className="card-header bg-white border-0 pt-4">
                  <h5 className="fw-bold mb-0">Free Trial Progress</h5>
                </div>
                <div className="card-body">
                  {trials.slice(0, 5).map((trial, index) => (
                    <div key={trial.subject || index} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="fw-bold">{trial.subject}</small>
                        <small>{trial.remaining}/{trial.total_free} left</small>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div 
                          className={`progress-bar ${trial.remaining <= 2 ? 'bg-danger' : 'bg-warning'}`}
                          style={{ 
                            width: trial.total_free === 'unlimited' ? '100%' : 
                              `${((trial.total_free - trial.remaining) / trial.total_free) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Performance by Subject */}
        {performance.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-0 shadow">
                <div className="card-header bg-white border-0 pt-4">
                  <h5 className="fw-bold mb-0">Performance by Subject</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    {performance.slice(0, 4).map((perf, index) => (
                      <div key={perf.id || index} className="col-md-3 col-6 mb-3">
                        <div className="text-center">
                          <h6 className="mb-2">{perf.subject_name || perf.subject?.name || 'Subject'}</h6>
                          <h3 className={`text-${getScoreColor(perf.average_score)}`}>
                            {perf.average_score?.toFixed(1) || 0}%
                          </h3>
                          <small className="text-muted">Avg. Score</small>
                          <div className="mt-1">
                            <small className="text-muted">
                              {perf.total_practices || 0} practice(s)
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;