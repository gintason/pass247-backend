import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { fetchCSRFToken } from '../../api/client';

const PracticeHome = () => {
  const navigate = useNavigate();
  const { examType, subjectName } = useParams();
  const [searchParams] = useSearchParams();

  const isTrial = searchParams.get('trial') === 'true';

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [subjectProgress, setSubjectProgress] = useState({});
  const [recommendedQuizzes, setRecommendedQuizzes] = useState([]);
  const [trialInfo, setTrialInfo] = useState(null);
  const [error, setError] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // ============================================================
  // FUNCTIONS DECLARED BEFORE EFFECTS
  // ============================================================
  const fetchTrialStatus = async () => {
    try {
      const response = await api.get('/api/exams/trial/status/');
      if (response.data && response.data.length > 0) {
        const subjectTrial = response.data.find(
          item => item.subject === subjectName
        );
        if (subjectTrial) {
          setTrialInfo(subjectTrial);
        }
      }
    } catch (error) {
      console.error('Error fetching trial status:', error);
    }
  };

  const fetchPerformanceData = async (subjectsList) => {
    try {
      const response = await api.get('/api/exams/performance/');
      const performances = response.data.results || response.data;

      const progressMap = {};

      subjectsList.forEach(subject => {
        const perf = performances.find(p =>
          p.subject_name === subject.name || p.subject === subject.name
        );

        if (perf) {
          progressMap[subject.name] = {
            total_questions_attempted: perf.total_questions_attempted || 0,
            total_correct: perf.total_correct || 0,
            average_score: perf.average_score || 0,
            total_questions: subject.question_count,
            percentage: perf.average_score || 0
          };
        } else {
          progressMap[subject.name] = {
            total_questions_attempted: 0,
            total_correct: 0,
            average_score: 0,
            total_questions: subject.question_count,
            percentage: 0
          };
        }
      });

      setSubjectProgress(progressMap);
    } catch (error) {
      console.log('Performance data not available:', error);
      const progressMap = {};
      subjectsList.forEach(subject => {
        progressMap[subject.name] = {
          total_questions_attempted: 0,
          total_correct: 0,
          average_score: 0,
          total_questions: subject.question_count,
          percentage: 0
        };
      });
      setSubjectProgress(progressMap);
    }
  };

  const determineDifficulty = (bank) => {
    const name = (bank.name || '').toLowerCase();
    if (name.includes('hard') || name.includes('advanced')) return 'Hard';
    if (name.includes('easy') || name.includes('beginner')) return 'Easy';
    return 'Medium';
  };

  const generateRecommendedQuizzes = (banks) => {
    const validBanks = banks.filter(bank => bank.name).slice(0, 3);
    const recommendations = validBanks.map(bank => ({
      subject: bank.subject_name || bank.subject,
      subject_id: bank.subject,
      exam_category: examType,
      topic: bank.name || 'Practice Quiz',
      difficulty: determineDifficulty(bank),
      bank_id: bank.id
    }));
    setRecommendedQuizzes(recommendations);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/api/exams/question-banks/', {
        params: {
          exam_category: examType
        }
      });

      const banks = response.data.results || response.data;

      if (banks.length > 0) {
        const subjectMap = new Map();

        banks.forEach(bank => {
          const name = bank.subject_name || bank.subject;
          if (!name) return;

          if (!subjectMap.has(name)) {
            subjectMap.set(name, {
              name: name,
              bank_id: bank.id,
              subject_id: bank.subject,
              question_count: bank.question_count || 0,
              is_subscribed: bank.is_subscribed || false,
              free_trial_remaining: bank.free_trial_remaining !== undefined ? bank.free_trial_remaining : 5,
              description: bank.description || ''
            });
          } else {
            subjectMap.get(name).question_count += bank.question_count || 0;
          }
        });

        const subjectsList = Array.from(subjectMap.values());
        setSubjects(subjectsList);

        await fetchPerformanceData(subjectsList);
        generateRecommendedQuizzes(banks);
      } else {
        setSubjects([]);
        setError('No subjects found. Please add question banks in the admin panel.');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load subjects. Please try again.');
      setLoading(false);
    }
  };

  const checkAuthStatus = useCallback(async () => {
    try {
      await fetchCSRFToken();

      const response = await api.get('/api/exams/auth/status/');

      if (response.data.is_authenticated) {
        setIsAuthenticated(true);
        return true;
      } else {
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      return false;
    } finally {
      setAuthChecked(true);
    }
  }, []);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const initCSRF = async () => {
      try {
        await fetchCSRFToken();
      } catch (error) {
        console.warn('CSRF initialization failed:', error);
      }
    };
    initCSRF();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const init = async () => {
      const authenticated = await checkAuthStatus();

      if (!authenticated) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
        return;
      }

      if (examType) {
        await fetchData();
      }
      if (isTrial && subjectName) {
        await fetchTrialStatus();
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examType, subjectName, isTrial, checkAuthStatus, navigate]);

  const handleStartPractice = async (subject) => {
    if (creatingSession) return;

    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login');
      return;
    }

    try {
      setCreatingSession(true);

      const csrfToken = await fetchCSRFToken();
      if (csrfToken) {
        api.defaults.headers.common['X-CSRFToken'] = csrfToken;
      }

      const response = await api.post('/api/exams/sessions/', {
        question_bank: subject.bank_id,
        session_type: 'PRACTICE',
        show_explanation_on_wrong: true,
        allow_review: true
      });

      const params = new URLSearchParams();
      if (isTrial) params.append('trial', 'true');
      params.append('bank_id', subject.bank_id);
      params.append('subject', encodeURIComponent(subject.name));
      if (subject.subject_id) {
        params.append('subject_id', subject.subject_id);
      }
      if (examType) {
        params.append('exam_category', examType);
      }

      navigate(`/practice/session/${response.data.id}?${params.toString()}`);
    } catch (err) {
      console.error('Error starting practice:', err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('Your session has expired. Please login again.');
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/login');
      } else if (err.response?.status === 402) {
        navigate('/payment-plans');
      } else {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to start practice session';
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setCreatingSession(false);
    }
  };

  const handleStartRecommended = async (quiz) => {
    if (creatingSession) return;

    try {
      setCreatingSession(true);
      await fetchCSRFToken();

      const response = await api.post('/api/exams/sessions/', {
        question_bank: quiz.bank_id,
        session_type: 'PRACTICE',
        show_explanation_on_wrong: true,
        allow_review: true
      });

      const params = new URLSearchParams();
      params.append('bank_id', quiz.bank_id);
      params.append('subject', quiz.subject);
      if (quiz.subject_id) params.append('subject_id', quiz.subject_id);
      if (quiz.exam_category) params.append('exam_category', quiz.exam_category);

      navigate(`/practice/session/${response.data.id}?${params.toString()}`);
    } catch (err) {
      console.error('Error starting recommended quiz:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else if (err.response?.status === 402) {
        navigate('/payment-plans');
      } else {
        alert('Error starting quiz');
      }
    } finally {
      setCreatingSession(false);
    }
  };

  const getExamTitle = () => {
    const titles = {
      'jssce': 'JSSCE',
      'waec': 'WAEC/NECO',
      'jamb': 'UTME/JAMB',
      'post-utme': 'Post-UTME',
      'aptitude': 'Aptitude Tests',
      'promotion': 'Promotion Exams',
      'civil': 'Civil Service Exams'
    };
    return titles[examType] || examType?.toUpperCase() || 'Exam';
  };

  const getSubjectIcon = (name) => {
    const icons = {
      'Biology': '🧬', 'Mathematics': '📐', 'English': '📖', 'English Studies': '📖',
      'Chemistry': '⚗️', 'Physics': '⚡', 'History': '📜', 'CRS': '✝️',
      'Business Studies': '💼', 'Agricultural Science': '🌾', 'Computer Studies': '💻',
      'Basic Science': '🔬', 'CCA': '🎨', 'Social Studies': '🌍', 'Economics': '📊',
      'General Paper': '📝', 'Subject Combinations': '📋', 'Aptitude Tests': '🧠',
      'Verbal Reasoning': '💬', 'Numerical Reasoning': '🔢', 'Abstract Reasoning': '🧩',
      'Time Management': '⏱️', 'Leadership Assessment': '👔', 'Management Skills': '📋',
      'Strategic Thinking': '🎯', 'Case Studies': '📚', 'Public Administration': '🏛️',
      'Quantitative Aptitude': '📊', 'English Language': '📖'
    };
    return icons[name] || '📚';
  };

  const getSubjectColor = (name) => {
    const colors = {
      'Biology': '#10b981', 'Mathematics': '#3b82f6', 'English': '#8b5cf6',
      'Chemistry': '#f59e0b', 'Physics': '#ef4444', 'History': '#6366f1',
      'CRS': '#ec4899', 'Business Studies': '#14b8a6', 'Agricultural Science': '#84cc16',
      'Computer Studies': '#06b6d4', 'Basic Science': '#0ea5e9', 'CCA': '#f97316',
      'Social Studies': '#a855f7', 'Economics': '#eab308', 'General Paper': '#64748b',
      'Subject Combinations': '#d946ef', 'Aptitude Tests': '#fb923c',
      'Verbal Reasoning': '#4400ff', 'Numerical Reasoning': '#28a745',
      'Abstract Reasoning': '#ffc100', 'Time Management': '#17a2b8',
      'Leadership Assessment': '#4400ff', 'Management Skills': '#28a745',
      'Strategic Thinking': '#ffc100', 'Case Studies': '#dc3545',
      'Public Administration': '#28a745', 'Quantitative Aptitude': '#ffc100',
      'English Language': '#17a2b8'
    };
    return colors[name] || '#6b7280';
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 70) return '#10b981';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading || !authChecked) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">{!authChecked ? 'Checking authentication...' : 'Loading subjects...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', minHeight: '70vh' }}>
      <style>{`
        .subject-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        .subject-card:hover {
          border-color: #3b82f6;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }
        .subject-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;
        }
        .subject-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .progress-bar-custom {
          height: 8px;
          background-color: #f3f4f6;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 0.75rem;
        }
        .progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.6s ease;
        }
        .trial-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .trial-badge.free {
          background: #fef3c7;
          color: #92400e;
        }
        .trial-badge.locked {
          background: #e5e7eb;
          color: #6b7280;
        }
        .trial-badge.subscribed {
          background: #d1fae5;
          color: #065f46;
        }
        .trial-banner {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 2px solid #fbbf24;
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .difficulty-badge {
          display: inline-block;
          padding: 0.2rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }
        .recommended-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .recommended-card:hover {
          border-color: #8b5cf6;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.08);
        }
        @media (max-width: 768px) {
          .trial-banner {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a1a1a' }}>
          {getExamTitle()} Subjects
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Select a subject to start practicing. Track your progress and improve your skills.
        </p>
      </div>

      {isTrial && (
        <div className="trial-banner">
          <div style={{ fontSize: '2rem' }}>🎁</div>
          <div style={{ flex: 1 }}>
            <h5 style={{ color: '#92400e', marginBottom: '0.25rem' }}>Free Trial Mode</h5>
            <p style={{ color: '#78350f', margin: 0 }}>
              {trialInfo
                ? `You have ${trialInfo.remaining} of ${trialInfo.total_free || 5} free questions remaining`
                : 'Try 5 free questions per subject!'
              }
            </p>
          </div>
          <button
            onClick={() => navigate('/payment-plans')}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '25px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="fas fa-crown me-2"></i>
            Upgrade
          </button>
        </div>
      )}

      {error && (
        <div className="alert alert-warning" style={{ borderRadius: '12px' }}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#3b82f6' }}>📚</span>
          Subjects
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.25rem'
        }}>
          {subjects.map((subject, index) => {
            const progress = subjectProgress[subject.name];
            const percentage = progress?.percentage || 0;
            const attempted = progress?.total_questions_attempted || 0;
            const total = subject.question_count;
            const color = getSubjectColor(subject.name);

            return (
              <div
                key={index}
                className={`subject-card ${creatingSession ? 'disabled' : ''}`}
                onClick={() => handleStartPractice(subject)}
              >
                {subject.is_subscribed ? (
                  <div className="trial-badge subscribed">
                    <i className="fas fa-check-circle me-1"></i> Subscribed
                  </div>
                ) : subject.free_trial_remaining > 0 ? (
                  <div className="trial-badge free">
                    🎁 {subject.free_trial_remaining} free
                  </div>
                ) : (
                  <div className="trial-badge locked">
                    🔒 Upgrade
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <div
                    className="subject-icon"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}
                  >
                    {getSubjectIcon(subject.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1a1a' }}>
                      {subject.name}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      {attempted}/{total} questions
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>Progress</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: getProgressBarColor(percentage) }}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="progress-bar-custom">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getProgressBarColor(percentage)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {recommendedQuizzes.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#f59e0b' }}>⭐</span>
            Recommended Quizzes
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            {recommendedQuizzes.map((quiz, index) => (
              <div
                key={index}
                className="recommended-card"
                onClick={() => handleStartRecommended(quiz)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div
                    className="subject-icon"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      fontSize: '1.2rem',
                      background: `linear-gradient(135deg, ${getSubjectColor(quiz.subject)}, ${getSubjectColor(quiz.subject)}dd)`
                    }}
                  >
                    {getSubjectIcon(quiz.subject)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{quiz.subject}</div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{quiz.topic}</div>
                  </div>
                </div>
                <span
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(quiz.difficulty) }}
                >
                  {quiz.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeHome;