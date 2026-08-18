import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import api, { fetchCSRFToken } from '../../api/client';

const TimedQuiz = () => {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const categoryId = searchParams.get('category');

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const textareaRef = useRef(null);

  // ============================================================
  // FUNCTIONS DECLARED BEFORE EFFECTS
  // ============================================================
  const resolveProductAndFetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      let actualProductId = null;
      let productData = null;

      try {
        const productResponse = await api.get(`/api/interview/products/${productId}/`);
        productData = productResponse.data;
        actualProductId = productData.id;
        setProduct(productData);
      } catch {
        console.log('Could not fetch product by slug, trying as numeric ID...');
        if (!isNaN(productId)) {
          actualProductId = parseInt(productId);
        }
      }

      let questionsData = [];

      if (actualProductId) {
        try {
          const response = await api.get(`/api/quiz/product/${actualProductId}/questions/`);
          questionsData = response.data.questions || response.data.results || [];
        } catch {
          console.log('Product questions endpoint failed, trying alternatives...');
        }
      }

      if (questionsData.length === 0 && categoryId) {
        try {
          const response = await api.get(`/api/quiz/categories/${categoryId}/questions/`);
          questionsData = response.data.questions || response.data.results || [];
        } catch {
          console.log('Category questions endpoint failed...');
        }
      }

      if (questionsData.length === 0) {
        try {
          const response = await api.get('/api/quiz/questions/');
          questionsData = response.data.results || response.data || [];
        } catch {
          console.log('All questions endpoint failed...');
        }
      }

      if (questionsData.length === 0) {
        try {
          const response = await api.get('/api/quiz/questions/random/?count=10');
          questionsData = response.data.results || response.data || [];
        } catch {
          console.log('Random questions endpoint failed...');
        }
      }

      if (!Array.isArray(questionsData)) {
        questionsData = [];
      }

      if (questionsData.length > 10) {
        questionsData = questionsData.slice(0, 10);
      }

      if (questionsData.length === 0) {
        setError('No questions available for this quiz. Please try another category.');
        toast.error('No questions available for this quiz');
        setLoading(false);
        return;
      }

      const initialAnswers = {};
      questionsData.forEach(q => {
        initialAnswers[q.id] = '';
      });

      if (!productData) {
        setProduct({ name: productId || 'Quiz', slug: productId });
      }

      setQuestions(questionsData);
      setAnswers(initialAnswers);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error.response?.data?.message || 'Failed to load quiz questions. Please try again.');
      toast.error('Failed to load quiz questions');
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const unansweredCount = questions.filter(q => !answers[q.id]?.trim()).length;
    if (unansweredCount > 0 && !quizCompleted) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirm) {
        if (quizStarted && !quizCompleted) {
          timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
              if (prev <= 1) {
                clearInterval(timerRef.current);
                handleSubmitQuiz();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
        return;
      }
    }

    try {
      setLoading(true);

      await fetchCSRFToken();

      const formattedAnswers = questions.map(q => ({
        question_id: q.id,
        user_answer: answers[q.id] || ''
      }));

      const minutes = Math.floor((600 - timeLeft) / 60);
      const seconds = (600 - timeLeft) % 60;
      const timeTaken = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      const response = await api.post('/api/quiz/submit-timed/', {
        product_id: product?.id || productId,
        answers: formattedAnswers,
        time_taken: timeTaken
      });

      setResults(response.data);
      setQuizCompleted(true);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
      setLoading(false);
    }
  };

  // ============================================================
  // EFFECTS
  // ============================================================
  // Initialize CSRF token on mount
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
    const timeoutId = setTimeout(() => {
      resolveProductAndFetchQuestions();
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

    useEffect(() => {
    if (quizStarted && !quizCompleted && questions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, quizCompleted, questions.length]);

  const handleStartQuiz = () => {
    if (questions.length === 0) {
      toast.error('No questions available to start the quiz');
      return;
    }
    setQuizStarted(true);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 100);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (questions.length === 0) return 0;
    const answered = Object.keys(answers).filter(id => answers[id]?.trim()).length;
    return (answered / questions.length) * 100;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '70vh' }}>
        <div className="alert alert-danger shadow-sm p-4 rounded-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <i className="bi bi-exclamation-triangle-fill display-4 d-block mb-3"></i>
          <h4 className="fw-bold mb-3">Unable to Load Quiz</h4>
          <p className="mb-4">{error}</p>
          <button className="btn btn-primary" onClick={() => navigate(`/interview/${productId}`)}>
            <i className="bi bi-arrow-left me-2"></i>Back to Interview
          </button>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="timed-quiz-start container py-5" style={{ minHeight: '70vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <motion.div className="card border-0 shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <i className="bi bi-clock-history" style={{ fontSize: '4rem', color: '#4400ff' }}></i>
                </div>
                <h1 className="display-5 fw-bold mb-3" style={{ color: '#4400ff' }}>Timed Quiz: {product?.name || 'Practice Quiz'}</h1>
                <p className="lead mb-4">Test your knowledge under timed conditions</p>

                <div className="quiz-info bg-light p-4 rounded-4 mb-4">
                  <div className="row g-3">
                    <div className="col-4"><h5 className="fw-bold">{questions.length}</h5><small className="text-muted">Questions</small></div>
                    <div className="col-4"><h5 className="fw-bold">10:00</h5><small className="text-muted">Time Limit</small></div>
                    <div className="col-4"><h5 className="fw-bold">{questions.length * 10}</h5><small className="text-muted">Max Score</small></div>
                  </div>
                </div>

                <div className="rules-list text-start mb-4">
                  <h6 className="fw-bold mb-3">Quiz Rules:</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Answer all questions within 10 minutes</li>
                    <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Each correct answer earns 10 points</li>
                    <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>Answers are evaluated for similarity (50% match required)</li>
                    <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i>You can navigate between questions</li>
                    {user?.is_admin && (
                      <li className="mb-2"><i className="bi bi-shield-lock-fill text-primary me-2"></i>Admin Mode: Full access to all questions</li>
                    )}
                  </ul>
                </div>

                <button className="btn btn-primary btn-lg px-5 py-3" onClick={handleStartQuiz} disabled={questions.length === 0}>
                  Start Quiz <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted && results) {
    return (
      <div className="quiz-results container py-5" style={{ minHeight: '70vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <motion.div className="card border-0 shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="result-icon mb-3">
                    {results.percent >= 70 ? (
                      <i className="bi bi-trophy-fill" style={{ fontSize: '4rem', color: '#ffc100' }}></i>
                    ) : results.percent >= 50 ? (
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem', color: '#28a745' }}></i>
                    ) : (
                      <i className="bi bi-exclamation-circle-fill" style={{ fontSize: '4rem', color: '#dc3545' }}></i>
                    )}
                  </div>
                  <h2 className="fw-bold mb-2">Quiz Complete!</h2>
                  <p className="text-muted">Time taken: {results.time_taken}</p>
                </div>

                <div className="score-circle text-center mb-4">
                  <div className="position-relative d-inline-block">
                    <div className="progress-circle" style={{
                      width: '150px', height: '150px', borderRadius: '50%',
                      background: `conic-gradient(#4400ff ${results.percent * 3.6}deg, #e9ecef 0deg)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <div style={{
                        width: '120px', height: '120px', borderRadius: '50%', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'
                      }}>
                        <span className="h2 fw-bold mb-0">{Math.round(results.percent)}%</span>
                        <small>Score</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stats-grid row g-3 mb-4">
                  <div className="col-4"><div className="stat-card bg-success bg-opacity-10 p-3 rounded-3 text-center"><h5 className="fw-bold text-success">{results.correct || 0}</h5><small>Correct</small></div></div>
                  <div className="col-4"><div className="stat-card bg-danger bg-opacity-10 p-3 rounded-3 text-center"><h5 className="fw-bold text-danger">{results.wrong || 0}</h5><small>Wrong</small></div></div>
                  <div className="col-4"><div className="stat-card bg-primary bg-opacity-10 p-3 rounded-3 text-center"><h5 className="fw-bold text-primary">{results.score || 0}</h5><small>Points</small></div></div>
                </div>

                <div className="actions d-flex gap-3 justify-content-center">
                  <button className="btn btn-outline-primary" onClick={() => navigate(`/interview/${product?.slug || productId}`)}>
                    <i className="bi bi-arrow-left me-2"></i>Back to Interview
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    setQuizStarted(false); setQuizCompleted(false); setAnswers({}); setTimeLeft(600);
                    setCurrentQuestionIndex(0); setResults(null); resolveProductAndFetchQuestions();
                  }}>
                    Try Again <i className="bi bi-arrow-repeat ms-2"></i>
                  </button>
                </div>

                {results.answers && results.answers.length > 0 && (
                  <div className="detailed-answers mt-5">
                    <h5 className="fw-bold mb-4">Detailed Review</h5>
                    {results.answers.map((answer, index) => (
                      <motion.div key={index} className="answer-card card mb-3 border-0 shadow-sm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <div className="card-body">
                          <div className="d-flex align-items-start">
                            <div className={`answer-icon me-3 ${answer.is_correct ? 'text-success' : 'text-danger'}`}>
                              <i className={`bi bi-${answer.is_correct ? 'check-circle-fill' : 'x-circle-fill'} fs-4`}></i>
                            </div>
                            <div className="flex-grow-1">
                              <h6 className="fw-bold mb-2">Question {index + 1}: {answer.question}</h6>
                              <p className="mb-2"><small className="text-muted">Your answer:</small> {answer.user_answer || 'No answer provided'}</p>
                              {!answer.is_correct && <p className="mb-0"><small className="text-muted">Correct answer:</small> {answer.correct_answer}</p>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (!questions.length || currentQuestionIndex >= questions.length) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="timed-quiz container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="quiz-header bg-white rounded-4 shadow-sm p-3 mb-4">
            <div className="row align-items-center">
              <div className="col-md-4">
                <h5 className="fw-bold mb-0" style={{ color: '#4400ff' }}>{product?.name || 'Quiz'} Quiz</h5>
                {user?.is_admin && <span className="badge bg-primary mt-1">Admin Mode</span>}
              </div>
              <div className="col-md-4 text-center">
                <div className="timer-display">
                  <div className={`badge ${timeLeft < 60 ? 'bg-danger' : 'bg-primary'} p-3`} style={{ fontSize: '1.2rem' }}>
                    <i className="bi bi-clock me-2"></i>{formatTime(timeLeft)}
                  </div>
                </div>
              </div>
              <div className="col-md-4 text-end">
                <span className="text-muted">Question {currentQuestionIndex + 1}/{questions.length}</span>
              </div>
            </div>
            <div className="progress mt-3" style={{ height: '8px' }}>
              <div className="progress-bar bg-warning" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }} className="card border-0 shadow-lg mb-4">
              <div className="card-body p-4">
                <div className="question-header mb-4">
                  <span className="badge bg-warning text-dark mb-2">Question {currentQuestionIndex + 1}</span>
                  <h4 className="fw-bold">{currentQuestion.question}</h4>
                </div>
                <div className="answer-area">
                  <label className="form-label fw-bold">Your Answer:</label>
                  <textarea ref={textareaRef} className="form-control form-control-lg" rows="6" placeholder="Type your answer here..." value={answers[currentQuestion.id] || ''} onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}></textarea>
                  <small className="text-muted"><i className="bi bi-info-circle me-1"></i>Your answer will be evaluated for similarity with the correct answer (50% match required)</small>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="navigation-buttons d-flex justify-content-between">
            <button className="btn btn-outline-secondary" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
              <i className="bi bi-arrow-left me-2"></i>Previous
            </button>
            <div>
              {currentQuestionIndex === questions.length - 1 ? (
                <button className="btn btn-success" onClick={handleSubmitQuiz}>Submit Quiz <i className="bi bi-check-circle ms-2"></i></button>
              ) : (
                <button className="btn btn-primary" onClick={handleNextQuestion}>Next <i className="bi bi-arrow-right ms-2"></i></button>
              )}
            </div>
          </div>

          <div className="question-navigator bg-white rounded-4 shadow-sm p-3 mt-4">
            <h6 className="fw-bold mb-3">Quick Navigation</h6>
            <div className="d-flex flex-wrap gap-2">
              {questions.map((q, index) => (
                <button key={q.id} className={`btn btn-sm ${index === currentQuestionIndex ? 'btn-primary' : answers[q.id]?.trim() ? 'btn-outline-success' : 'btn-outline-secondary'}`} onClick={() => setCurrentQuestionIndex(index)}>
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          *:focus, *:focus-visible, *:active,
          button:focus, button:focus-visible,
          a:focus, a:focus-visible,
          input:focus, input:focus-visible,
          textarea:focus, textarea:focus-visible,
          select:focus, select:focus-visible,
          .btn:focus, .btn:active, .btn:focus-visible {
            outline: none !important;
            box-shadow: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }

          .form-control:focus, .form-control-lg:focus {
            outline: none !important;
            box-shadow: none !important;
            border-color: #4400ff !important;
          }

          .progress-circle { transition: all 0.3s ease; }
          .answer-card { transition: transform 0.2s ease; }
          .answer-card:hover { transform: translateX(5px); }

          @media (max-width: 768px) {
            .timer-display .badge { font-size: 1rem !important; padding: 0.5rem !important; }
          }
        `}
      </style>
    </div>
  );
};

export default TimedQuiz;