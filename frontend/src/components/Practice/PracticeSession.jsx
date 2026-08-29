import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import QuestionDisplay from './QuestionDisplay';
import AnswerFeedback from './AnswerFeedback';
import ProgressBar from './ProgressBar';
import SessionSummary from './SessionSummary';
import api, { fetchCSRFToken } from '../../api/client';

// ============================================================
// STUDY NOTES COMPONENT
// ============================================================
const StudyNotes = ({ subjectName, subjectId }) => {
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (subjectId && subjectId !== 'null' && subjectId !== 'undefined') {
      fetchStudyNotes();
    } else {
      setLoading(false);
      setError('Subject ID not available');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const fetchStudyNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/exams/study-notes/${subjectId}/`);
      setNotes(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching study notes:', err);
      setError('Failed to load study notes');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading study notes for {subjectName || 'this subject'}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
        <h5>Study Notes Unavailable</h5>
        <p className="text-muted">
          {subjectId && subjectId !== 'null' && subjectId !== 'undefined'
            ? `Study notes for ${subjectName || 'this subject'} are not yet available.`
            : 'Please access this section from a valid subject page.'}
        </p>
        {subjectId && subjectId !== 'null' && subjectId !== 'undefined' && (
          <button className="btn btn-outline-success btn-sm mt-2" onClick={fetchStudyNotes}>
            <i className="fas fa-redo me-1"></i> Retry
          </button>
        )}
      </div>
    );
  }

  if (!notes || (!notes.topics && !notes.content)) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-book-open fa-3x text-muted mb-3"></i>
        <h5>No Study Notes Available</h5>
        <p className="text-muted">Study notes for {subjectName || 'this subject'} are not yet available.</p>
      </div>
    );
  }

  return (
    <div className="study-notes-container">
      <div className="d-flex align-items-center mb-4">
        <div className="icon-circle bg-success-light me-3" style={{
          width: '50px',
          height: '50px',
          borderRadius: '12px',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <i className="fas fa-book-open fa-lg text-success"></i>
        </div>
        <div>
          <h4 className="mb-0 fw-bold">{subjectName || 'Subject'} - Study Notes</h4>
          <p className="text-muted mb-0">Comprehensive study materials</p>
        </div>
      </div>

      {notes.topics && notes.topics.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3 fw-bold">
            <i className="fas fa-list-ul me-2 text-success"></i>
            Topics Covered
          </h5>
          <div className="row">
            {notes.topics.map((topic, index) => (
              <div key={index} className="col-md-6 mb-3">
                <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '3px solid #059669' }}>
                  <div className="card-body">
                    <h6 className="card-title fw-bold">
                      <i className="fas fa-check-circle text-success me-2"></i>
                      {topic.title || topic.name}
                    </h6>
                    {topic.description && (
                      <p className="card-text text-muted small">{topic.description}</p>
                    )}
                    {topic.key_points && topic.key_points.length > 0 && (
                      <ul className="list-unstyled mb-0">
                        {topic.key_points.map((point, idx) => (
                          <li key={idx} className="small mb-1">
                            <i className="fas fa-circle text-success me-1" style={{ fontSize: '6px' }}></i>
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notes.formulas && notes.formulas.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3 fw-bold">
            <i className="fas fa-superscript me-2 text-success"></i>
            Important Formulas
          </h5>
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-success text-white">
                    <tr>
                      <th className="py-3">Formula</th>
                      <th className="py-3">Description</th>
                      <th className="py-3">Application</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.formulas.map((formula, index) => (
                      <tr key={index}>
                        <td><code className="bg-light p-1 rounded">{formula.formula || formula.name}</code></td>
                        <td>{formula.description}</td>
                        <td className="text-muted small">{formula.application || 'General use'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {notes.content && (
        <div className="mb-4">
          <h5 className="mb-3 fw-bold">
            <i className="fas fa-file-alt me-2 text-success"></i>
            Study Material
          </h5>
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="study-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {notes.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {notes.references && notes.references.length > 0 && (
        <div className="mb-4">
          <h5 className="mb-3 fw-bold">
            <i className="fas fa-book me-2 text-success"></i>
            Recommended References
          </h5>
          <div className="list-group">
            {notes.references.map((ref, index) => (
              <div key={index} className="list-group-item border-0 shadow-sm mb-2 rounded-3">
                <i className="fas fa-external-link-alt me-2 text-muted"></i>
                <strong>{ref.title || ref.name}</strong>
                {ref.author && <span className="text-muted"> by {ref.author}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PAST QUESTIONS COMPONENT
// ============================================================
const PastQuestions = ({ subjectName, subjectId, examCategory }) => {
  const [pastQuestions, setPastQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [feedbackByQuestion, setFeedbackByQuestion] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  useEffect(() => {
    if (subjectId && subjectId !== 'null' && subjectId !== 'undefined') {
      fetchPastQuestions();
    } else {
      setLoading(false);
      setError('Subject ID not available');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const fetchPastQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/exams/past-questions/${subjectId}/`, {
        params: { exam_category: examCategory || '' }
      });
      setPastQuestions(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching past questions:', err);
      setError('Failed to load past questions');
      setLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, letter) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: letter }));
  };

  const handleCheckAnswer = (question) => {
    const chosen = selectedAnswers[question.id];
    if (!chosen) return;

    const isCorrect = question.correct_answer?.toUpperCase() === chosen.toUpperCase();
    setFeedbackByQuestion(prev => ({
      ...prev,
      [question.id]: {
        is_correct: isCorrect,
        correct_answer: question.correct_answer,
        explanation: question.explanation,
        question_id: question.id
      }
    }));
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const getFilteredQuestions = () => {
    if (!pastQuestions?.questions) return [];

    if (selectedYear === 'all') {
      return pastQuestions.questions;
    }
    return pastQuestions.questions.filter(q =>
      q.exam_year === parseInt(selectedYear) || q.year === parseInt(selectedYear)
    );
  };

  const getAvailableYears = () => {
    if (!pastQuestions?.questions) return [];
    const years = new Set();
    pastQuestions.questions.forEach(q => {
      const year = q.exam_year || q.year;
      if (year) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  const getPaginatedQuestions = () => {
    const filtered = getFilteredQuestions();
    const startIndex = (currentPage - 1) * questionsPerPage;
    return filtered.slice(startIndex, startIndex + questionsPerPage);
  };

  const getTotalPages = () => {
    return Math.ceil(getFilteredQuestions().length / questionsPerPage);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-purple" role="status" style={{ color: '#6f42c1' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted">Loading past questions for {subjectName || 'this subject'}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-history fa-3x text-muted mb-3"></i>
        <h5>Past Questions Unavailable</h5>
        <p className="text-muted">
          {subjectId && subjectId !== 'null' && subjectId !== 'undefined'
            ? `Past questions for ${subjectName || 'this subject'} are not yet available.`
            : 'Please access this section from a valid subject page.'}
        </p>
        {subjectId && subjectId !== 'null' && subjectId !== 'undefined' && (
          <button className="btn btn-outline-purple btn-sm mt-2"
            style={{ color: '#6f42c1', borderColor: '#6f42c1' }}
            onClick={fetchPastQuestions}>
            <i className="fas fa-redo me-1"></i> Retry
          </button>
        )}
      </div>
    );
  }

  if (!pastQuestions?.questions || pastQuestions.questions.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-history fa-3x text-muted mb-3"></i>
        <h5>No Past Questions Available</h5>
        <p className="text-muted">Past questions for {subjectName || 'this subject'} are not yet available.</p>
      </div>
    );
  }

  const filteredQuestions = getPaginatedQuestions();
  const totalPages = getTotalPages();
  const availableYears = getAvailableYears();

  return (
    <div className="past-questions-container">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h5 className="mb-0" style={{ color: '#4b2e83' }}>
          <i className="fas fa-history me-2"></i>
          {getFilteredQuestions().length} Past Question{getFilteredQuestions().length !== 1 ? 's' : ''}
          {subjectName ? ` — ${subjectName}` : ''}
        </h5>

        {availableYears.length > 0 && (
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto', borderColor: '#6f42c1' }}
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}
      </div>

      {filteredQuestions.map((question, idx) => {
        const chosen = selectedAnswers[question.id];
        const fb = feedbackByQuestion[question.id];
        const options = [
          ['A', question.option_a],
          ['B', question.option_b],
          ['C', question.option_c],
          ['D', question.option_d],
          ['E', question.option_e],
        ].filter(([, text]) => text);

        return (
          <div key={question.id} className="card border-0 shadow-sm mb-3 rounded-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="badge rounded-pill" style={{ backgroundColor: '#ede9fe', color: '#6f42c1' }}>
                  Question {(currentPage - 1) * questionsPerPage + idx + 1}
                </span>
                {(question.exam_year || question.year) && (
                  <span className="text-muted small">{question.exam_year || question.year}</span>
                )}
              </div>

              <p className="fw-semibold mb-3">{question.question_text}</p>

              <div className="d-flex flex-column gap-2 mb-3">
                {options.map(([letter, text]) => {
                  const isSelected = chosen === letter;
                  const isRevealedCorrect = fb && letter === fb.correct_answer;
                  const isRevealedWrong = fb && isSelected && !fb.is_correct;

                  let btnClass = 'btn text-start ';
                  if (isRevealedCorrect) btnClass += 'btn-success';
                  else if (isRevealedWrong) btnClass += 'btn-outline-danger';
                  else if (isSelected) btnClass += 'btn-outline-purple';
                  else btnClass += 'btn-outline-secondary';

                  return (
                    <button
                      key={letter}
                      type="button"
                      className={btnClass}
                      style={isSelected && !fb ? { borderColor: '#6f42c1', color: '#6f42c1' } : {}}
                      disabled={!!fb}
                      onClick={() => handleSelectAnswer(question.id, letter)}
                    >
                      <strong>{letter}.</strong> {text}
                    </button>
                  );
                })}
              </div>

              {!fb ? (
                <button
                  className="btn btn-sm"
                  style={{ backgroundColor: '#6f42c1', color: '#fff' }}
                  disabled={!chosen}
                  onClick={() => handleCheckAnswer(question)}
                >
                  Check Answer
                </button>
              ) : (
                <div className={`alert ${fb.is_correct ? 'alert-success' : 'alert-danger'} mb-0`}>
                  <strong>{fb.is_correct ? 'Correct!' : 'Not quite.'}</strong>
                  {!fb.is_correct && <> The correct answer is <strong>{fb.correct_answer}</strong>.</>}
                  {question.explanation && (
                    <p className="mb-0 mt-2 small">{question.explanation}</p>
                  )}
                </div>
              )}

              {question.reference && (
                <p className="text-muted small mt-2 mb-0">Source: {question.reference}</p>
              )}
            </div>
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-3 mt-3">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span className="text-muted small">Page {currentPage} of {totalPages}</span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
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

  // ============================================================
  // FUNCTIONS DECLARED BEFORE EFFECTS
  // ============================================================
  const fetchSessionData = async () => {
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
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading session:', err.response || err);

      if (err.response?.status === 400 && err.response?.data?.error === 'Session already completed') {
        fetchSessionSummary();
      } else {
        setError(err.response?.data?.error || 'Error loading session');
        setLoading(false);
      }
    }
  };

  const fetchSessionSummary = async () => {
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
          upgrade_url: `/api/payments/create-payment/${bankId}/`
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

  useEffect(() => {
    if (activeTab === 'practice') {
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
      <SessionSummary
        summary={sessionSummary}
        onReview={handleReviewWrongAnswers}
        onNewPractice={() => navigate('/dashboard')}
        isTrial={isTrial}
      />
    );
  }

  if (error && activeTab === 'practice') {
    return (
      <div className="container mt-5" style={{ minHeight: '70vh' }}>
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={() => { setError(null); fetchSessionData(); }}>
            <i className="fas fa-redo me-2"></i> Try Again
          </button>
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
              {subjectName || 'Practice Session'}
            </h3>
          </div>

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

                    {!showFeedback ? (
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
                    <StudyNotes
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