import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const FullInterview = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchFullInterview();
  }, [slug]);

  const fetchFullInterview = async () => {
    try {
      setLoading(true);
      const productResponse = await api.get(`/api/interview/products/${slug}/`);
      setProduct(productResponse.data);
      
      const interviewsResponse = await api.get(`/api/interview/products/${slug}/interviews/?limit=100`);
      setInterviews(interviewsResponse.data.results || interviewsResponse.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(interviewsResponse.data.results?.map(i => i.category_name))];
      setCategories(uniqueCategories);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching full interview:', error);
      setLoading(false);
      toast.error('Failed to load interview questions');
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    const matchesSearch = interview.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || interview.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="full-interview-page">
      {/* Header */}
      <section className="header-section py-4" style={{ background: '#4400ff' }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <h1 className="text-white fw-bold mb-2">{product.name} - Complete Interview Guide</h1>
              <p className="text-white-50 mb-0">All {interviews.length} questions with detailed answers</p>
            </div>
            <div className="col-md-4 text-md-end mt-3 mt-md-0">
              <button 
                className="btn btn-warning"
                onClick={() => navigate(`/quiz/timed/${product.id}`)}
              >
                <i className="fas fa-play me-2"></i>
                Take Quiz
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="filters-section py-4 bg-light">
        <div className="container">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <select 
                className="form-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Questions Grid */}
      <section className="questions-section py-4">
        <div className="container">
          <div className="row">
            <div className="col-12 mb-3">
              <p className="text-muted">
                Showing {filteredInterviews.length} of {interviews.length} questions
              </p>
            </div>
          </div>
          
          <div className="row g-4">
            {filteredInterviews.map((interview, index) => (
              <motion.div 
                key={interview.id}
                className="col-lg-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="card h-100 border-0 shadow-sm hover-card">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between mb-3">
                      <span className="badge bg-warning text-dark">
                        Q{index + 1}
                      </span>
                      <span className={`badge bg-${interview.difficulty === 'BEGINNER' ? 'success' : 
                                                   interview.difficulty === 'INTERMEDIATE' ? 'warning' : 
                                                   interview.difficulty === 'ADVANCED' ? 'danger' : 'dark'}`}>
                        {interview.difficulty}
                      </span>
                    </div>
                    
                    <h5 className="fw-bold mb-3">{interview.question}</h5>
                    
                    <div className="answer-preview mb-3">
                      <p className="text-muted mb-0">
                        {interview.answer.substring(0, 150)}...
                      </p>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          // Scroll to question in detail view or expand
                          const element = document.getElementById(`question-${interview.id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        Read Full Answer <i className="fas fa-arrow-right ms-2"></i>
                      </button>
                      <small className="text-muted">
                        <i className="fas fa-eye me-1"></i>
                        {interview.views_count || 0} views
                      </small>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Styles */}
      <style>
        {`
          .hover-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .hover-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 1rem 3rem rgba(68, 0, 255, 0.1)!important;
          }
        `}
      </style>
    </div>
  );
};

export default FullInterview;