import api from '../../api/client';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

// ============================================================
// CREATE PROPERLY CONFIGURED AXIOS INSTANCE
// ============================================================
const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
});

const getCSRFTokenFromCookie = () => {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
};

const fetchCSRFToken = async () => {
  try {
    const response = await api.get('/api/exams/csrf/');
    if (response.data.csrfToken) {
      return response.data.csrfToken;
    }
  } catch (error) {
    console.log('Could not fetch CSRF token, will try existing cookie');
  }
  return getCSRFTokenFromCookie();
};

api.interceptors.request.use(
  async config => {
    if (config.method !== 'get') {
      let csrfToken = getCSRFTokenFromCookie();
      if (!csrfToken) {
        csrfToken = await fetchCSRFToken();
      }
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

const UntimedQuiz = () => {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const categoryId = searchParams.get('category');
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [error, setError] = useState(null);

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
    initializeQuiz();
  }, [productId]);

  const initializeQuiz = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let productData = null;
      try {
        const productResponse = await api.get(`/api/interview/products/${productId}/`);
        productData = productResponse.data;
        setProduct(productData);
      } catch (err) {
        console.log('Could not fetch product by slug, setting default');
      }
      
      if (!productData) {
        setProduct({ name: productId || 'Practice Quiz', slug: productId });
      }
      
      let categoriesData = [];
      try {
        const response = await api.get('/api/untimed-quiz/categories/');
        categoriesData = response.data.results || response.data || [];
      } catch (err) {
        console.log('Could not fetch untimed categories');
      }
      
      setCategories(categoriesData);
      
      if (categoryId && categoriesData.length > 0) {
        const matchedCategory = categoriesData.find(c => c.id === parseInt(categoryId));
        if (matchedCategory) {
          await loadCategoryQuestions(matchedCategory);
          return;
        }
      }
      
      if (categoriesData.length === 1) {
        await loadCategoryQuestions(categoriesData[0]);
        return;
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load quiz. Please try again.');
      setLoading(false);
    }
  };

  const loadCategoryQuestions = async (category) => {
    try {
      setLoading(true);
      
      const response = await api.get(`/api/untimed-quiz/category/${category.id}/questions/`);
      
      const responseData = response.data.results || response.data;
      setSelectedCategory(responseData.category || category);
      
      const questionsData = responseData.questions || [];
      
      if (questionsData.length === 0) {
        setError('No questions available for this category. Please add questions in the admin panel.');
        toast.error('No questions available');
        setLoading(false);
        return;
      }
      
      setQuestions(questionsData);
      
      const initialAnswers = {};
      questionsData.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
      
      setCurrentQuestionIndex(0);
      setQuizStarted(true);
      setLoading(false);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load questions');
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    loadCategoryQuestions(category);
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
      setShowHint(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowHint(false);
    }
  };

  const handleSubmitQuiz = async () => {
    const unansweredCount = questions.filter(q => !answers[q.id]?.trim()).length;
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirm) return;
    }

    try {
      setLoading(true);
      await fetchCSRFToken();
      
      const formattedAnswers = questions.map(q => ({
        question_id: q.id,
        user_answer: answers[q.id] || ''
      }));

      const response = await api.post('/api/untimed-quiz/submit/', {
        category_id: selectedCategory?.id,
        answers: formattedAnswers
      });

      setResults(response.data);
      setQuizCompleted(true);
      setLoading(false);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
      setLoading(false);
    }
  };

  const handleTryAnother = () => {
    setSelectedCategory(null);
    setQuestions([]);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setQuizStarted(false);
    setQuizCompleted(false);
    setResults(null);
    setShowHint(false);
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
      <div className="untimed-quiz container py-5" style={{ minHeight: '70vh' }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <motion.div className="card border-0 shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card-body p-5 text-center">
                <div className="mb-4">
                  <i className="bi bi-hourglass-split" style={{ fontSize: '4rem', color: '#4400ff' }}></i>
                </div>
                <h1 className="display-5 fw-bold mb-3" style={{ color: '#4400ff' }}>Practice Quiz: {product?.name || 'Practice'}</h1>
                <p className="lead mb-4">Choose a category to start practicing at your own pace</p>
                <div className="categories-list">
                  <h6 className="fw-bold mb-3">Select a Category:</h6>
                  {categories.length === 0 ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-circle me-2"></i>No categories available.
                    </div>
                  ) : (
                    <div className="row g-3">
                      {categories.map((category, index) => (
                        <motion.div key={category.id} className="col-md-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                          <button className="btn btn-outline-primary w-100 p-3" onClick={() => handleCategorySelect(category)}>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold">{category.name}</span>
                              <span className="badge bg-primary">{category.question_count} Qs</span>
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
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
            <motion.div className="card border-0 shadow-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div className="result-icon mb-3">
                    {results.percent >= 70 ? (
                      <i className="bi bi-trophy-fill" style={{ fontSize: '4rem', color: '#ffc100' }}></i>
                    ) : results.percent >= 50 ? (
                      <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem', color: '#28a745' }}></i>
                    ) : (
                      <i className="bi bi-emoji-frown-fill" style={{ fontSize: '4rem', color: '#dc3545' }}></i>
                    )}
                  </div>
                  <h2 className="fw-bold mb-2">Practice Complete!</h2>
                  <p className="text-muted">{selectedCategory?.name} Category</p>
                </div>
                <div className="stats-grid row g-3 mb-4">
                  <div className="col-4"><div className="stat-card bg-primary bg-opacity-10 p-3 rounded-3 text-center"><h5 className="fw-bold text-primary">{results.total}</h5><small>Total</small></div></div>
                  <div className="col-4"><div className="stat-card bg-success bg-opacity-10 p-3 rounded-3 text-center"><h5 className="fw-bold text-success">{results.correct}</h5><small>Correct</small></div></div>
                  <div className="col-4"><div className="stat-card bg-danger bg-opacity-10 p-3 rounded-3 text-center"><h5 className="fw-bold text-danger">{results.wrong}</h5><small>Wrong</small></div></div>
                </div>
                <div className="progress mb-4" style={{ height: '10px' }}>
                  <div className="progress-bar bg-success" style={{ width: `${results.percent}%` }}></div>
                </div>
                <div className="actions d-flex gap-3 justify-content-center">
                  <button className="btn btn-outline-primary" onClick={handleTryAnother}><i className="bi bi-arrow-repeat me-2"></i>Try Another Category</button>
                  <button className="btn btn-primary" onClick={() => navigate(`/interview/${productId}`)}><i className="bi bi-arrow-left me-2"></i>Back to Interview</button>
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
                              <div className="d-flex justify-content-between mb-2">
                                <h6 className="fw-bold">Question {index + 1}</h6>
                                {answer.similarity && <span className="badge bg-info">Match: {answer.similarity}%</span>}
                              </div>
                              <p className="mb-2">{answer.question}</p>
                              <p className="mb-2"><small className="text-muted">Your answer:</small> {answer.user_answer}</p>
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
    <div className="untimed-quiz container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="quiz-header bg-white rounded-4 shadow-sm p-3 mb-4">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h5 className="fw-bold mb-0" style={{ color: '#4400ff' }}>{selectedCategory?.name} - Practice Quiz</h5>
              </div>
              <div className="col-md-6 text-end">
                <span className="text-muted">Question {currentQuestionIndex + 1} of {questions.length}</span>
              </div>
            </div>
            <div className="progress mt-3" style={{ height: '8px' }}>
              <div className="progress-bar bg-warning" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
          </div>

          <motion.div key={currentQuestionIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="card border-0 shadow-lg mb-4">
            <div className="card-body p-4">
              <div className="question-header mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge bg-warning text-dark">Question {currentQuestionIndex + 1}</span>
                  {currentQuestion.hint && (
                    <button className="btn btn-sm btn-outline-info" onClick={() => setShowHint(!showHint)}>
                      <i className="bi bi-lightbulb me-1"></i>{showHint ? 'Hide Hint' : 'Show Hint'}
                    </button>
                  )}
                </div>
                {showHint && currentQuestion.hint && (
                  <div className="alert alert-info mb-4"><i className="bi bi-lightbulb-fill me-2"></i>{currentQuestion.hint}</div>
                )}
                <h4 className="fw-bold">{currentQuestion.text}</h4>
              </div>
              <div className="answer-area">
                <label className="form-label fw-bold">Your Answer:</label>
                <textarea className="form-control form-control-lg" rows="6" placeholder="Type your answer here..." value={answers[currentQuestion.id] || ''} onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}></textarea>
                <small className="text-muted"><i className="bi bi-info-circle me-1"></i>Your answer will be evaluated for similarity (50% match required)</small>
              </div>
            </div>
          </motion.div>

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

          <div className="progress-summary bg-white rounded-4 shadow-sm p-3 mt-4">
            <div className="row text-center">
              <div className="col-4"><h6 className="fw-bold mb-0">{Object.keys(answers).filter(id => answers[id]?.trim()).length}</h6><small className="text-muted">Answered</small></div>
              <div className="col-4"><h6 className="fw-bold mb-0">{questions.length - Object.keys(answers).filter(id => answers[id]?.trim()).length}</h6><small className="text-muted">Remaining</small></div>
              <div className="col-4"><h6 className="fw-bold mb-0">{questions.length}</h6><small className="text-muted">Total</small></div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          /* ===== REMOVE ALL OUTLINES ===== */
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

          .answer-card {
            transition: transform 0.2s ease;
          }
          .answer-card:hover {
            transform: translateX(5px);
          }
        `}
      </style>
    </div>
  );
};

export default UntimedQuiz;