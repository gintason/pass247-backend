import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const InterviewDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [quizCategories, setQuizCategories] = useState([]);
  const [selectedQuizCategory, setSelectedQuizCategory] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizType, setQuizType] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductDetails();
    fetchQuizCategories();
    if (user) {
      fetchBookmarks();
    }
    window.scrollTo(0, 0);
  }, [slug, user]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let productResponse;
      
      try {
        productResponse = await api.get(`/api/interview/products/${slug}/`);
      } catch (err) {
        if (!isNaN(slug)) {
          const allProductsResponse = await api.get('/api/interview/products/');
          const products = allProductsResponse.data.results || allProductsResponse.data || [];
          const foundProduct = products.find(p => p.id === parseInt(slug));
          
          if (foundProduct) {
            navigate(`/interview/${foundProduct.slug}`, { replace: true });
            return;
          }
        }
        throw err;
      }
      
      setProduct(productResponse.data);
      
      const interviewsResponse = await api.get(`/api/interview/products/${productResponse.data.slug}/interviews/`);
      const interviewsData = interviewsResponse.data.results || interviewsResponse.data || [];
      setInterviews(interviewsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to load interview questions. The product may not exist.');
      toast.error('Failed to load interview questions');
      setLoading(false);
    }
  };

  const fetchQuizCategories = async () => {
    try {
      const response = await api.get('/api/quiz/categories/');
      const categories = response.data.results || response.data || [];
      setQuizCategories(categories);
    } catch (error) {
      console.error('Error fetching quiz categories:', error);
      setQuizCategories([]);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await api.get('/api/interview/bookmarks/');
      let bookmarksData = [];
      if (Array.isArray(response.data)) {
        bookmarksData = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        bookmarksData = response.data.results;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        bookmarksData = response.data.data;
      }
      
      const bookmarkedIds = new Set(bookmarksData.map(item => item.id || item.interview?.id));
      setBookmarks(bookmarkedIds);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarks(new Set());
    }
  };

  const handleBookmark = async (interviewId) => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/interview/${slug}`));
      return;
    }

    try {
      await api.post(`/api/interview/interviews/${interviewId}/bookmark/`);
      
      setBookmarks(prev => {
        const newSet = new Set(prev);
        if (newSet.has(interviewId)) {
          newSet.delete(interviewId);
          toast.info('Removed from bookmarks');
        } else {
          newSet.add(interviewId);
          toast.success('Added to bookmarks');
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  };

  const handleQuizSelection = (type) => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/interview/${slug}`));
      return;
    }

    setQuizType(type);
    
    if (quizCategories.length > 1) {
      setShowQuizModal(true);
    } else if (quizCategories.length === 1) {
      startQuiz(quizCategories[0].id, type);
    } else {
      startQuiz(null, type);
    }
  };

  const startQuiz = (categoryId, type) => {
    if (!product) {
      toast.error('Product not loaded. Please try again.');
      return;
    }
    
    if (type === 'timed') {
      navigate(`/quiz/timed/${product.slug}${categoryId ? `?category=${categoryId}` : ''}`);
    } else {
      navigate(`/quiz/untimed/${product.slug}${categoryId ? `?category=${categoryId}` : ''}`);
    }
    setShowQuizModal(false);
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesDifficulty = selectedDifficulty === 'all' || interview.difficulty === selectedDifficulty;
    const matchesSearch = interview.question?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return matchesDifficulty && matchesSearch;
  });

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      'BEGINNER': { bg: '#d4edda', text: '#155724', label: 'Beginner' },
      'INTERMEDIATE': { bg: '#fff3cd', text: '#856404', label: 'Intermediate' },
      'ADVANCED': { bg: '#f8d7da', text: '#721c24', label: 'Advanced' },
      'EXPERT': { bg: '#343a40', text: '#fff', label: 'Expert' }
    };
    return colors[difficulty?.toUpperCase()] || colors['INTERMEDIATE'];
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '70vh' }}>
        <div className="alert alert-danger shadow-sm p-4 rounded-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <i className="bi bi-exclamation-triangle-fill display-4 d-block mb-3"></i>
          <h4 className="fw-bold mb-3">Unable to Load Interview</h4>
          <p className="mb-4">{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/interview-levels')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '70vh' }}>
        <div className="alert alert-warning shadow-sm p-4 rounded-4" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <i className="bi bi-info-circle-fill display-4 d-block mb-3"></i>
          <h4 className="fw-bold mb-3">Interview Not Found</h4>
          <p className="mb-4">The interview you're looking for doesn't exist or has been removed.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/interview-levels')}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Browse Interviews
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-detail-page">
      {/* Hero Section */}
      <section className="hero-section" style={{ 
        background: 'linear-gradient(135deg, #4400ff 0%, #7209b7 50%, #ffcc00 100%)',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '6rem',
        paddingBottom: '5rem'
      }}>
        <div className="container py-4">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="display-4 fw-bold mb-3">{product.name}</h1>
                <p className="lead mb-4">{product.description}</p>
                <div className="d-flex justify-content-center gap-3 flex-wrap">
                  <span className="badge bg-white text-dark px-3 py-2 rounded-pill">
                    <i className="bi bi-question-circle me-2" style={{ color: '#4400ff' }}></i>
                    {product.interview_count || interviews.length} Questions
                  </span>
                  <span className="badge bg-white text-dark px-3 py-2 rounded-pill">
                    <i className="bi bi-clock-history me-2" style={{ color: '#ffcc00' }}></i>
                    Updated Regularly
                  </span>
                  <span className="badge bg-white text-dark px-3 py-2 rounded-pill">
                    <i className="bi bi-star-fill me-2" style={{ color: '#ffcc00' }}></i>
                    {interviews.filter(i => i.difficulty === 'BEGINNER').length} Beginner Friendly
                  </span>
                </div>
                {user?.is_admin && (
                  <div className="mt-4">
                    <span className="badge bg-primary px-4 py-2 fs-6" style={{ position: 'relative', zIndex: 20 }}>
                      <i className="bi bi-shield-lock-fill me-2"></i>
                      Admin Mode: Full Access
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
        <svg className="position-absolute bottom-0 start-0 w-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ zIndex: 1 }}>
          <path fill="#ffffff" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,170.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </section>

      {/* Quiz Links */}
      <section className="quiz-links py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-6">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="card border-0 shadow-lg h-100" style={{ background: 'linear-gradient(145deg, #4400ff, #6a4cff)' }}>
                  <div className="card-body p-4 text-white">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-box bg-white bg-opacity-25 rounded-3 p-3 me-3">
                        <i className="bi bi-clock-history fs-1"></i>
                      </div>
                      <div>
                        <h4 className="fw-bold mb-1">Timed Quiz</h4>
                        <p className="mb-0 opacity-75">Test your knowledge under pressure</p>
                      </div>
                    </div>
                    <ul className="list-unstyled mb-4">
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2"></i> 10 minutes time limit</li>
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2"></i> 10 points per question</li>
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2"></i> Instant scoring</li>
                    </ul>
                    <button 
                      className="btn btn-warning w-100 py-3 fw-bold"
                      onClick={() => handleQuizSelection('timed')}
                    >
                      Start Timed Quiz <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="col-md-6">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="card border-0 shadow-lg h-100" style={{ background: 'linear-gradient(145deg, #ffcc00, #ffd700)' }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-box bg-white bg-opacity-25 rounded-3 p-3 me-3">
                        <i className="bi bi-hourglass-split fs-1" style={{ color: '#4400ff' }}></i>
                      </div>
                      <div>
                        <h4 className="fw-bold mb-1" style={{ color: '#4400ff' }}>Untimed Quiz</h4>
                        <p className="mb-0 text-muted">Learn at your own pace</p>
                      </div>
                    </div>
                    <ul className="list-unstyled mb-4">
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: '#4400ff' }}></i> No time limit</li>
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: '#4400ff' }}></i> Hints available</li>
                      <li className="mb-2"><i className="bi bi-check-circle-fill me-2" style={{ color: '#4400ff' }}></i> Detailed explanations</li>
                    </ul>
                    <button 
                      className="btn btn-primary w-100 py-3 fw-bold"
                      onClick={() => handleQuizSelection('untimed')}
                    >
                      Practice Untimed Quiz <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Category Modal */}
      <AnimatePresence>
        {showQuizModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1050,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowQuizModal(false)}
          >
            <motion.div
              className="modal-content bg-white rounded-4 shadow-lg"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{ maxWidth: '500px', width: '90%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header border-0 p-4">
                <h5 className="modal-title fw-bold">Select Quiz Category</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowQuizModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4 pt-0">
                <p className="text-muted mb-4">Choose a category for your {quizType === 'timed' ? 'timed' : 'practice'} quiz:</p>
                <div className="d-flex flex-column gap-3">
                  {quizCategories.map(category => (
                    <button
                      key={category.id}
                      className="btn btn-outline-primary p-3 text-start d-flex justify-content-between align-items-center"
                      onClick={() => startQuiz(category.id, quizType)}
                    >
                      <span className="fw-bold">{category.category_name}</span>
                      <span className="badge bg-primary">{category.question_count || '10'} questions</span>
                    </button>
                  ))}
                  <button
                    className="btn btn-link text-decoration-none"
                    onClick={() => startQuiz(null, quizType)}
                  >
                    Skip (Use all categories)
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <section className="filters-section py-4 bg-light">
        <div className="container">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6">
              <select 
                className="form-select"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                <option value="all">All Difficulties</option>
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
                <option value="EXPERT">Expert</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Summary */}
      <section className="stats-summary py-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <p className="text-muted mb-0">
              Showing <span className="fw-bold text-primary">{filteredInterviews.length}</span> of <span className="fw-bold">{interviews.length}</span> questions
            </p>
            <div className="difficulty-stats d-flex gap-3">
              <span><span className="badge bg-success me-1">&nbsp;</span> Beginner: {interviews.filter(i => i.difficulty === 'BEGINNER').length}</span>
              <span><span className="badge bg-warning me-1">&nbsp;</span> Intermediate: {interviews.filter(i => i.difficulty === 'INTERMEDIATE').length}</span>
              <span><span className="badge bg-danger me-1">&nbsp;</span> Advanced: {interviews.filter(i => i.difficulty === 'ADVANCED').length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Accordion */}
      <section className="questions-section py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {filteredInterviews.length === 0 ? (
                <motion.div 
                  className="text-center py-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <i className="bi bi-search fs-1 text-muted mb-3"></i>
                  <h5>No questions found</h5>
                  <p className="text-muted">Try adjusting your search or filter</p>
                </motion.div>
              ) : (
                <div className="accordion-custom">
                  {filteredInterviews.map((interview, index) => {
                    const difficultyStyle = getDifficultyBadge(interview.difficulty);
                    return (
                      <motion.div 
                        key={interview.id}
                        className="accordion-item mb-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="accordion-header">
                          <div 
                            className={`accordion-trigger ${expandedId === interview.id ? 'active' : ''}`}
                            onClick={() => setExpandedId(expandedId === interview.id ? null : interview.id)}
                          >
                            <div className="question-icon">
                              <i className="bi bi-question-circle-fill"></i>
                            </div>
                            <div className="question-content">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <span 
                                  className="badge px-3 py-2"
                                  style={{ 
                                    backgroundColor: difficultyStyle.bg, 
                                    color: difficultyStyle.text 
                                  }}
                                >
                                  {difficultyStyle.label}
                                </span>
                                <button 
                                  className={`bookmark-btn ${bookmarks.has(interview.id) ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBookmark(interview.id);
                                  }}
                                >
                                  <i className={`bi ${bookmarks.has(interview.id) ? 'bi-bookmark-fill text-warning' : 'bi-bookmark text-muted'}`}></i>
                                </button>
                              </div>
                              <h5 className="question-text mb-0">{interview.question}</h5>
                            </div>
                            <div className="expand-icon">
                              <i className={`bi bi-chevron-${expandedId === interview.id ? 'up' : 'down'}`}></i>
                            </div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedId === interview.id && (
                            <motion.div 
                              className="accordion-body"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="answer-content p-4">
                                <h6 className="fw-bold mb-3" style={{ color: '#4400ff' }}>
                                  <i className="bi bi-chat-dots-fill me-2"></i>
                                  Answer:
                                </h6>
                                <p className="mb-0">{interview.answer}</p>
                                
                                {!user && (
                                  <div className="alert alert-warning mt-3 mb-0">
                                    <i className="bi bi-lock-fill me-2"></i>
                                    <a href="/login" className="alert-link">Login</a> to bookmark questions and track your progress.
                                  </div>
                                )}

                                {user && (
                                  <div className="quick-actions mt-3 pt-3 border-top d-flex gap-2">
                                    <button 
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleQuizSelection('timed')}
                                    >
                                      <i className="bi bi-clock-history me-1"></i> Timed Quiz
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-success"
                                      onClick={() => handleQuizSelection('untimed')}
                                    >
                                      <i className="bi bi-hourglass-split me-1"></i> Untimed Quiz
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA */}
      {!user?.is_premium && !user?.is_admin && (
        <section className="premium-cta py-5" style={{ backgroundColor: '#f0f2f5' }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <motion.div 
                  className="card border-0 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  style={{ 
                    background: 'linear-gradient(145deg, #4400ff, #6a4cff)',
                  }}
                >
                  <div className="card-body p-5 text-center text-white">
                    <div className="premium-icon mb-4">
                      <i className="bi bi-crown-fill display-1"></i>
                    </div>
                    <h3 className="fw-bold mb-3">Unlock Premium Access</h3>
                    <p className="lead mb-4">
                      Get access to all {product.interview_count || interviews.length}+ expert-curated questions 
                      with detailed answers, progress tracking, and personalized recommendations.
                    </p>
                    
                    <div className="row g-3 mb-4">
                      <div className="col-6">
                        <div className="bg-white bg-opacity-25 rounded-3 p-3">
                          <i className="bi bi-infinity fs-3"></i>
                          <h6 className="mt-2">Unlimited Access</h6>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="bg-white bg-opacity-25 rounded-3 p-3">
                          <i className="bi bi-graph-up fs-3"></i>
                          <h6 className="mt-2">Track Progress</h6>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                      <button 
                        className="btn btn-warning btn-lg px-5 py-3 fw-bold"
                        onClick={() => navigate('/payment-plans')}
                      >
                        Upgrade Now <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                      <button 
                        className="btn btn-outline-light btn-lg px-5 py-3 fw-bold"
                        onClick={() => navigate('/how-it-works')}
                      >
                        Learn More
                      </button>
                    </div>

                    <p className="small text-white-50 mt-4 mb-0">
                      ⚡ 7-day money-back guarantee • Instant access • Cancel anytime
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      <style>
        {`
          /* ===== FIX VERTICAL LINES AND OVERFLOW ===== */
          html, body {
            overflow-x: hidden !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .interview-detail-page {
            overflow-x: hidden !important;
            width: 100% !important;
          }

          .interview-detail-page section,
          .interview-detail-page .container,
          .interview-detail-page .row,
          .interview-detail-page [class*="col-"] {
            border-left: none !important;
            border-right: none !important;
            outline: none !important;
          }

          .hero-section svg {
            z-index: 1 !important;
          }

          /* ===== ACCORDION STYLES ===== */
          .accordion-item {
            border: 2px solid #ffcc00;
            border-radius: 16px;
            overflow: hidden;
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
          }

          .accordion-item:hover {
            box-shadow: 0 8px 30px rgba(68, 0, 255, 0.15);
          }

          .accordion-trigger {
            display: flex;
            align-items: center;
            padding: 1.2rem;
            cursor: pointer;
            background: white;
            transition: all 0.3s ease;
            min-height: 90px;
          }

          .accordion-trigger:hover {
            background: #f8f9fa;
          }

          .accordion-trigger.active {
            background: #fff9e6;
            border-bottom: 2px solid #ffcc00;
          }

          .question-icon {
            width: 60px;
            height: 60px;
            background: #ffcc00;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1.2rem;
            box-shadow: 0 4px 10px rgba(255, 204, 0, 0.3);
          }

          .question-icon i {
            font-size: 2rem;
            color: #4400ff;
          }

          .question-content {
            flex: 1;
          }

          .expand-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4400ff;
            font-size: 1.2rem;
          }

          .bookmark-btn {
            background: none;
            border: none;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 8px;
          }

          .bookmark-btn:hover {
            background: rgba(255, 193, 7, 0.1);
            transform: scale(1.1);
          }

          .bookmark-btn.active i {
            color: #ffcc00 !important;
          }

          .answer-content {
            background: #f8f9fa;
            border-top: 2px solid #ffcc00;
            border-radius: 0 0 16px 16px;
          }

          .icon-box {
            transition: transform 0.3s ease;
          }

          .icon-box:hover {
            transform: scale(1.1) rotate(5deg);
          }

          .modal-overlay {
            backdrop-filter: blur(5px);
          }

          @media (max-width: 768px) {
            .question-icon {
              width: 45px;
              height: 45px;
            }
            
            .question-icon i {
              font-size: 1.3rem;
            }
            
            .question-text {
              font-size: 0.95rem;
            }

            .difficulty-stats {
              flex-wrap: wrap;
              margin-top: 10px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default InterviewDetail; 