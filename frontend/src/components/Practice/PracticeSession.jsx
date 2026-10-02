import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QuestionDisplay from './QuestionDisplay';
import AnswerFeedback from './AnswerFeedback';
import ProgressBar from './ProgressBar';
import SessionSummary from './SessionSummary';
import api, { fetchCSRFToken } from '../../api/client';
import StudyNotesViewer from './StudyNotesViewer';
import PastQuestions from './PastQuestions';
import UpgradeCTA from './UpgradeCTA';

const formatClock = (seconds) => {
  const s = Math.max(0, seconds || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

// ============================================================
// MAIN PRACTICE SESSION COMPONENT
// ============================================================
const PracticeSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isTrial = searchParams.get('trial') === 'true';
  const bankId = searchParams.get('bank_id');
  const subjectName = searchParams.get('subject');
  const subjectId = searchParams.get('subject_id');
  const examCategory = searchParams.get('exam_category');
  // 'practice' (free Practice Portal) | 'exam' (timed Main Exam) | null (legacy)
  const modeParam = searchParams.get('mode');

  const [activeTab, setActiveTab] = useState('practice');
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [trialRemaining, setTrialRemaining] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeData, setUpgradeData] = useState(null);
  const [checking, setChecking] = useState(false);
  // Tracks which question indices have been answered, to style the
  // full-access question navigator (subscribed users only).
  const [answeredIndices, setAnsweredIndices] = useState(() => new Set());
  const [errorCode, setErrorCode] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [mainExamUnlocked, setMainExamUnlocked] = useState(true);

  const sessionType = session?.session_type || (modeParam === 'exam' ? 'EXAM' : 'PRACTICE');
  const isExamMode = sessionType === 'EXAM';
  const isPortalPractice = modeParam === 'practice' || session?.bank_type === 'PRACTICE';
  const portalUrl = `/practice-portal/${examCategory || session?.exam_category || ''}`
    + (subjectId ? `?subject=${subjectId}` : '');

  // ============================================================
  // FUNCTIONS DECLARED BEFORE EFFECTS
  // ============================================================
  const fetchSessionData = async () => {
    // See fetchPastQuestions for why this leading await is required.
    await Promise.resolve();
    try {
      setLoading(true);
      const questionResponse = await api.get(
        `/api/exams/sessions/${sessionId}/current_question/`
      );

      setCurrentQuestion(questionResponse.data.question);
      setQuestionIndex(questionResponse.data.question_index);
      setTotalQuestions(questionResponse.data.total_questions);

      if (questionResponse.data.has_been_answered) {
        setSelectedAnswer(questionResponse.data.previous_answer || '');
        const idx = questionResponse.data.question_index;
        setAnsweredIndices(prev => new Set(prev).add(idx));
      }

      if (questionResponse.data.session) {
        setSession(questionResponse.data.session);
        const remaining = questionResponse.data.session.time_remaining_seconds;
        setTimeLeft(typeof remaining === 'number' ? remaining : null);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading session:', err.response || err);
      const code = err.response?.data?.code;

      if (code === 'session_completed' || code === 'session_finished'
        || (err.response?.status === 400 && err.response?.data?.error === 'Session already completed')) {
        fetchSessionSummary();
      } else {
        // session_not_found / no_questions get a friendly screen (see render)
        setErrorCode(code || null);
        setError(err.response?.data?.error || 'Error loading session');
        setLoading(false);
      }
    }
  };

  const fetchSessionSummary = async () => {
    // See fetchPastQuestions for why this leading await is required.
    await Promise.resolve();
    try {
      setLoading(true);
      const response = await api.post(`/api/exams/sessions/${sessionId}/complete_session/`);

      if (response.data) {
        const summaryData = {
          session: response.data.session || response.data,
          total_questions: response.data.total_questions || response.data.session?.total_questions || 0,
          correct: response.data.correct || response.data.session?.correct_answers || 0,
          wrong: response.data.wrong || response.data.session?.wrong_answers || 0,
          skipped: response.data.skipped || 0,
          answered: response.data.answered || 0,
          percentage: response.data.percentage || response.data.session?.percentage || 0,
          time_spent_seconds: response.data.time_spent_seconds || response.data.session?.time_spent_seconds || 0,
          total_points: response.data.total_points || (response.data.correct * 25) || 0
        };
        setSessionSummary(summaryData);
        setSessionCompleted(true);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching summary:', err.response || err);

      if (err.response?.status === 400 && err.response?.data?.error === 'Session already completed') {
        try {
          const sessionResponse = await api.get(`/api/exams/sessions/${sessionId}/`);
          const sessionData = sessionResponse.data;
          const summaryData = {
            session: sessionData,
            total_questions: sessionData.total_questions || 0,
            correct: sessionData.correct_answers || 0,
            wrong: sessionData.wrong_answers || 0,
            skipped: (sessionData.total_questions || 0) - (sessionData.answered_questions || 0),
            answered: sessionData.answered_questions || 0,
            percentage: sessionData.percentage || 0,
            time_spent_seconds: sessionData.time_spent_seconds || 0,
            total_points: (sessionData.correct_answers || 0) * 25
          };
          setSessionSummary(summaryData);
          setSessionCompleted(true);
        } catch (sessionErr) {
          console.error('Error fetching session directly:', sessionErr);
          setError('Could not compile your test results. Please try again.');
        }
      } else {
        setError(err.response?.data?.error || 'Could not compile your test results. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    if (feedback) {
      setFeedback(null);
      setShowFeedback(false);
    }
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer) {
      alert('Please select an answer first');
      return;
    }

    try {
      setChecking(true);
      setError(null);

      if (isTrial && bankId) {
        const response = await api.post(
          `/api/exams/question-banks/${bankId}/submit_answer_trial/`,
          {
            question_id: currentQuestion.id,
            selected_answer: selectedAnswer,
            time_spent_seconds: 30,
            session_id: parseInt(sessionId)
          }
        );

        setFeedback({
          ...response.data,
          is_correct: response.data.is_correct || false,
          correct_option: response.data.correct_option,
          points_earned: response.data.points_earned || 0
        });
        setShowFeedback(true);

        if (response.data.trial_remaining !== undefined) {
          setTrialRemaining(response.data.trial_remaining);
        }
        if (response.data.upgrade_prompt) {
          setUpgradeData(response.data.upgrade_prompt);
          setShowUpgradePrompt(true);
        }
      } else {
        const response = await api.post(
          `/api/exams/sessions/${sessionId}/check_answer/`,
          {
            question_id: currentQuestion.id,
            selected_answer: selectedAnswer,
            time_spent_seconds: 30
          }
        );

        setFeedback({
          ...response.data,
          is_correct: response.data.is_correct || false,
          correct_option: response.data.correct_option,
          points_earned: response.data.points_earned || 0
        });
        setShowFeedback(true);

        setSession(prev => prev ? {
          ...prev,
          correct_answers: response.data.is_correct ? (prev.correct_answers || 0) + 1 : (prev.correct_answers || 0),
          wrong_answers: !response.data.is_correct ? (prev.wrong_answers || 0) + 1 : (prev.wrong_answers || 0),
        } : null);
        setAnsweredIndices(prev => new Set(prev).add(questionIndex));
      }

      setChecking(false);
    } catch (err) {
      console.error('Error checking answer:', err.response || err);
      if (err.response?.status === 402) {
        setUpgradeData(err.response.data);
        setShowUpgradePrompt(true);
      } else {
        setError(err.response?.data?.error || 'Error checking answer');
      }
      setChecking(false);
    }
  };

  // Main Exam: record the answer and move on - no answer reveal until the end.
  const handleSaveExamAnswer = async () => {
    if (!selectedAnswer) return;
    try {
      setChecking(true);
      setError(null);
      await api.post(`/api/exams/sessions/${sessionId}/check_answer/`, {
        question_id: currentQuestion.id,
        selected_answer: selectedAnswer,
        time_spent_seconds: 30,
      });
      setAnsweredIndices(prev => new Set(prev).add(questionIndex));
      setChecking(false);
      await handleNextQuestion();
    } catch (err) {
      console.error('Error saving exam answer:', err.response || err);
      setChecking(false);
      if (err.response?.data?.code === 'time_up') {
        await fetchSessionSummary();
      } else {
        setError(err.response?.data?.error || 'Could not save your answer');
      }
    }
  };

  const handleNextQuestion = async () => {
    if (showUpgradePrompt) {
      navigate(`/payment-plans?bank_id=${bankId}&subject=${encodeURIComponent(subjectName || '')}`);
      return;
    }

    try {
      setLoading(true);

      if (isTrial && trialRemaining !== null && trialRemaining <= 0) {
        setUpgradeData({
          message: "You've completed all free questions. Upgrade to continue!",
          upgrade_url: '/payment-plans'
        });
        setShowUpgradePrompt(true);
        setLoading(false);
        return;
      }

      const response = await api.post(
        `/api/exams/sessions/${sessionId}/next_question/`,
        { is_trial: isTrial }
      );

      if (response.data.status === 'moving to next question') {
        setCurrentQuestion(response.data.question);
        setQuestionIndex(response.data.question_index);
        setSelectedAnswer('');
        setFeedback(null);
        setShowFeedback(false);
        setLoading(false);
      } else {
        const summaryData = {
          session: response.data.session || response.data,
          total_questions: response.data.total_questions || response.data.session?.total_questions || totalQuestions,
          correct: response.data.correct || response.data.session?.correct_answers || 0,
          wrong: response.data.wrong || response.data.session?.wrong_answers || 0,
          skipped: response.data.skipped || 0,
          answered: response.data.answered || 0,
          percentage: response.data.percentage || response.data.session?.percentage || 0,
          time_spent_seconds: response.data.time_spent_seconds || response.data.session?.time_spent_seconds || 0,
          total_points: response.data.total_points || (response.data.correct * 25) || 0
        };
        setSessionSummary(summaryData);
        setSessionCompleted(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error moving to next question:', err.response || err);

      if (err.response?.status === 400 && err.response?.data?.error === 'Session already completed') {
        await fetchSessionSummary();
      } else {
        setError(err.response?.data?.error || 'Error moving to next question');
        setLoading(false);
      }
    }
  };

  const handleSkipQuestion = async () => {
    try {
      setLoading(true);
      const response = await api.post(
        `/api/exams/sessions/${sessionId}/skip_question/`
      );

      if (response.data.has_next) {
        await fetchSessionData();
      } else {
        await fetchSessionSummary();
      }
    } catch (err) {
      console.error('Error skipping question:', err.response || err);
      setError(err.response?.data?.error || 'Error skipping question');
      setLoading(false);
    }
  };

  const handleReviewWrongAnswers = () => {
    navigate(`/practice/${sessionId}/review`);
  };

  // Jump directly to any question number (full-access / subscribed users).
  // Trial sessions stay sequential, so the navigator is not shown for them.
  const handleGotoQuestion = async (targetIndex) => {
    if (isTrial || targetIndex === questionIndex) return;
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(
        `/api/exams/sessions/${sessionId}/goto_question/`,
        { question_index: targetIndex }
      );

      setCurrentQuestion(response.data.question);
      setQuestionIndex(response.data.question_index);
      setTotalQuestions(response.data.total_questions);
      setSelectedAnswer(response.data.previous_answer || '');
      setFeedback(null);
      setShowFeedback(false);
      if (response.data.has_been_answered) {
        setAnsweredIndices(prev => new Set(prev).add(response.data.question_index));
      }
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error jumping to question:', err.response || err);
      if (err.response?.status === 402) {
        // Trial user tried to jump — send them to upgrade.
        setUpgradeData(err.response.data);
        setShowUpgradePrompt(true);
      } else {
        setError(err.response?.data?.error || 'Could not open that question');
      }
      setLoading(false);
    }
  };

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

  // Main Exam countdown; auto-submits when time runs out.
  useEffect(() => {
    if (!isExamMode || timeLeft === null || sessionCompleted) return undefined;
    if (timeLeft <= 0) {
      fetchSessionSummary();
      return undefined;
    }
    const timer = setTimeout(() => setTimeLeft(t => (t === null ? t : t - 1)), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamMode, timeLeft, sessionCompleted]);

  // Whether to show the "Unlock Main Exam Mode" prompts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/exams/portal/access/');
        if (!cancelled) setMainExamUnlocked(!!res.data.main_exam_unlocked);
      } catch { /* keep prompts hidden on failure */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
      if (activeTab === 'practice') {
        // Same false positive as in PastQuestions above.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSessionData();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, activeTab]);

  if (loading && !sessionCompleted && activeTab === 'practice') {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading practice session...</p>
        </div>
      </div>
    );
  }

  if (showUpgradePrompt) {
    return (
      <div className="container mt-5" style={{ minHeight: '70vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center p-5">
                <div className="mb-4">
                  <i className="fas fa-gift text-warning display-1"></i>
                </div>
                <h3 className="mb-3">Free Trial Complete!</h3>
                <p className="text-muted mb-4">
                  {upgradeData?.message || "You've completed all free questions. Upgrade to continue practicing!"}
                </p>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-warning btn-lg"
                    onClick={() => navigate(`/payment-plans?bank_id=${bankId}&subject=${encodeURIComponent(subjectName || '')}`)}
                  >
                    <i className="fas fa-crown me-2"></i>
                    Upgrade to Continue
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => navigate('/exams')}>
                    Back to Exams
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionCompleted && activeTab === 'practice') {
    return (
      <>
        <SessionSummary
          summary={sessionSummary}
          onReview={handleReviewWrongAnswers}
          onNewPractice={() => navigate(isPortalPractice || isExamMode ? portalUrl : '/dashboard')}
          isTrial={isTrial}
        />
        {!isExamMode && !mainExamUnlocked && (
          <div className="container pb-5" style={{ maxWidth: 900 }}>
            <UpgradeCTA
              title="Great practice! Now try it under exam conditions"
              message="Unlock Main Exam Mode for timed papers by year, exam-standard scoring and full results. Practice and study notes stay free."
            />
          </div>
        )}
      </>
    );
  }

  if (error && activeTab === 'practice') {
    const dead = errorCode === 'session_not_found' || errorCode === 'no_questions';
    return (
      <div className="container mt-5" style={{ minHeight: '70vh' }}>
        <div className={`alert ${dead ? 'alert-warning' : 'alert-danger'}`}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {dead ? (
            <button className="btn btn-primary" onClick={() => navigate(portalUrl)}>
              <i className="fas fa-th-large me-2"></i> Go to Practice Portal
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => { setError(null); setErrorCode(null); fetchSessionData(); }}>
              <i className="fas fa-redo me-2"></i> Try Again
            </button>
          )}
          <button className="btn btn-outline-secondary" onClick={() => navigate('/dashboard')}>
            <i className="fas fa-home me-2"></i> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <div className="col-md-10 mx-auto">
          {isTrial && activeTab === 'practice' && (
            <div className="alert alert-info mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="fas fa-gift me-2"></i>
                  <strong>Free Trial Mode</strong>
                  {trialRemaining !== null && <span className="ms-2">- {trialRemaining} questions remaining</span>}
                </div>
                <button className="btn btn-warning btn-sm" onClick={() => navigate(`/payment-plans?bank_id=${bankId}`)}>
                  Upgrade
                </button>
              </div>
            </div>
          )}

          <div className="text-center mb-4">
            <h3 className="text-primary fw-bold">
              <i className="fas fa-graduation-cap me-2"></i>
              {subjectName || session?.subject_name || 'Practice Session'}
            </h3>
            <div className="d-flex justify-content-center flex-wrap gap-2 mt-2">
              {isExamMode ? (
                <span className="badge rounded-pill text-bg-dark px-3 py-2">
                  <i className="fas fa-stopwatch me-1"></i> Main Exam Mode
                </span>
              ) : (
                <span className="badge rounded-pill text-bg-success px-3 py-2">
                  <i className="fas fa-unlock me-1"></i> Practice Mode · instant feedback
                </span>
              )}
              {isExamMode && timeLeft !== null && (
                <span className={`badge rounded-pill px-3 py-2 ${timeLeft < 300 ? 'text-bg-danger' : 'text-bg-light'}`}
                  style={{ fontFamily: 'var(--pas-font-data, monospace)', fontSize: '0.95rem' }}
                  aria-live="polite">
                  <i className="fas fa-clock me-1"></i>{formatClock(timeLeft)} left
                </span>
              )}
            </div>
          </div>

          {!isExamMode && !isTrial && !mainExamUnlocked && activeTab === 'practice' && (
            <div className="mb-4">
              <UpgradeCTA variant="banner" title="Practising well? Unlock timed Main Exam Mode" />
            </div>
          )}

          {activeTab === 'practice' && !sessionCompleted && (
            <ProgressBar current={questionIndex + 1} total={isTrial ? 5 : totalQuestions} />
          )}

          {activeTab === 'practice' && !sessionCompleted && !isTrial && totalQuestions > 1 && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    <i className="fas fa-th me-2 text-primary"></i>
                    All Questions
                  </h6>
                  <span className="text-muted small">
                    Tap any number to jump — answered are green
                  </span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {Array.from({ length: totalQuestions }, (_, i) => {
                    const isCurrent = i === questionIndex;
                    const isAnswered = answeredIndices.has(i);
                    let cls = 'btn btn-sm ';
                    if (isCurrent) cls += 'btn-primary';
                    else if (isAnswered) cls += 'btn-success';
                    else cls += 'btn-outline-secondary';
                    return (
                      <button
                        key={i}
                        type="button"
                        className={cls}
                        style={{ minWidth: '42px' }}
                        disabled={loading || checking}
                        onClick={() => handleGotoQuestion(i)}
                        title={`Question ${i + 1}${isAnswered ? ' (answered)' : ''}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-0">
              {!isExamMode && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '4px',
                marginBottom: '0',
              }}>
                <div style={{
                  display: 'flex',
                  backgroundColor: '#ffffff',
                  borderRadius: '13px',
                  overflow: 'hidden',
                }}>
                  <button
                    onClick={() => setActiveTab('practice')}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      border: 'none',
                      outline: 'none',
                      backgroundColor: activeTab === 'practice' ? '#0d6efd' : 'transparent',
                      color: activeTab === 'practice' ? '#ffffff' : '#2d3748',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📝</span>
                    <span>Practice</span>
                    {activeTab === 'practice' && (
                      <span style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                      }}>Active</span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      border: 'none',
                      outline: 'none',
                      backgroundColor: activeTab === 'notes' ? '#059669' : 'transparent',
                      color: activeTab === 'notes' ? '#ffffff' : '#2d3748',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      borderRight: '1px solid #e2e8f0',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>📖</span>
                    <span>Study Notes</span>
                    {activeTab === 'notes' && (
                      <span style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                      }}>Active</span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('past-questions')}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      border: 'none',
                      outline: 'none',
                      backgroundColor: activeTab === 'past-questions' ? '#7c3aed' : 'transparent',
                      color: activeTab === 'past-questions' ? '#ffffff' : '#2d3748',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🗂️</span>
                    <span>Past Questions</span>
                    {activeTab === 'past-questions' && (
                      <span style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                      }}>Active</span>
                    )}
                  </button>
                </div>
              </div>
              )}

              <div className="p-4">
                {activeTab === 'practice' && (
                  <div className="tab-content">
                    <QuestionDisplay
                      question={currentQuestion}
                      selectedAnswer={selectedAnswer}
                      onAnswerSelect={handleAnswerSelect}
                      showFeedback={showFeedback}
                      feedback={feedback}
                      disabled={showFeedback}
                    />

                    {isExamMode ? (
                      <div className="d-flex justify-content-between mt-4">
                        <button className="btn btn-outline-secondary" onClick={handleSkipQuestion} disabled={loading || checking}>
                          Skip
                        </button>
                        <div className="d-flex gap-2">
                          <button className="btn btn-outline-danger" disabled={loading || checking}
                            onClick={() => { if (window.confirm('Submit the exam now? Unanswered questions will be marked as not answered.')) fetchSessionSummary(); }}>
                            Submit Exam
                          </button>
                          <button className="btn btn-dark" onClick={handleSaveExamAnswer} disabled={!selectedAnswer || loading || checking}>
                            {checking ? 'Saving…' : (questionIndex + 1 < totalQuestions ? 'Save & Next' : 'Save & Finish')}
                            <i className="fas fa-arrow-right ms-2"></i>
                          </button>
                        </div>
                      </div>
                    ) : !showFeedback ? (
                      <div className="d-flex justify-content-between mt-4">
                        <button className="btn btn-outline-secondary" onClick={handleSkipQuestion} disabled={loading || checking}>
                          Skip Question
                        </button>
                        <button className="btn btn-primary" onClick={handleCheckAnswer} disabled={!selectedAnswer || loading || checking}>
                          {checking ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Checking...
                            </>
                          ) : 'Check Answer'}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <AnswerFeedback feedback={feedback} />
                        <div className="d-flex justify-content-end mt-3">
                          <button className="btn btn-success btn-lg" onClick={handleNextQuestion} disabled={loading}>
                            {questionIndex + 1 < totalQuestions ? (
                              <>Next Question <i className="fas fa-arrow-right ms-2"></i></>
                            ) : (
                              <>Complete Session <i className="fas fa-check ms-2"></i></>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="tab-content">
                    <StudyNotesViewer
                      key={subjectId}
                      subjectName={subjectName}
                      subjectId={subjectId}
                    />
                  </div>
                )}

                {activeTab === 'past-questions' && (
                  <div className="tab-content">
                    <PastQuestions
                      subjectName={subjectName}
                      subjectId={subjectId}
                      examCategory={examCategory}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {activeTab === 'practice' && !sessionCompleted && (
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card bg-primary text-white shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-white-50">Progress</h6>
                    <h3>{questionIndex + 1}/{isTrial ? 5 : totalQuestions}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-success text-white shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-white-50">Correct</h6>
                    <h3>{session?.correct_answers || 0}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-danger text-white shadow-sm">
                  <div className="card-body text-center">
                    <h6 className="text-white-50">Wrong</h6>
                    <h3>{session?.wrong_answers || 0}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        button:focus,
        button:focus-visible,
        button:active,
        button:focus-within {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }

        button::-moz-focus-inner {
          border: 0;
        }

        button {
          -webkit-tap-highlight-color: transparent;
          -webkit-focus-ring-color: transparent;
        }

        .tab-content {
          animation: fadeSlideIn 0.4s ease-out;
        }

        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card {
          border: none !important;
          outline: none !important;
        }

        .card-body {
          border: none !important;
          outline: none !important;
        }

        .card-header {
          border: none !important;
          outline: none !important;
        }

        .tab-container button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab-container button:active {
          transform: scale(0.98);
        }

        .tab-container button span {
          transition: color 0.3s ease;
        }
      `}</style>
    </div>
  );
};

export default PracticeSession;