import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import slider1 from '../../assets/slider1.png';

const InterviewLevels = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_interviews: 0,
    total_products: 0,
    total_categories: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchStats();
    window.scrollTo(0, 0);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/interview/products/');
      let productsData = [];
      if (response.data.results) {
        productsData = response.data.results;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else {
        productsData = [];
      }
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/interview/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProductClick = (product) => {
    if (user) {
      navigate(`/interview/${product.slug}`);
    } else {
      navigate('/login?redirect=' + encodeURIComponent(`/interview/${product.slug}`));
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const productsArray = Array.isArray(products) ? products : [];

  return (
    <>
      {/* Embedded Styles - True Full Width */}
      <style>{`
        /* ===== GLOBAL RESET ===== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        :root {
          --primary: #4400ff;
          --primary-dark: #3300cc;
          --primary-light: #6a4cff;
          --secondary: #ffc100;
          --secondary-dark: #e6ae00;
          --secondary-light: #ffd700;
          --dark: #1a1a1a;
          --dark-bg: #0a0a0a;
          --gray: #6c757d;
          --light: #f8f9fa;
          --white: #ffffff;
          --gradient-primary: linear-gradient(135deg, #4400ff 0%, #6a4cff 100%);
          --gradient-secondary: linear-gradient(135deg, #ffc100 0%, #ffd700 100%);
          --shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 10px 25px rgba(68, 0, 255, 0.1);
          --shadow-lg: 0 20px 40px rgba(68, 0, 255, 0.15);
          --shadow-hover: 0 30px 50px rgba(68, 0, 255, 0.25);
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --border-radius: 16px;
          --border-radius-sm: 8px;
          --border-radius-lg: 24px;
        }

        /* ===== HERO SECTION - TRUE FULL WIDTH ===== */
        .hero-section-full {
          position: relative !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          min-height: 100vh !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        /* Full Coverage Background Image */
        .hero-bg-image {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          z-index: 0 !important;
          /* Left-to-right fade effect */
          mask-image: linear-gradient(to right, transparent 0%, black 40%, black 100%) !important;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 40%, black 100%) !important;
        }

        /* Gradient Overlay */
        .hero-gradient-overlay {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(68, 0, 255, 0.6) 50%, rgba(0, 0, 0, 0.4) 100%) !important;
          z-index: 1 !important;
        }

        /* Hero Content */
        .hero-content {
          position: relative !important;
          z-index: 2 !important;
          width: 100% !important;
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: 0 2rem !important;
        }

        .hero-text-content {
          max-width: 55% !important;
        }

        .hero-main-title {
          font-size: clamp(2.5rem, 5vw, 4rem) !important;
          font-weight: 800 !important;
          margin-bottom: 1.5rem !important;
          line-height: 1.2 !important;
          color: var(--white) !important;
        }

        .hero-main-title span {
          color: var(--secondary) !important;
        }

        .hero-description {
          font-size: clamp(1rem, 1.5vw, 1.2rem) !important;
          margin-bottom: 2rem !important;
          line-height: 1.6 !important;
          color: rgba(255, 255, 255, 0.95) !important;
        }

        .hero-buttons-container {
          display: flex !important;
          gap: 1rem !important;
          flex-wrap: wrap !important;
        }

        .btn-hero-primary {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          padding: 1rem 2rem !important;
          background: var(--secondary) !important;
          color: var(--dark) !important;
          border: none !important;
          border-radius: 50px !important;
          font-weight: 600 !important;
          font-size: 1rem !important;
          cursor: pointer !important;
          transition: var(--transition) !important;
        }

        .btn-hero-primary:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 25px rgba(255, 193, 0, 0.3) !important;
          background: var(--secondary-dark) !important;
        }

        .btn-hero-secondary {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          padding: 1rem 2rem !important;
          background: transparent !important;
          color: var(--white) !important;
          border: 2px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 50px !important;
          font-weight: 600 !important;
          font-size: 1rem !important;
          cursor: pointer !important;
          transition: var(--transition) !important;
        }

        .btn-hero-secondary:hover {
          border-color: var(--secondary) !important;
          color: var(--secondary) !important;
          transform: translateY(-3px) !important;
        }

        /* ===== STATS SECTION - FULL WIDTH ===== */
        .stats-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .stats-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
        }

        .stats-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
          gap: 2rem !important;
        }

        .stat-card {
          background: #ffffff !important;
          border-radius: 20px !important;
          padding: 2.5rem !important;
          text-align: center !important;
          transition: var(--transition) !important;
          box-shadow: var(--shadow-md) !important;
          position: relative !important;
          overflow: hidden !important;
        }

        .stat-card::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 4px !important;
          background: linear-gradient(90deg, #4400ff, #ffcc00) !important;
          transform: scaleX(0) !important;
          transition: transform 0.3s ease !important;
        }

        .stat-card:hover::before {
          transform: scaleX(1) !important;
        }

        .stat-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: var(--shadow-hover) !important;
        }

        .stat-icon-wrapper {
          width: 80px !important;
          height: 80px !important;
          margin: 0 auto 1.5rem !important;
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.1), rgba(255, 204, 0, 0.1)) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: transform 0.3s ease !important;
        }

        .stat-card:hover .stat-icon-wrapper {
          transform: scale(1.1) !important;
        }

        .stat-icon {
          font-size: 2.5rem !important;
          color: #4400ff !important;
        }

        .stat-number {
          font-size: 2.5rem !important;
          font-weight: 800 !important;
          color: #1a1a1a !important;
          margin-bottom: 0.5rem !important;
        }

        .stat-label {
          font-size: 1rem !important;
          color: #6c757d !important;
          font-weight: 500 !important;
        }

        /* ===== LEVELS SECTION - FULL WIDTH ===== */
        .levels-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: #ffffff;
          padding: 5rem 2rem !important;
        }

        .levels-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
        }

        .section-header {
          text-align: center !important;
          margin-bottom: 3rem !important;
        }

        .section-title {
          font-size: 2.5rem !important;
          font-weight: 800 !important;
          color: #1a1a1a !important;
          margin-bottom: 1rem !important;
          position: relative !important;
          display: inline-block !important;
        }

        .section-title::after {
          content: '' !important;
          position: absolute !important;
          bottom: -10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 80px !important;
          height: 4px !important;
          background: linear-gradient(90deg, #4400ff, #ffcc00) !important;
          border-radius: 2px !important;
        }

        .section-subtitle {
          font-size: 1.2rem !important;
          color: #6c757d !important;
          max-width: 700px !important;
          margin: 1rem auto 0 !important;
        }

        .products-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)) !important;
          gap: 2rem !important;
        }

        .product-card {
          height: 100% !important;
        }

        .product-card-inner {
          background: #ffffff !important;
          border-radius: 20px !important;
          overflow: hidden !important;
          transition: var(--transition) !important;
          box-shadow: var(--shadow-md) !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .product-card-inner:hover {
          transform: translateY(-8px) !important;
          box-shadow: var(--shadow-hover) !important;
        }

        .product-image-wrapper {
          position: relative !important;
          overflow: hidden !important;
          height: 240px !important;
        }

        .product-image {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transition: transform 0.5s ease !important;
        }

        .product-card-inner:hover .product-image {
          transform: scale(1.05) !important;
        }

        .product-badge {
          position: absolute !important;
          top: 1rem !important;
          right: 1rem !important;
          background: linear-gradient(135deg, #ffcc00, #ffd700) !important;
          color: #1a1a1a !important;
          padding: 0.5rem 1rem !important;
          border-radius: 50px !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
          z-index: 1 !important;
        }

        .product-content {
          padding: 1.5rem !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .product-title {
          font-size: 1.35rem !important;
          font-weight: 700 !important;
          color: #1a1a1a !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.3 !important;
        }

        .product-description {
          font-size: 0.95rem !important;
          color: #6c757d !important;
          line-height: 1.6 !important;
          margin-bottom: 1.5rem !important;
          flex: 1 !important;
        }

        .product-footer {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          margin-top: auto !important;
        }

        .btn-primary-custom {
          background: linear-gradient(135deg, #4400ff, #6a4cff) !important;
          color: #ffffff !important;
          border: none !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 50px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: var(--transition) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }

        .btn-primary-custom:hover {
          transform: translateX(5px) !important;
          box-shadow: 0 5px 15px rgba(68, 0, 255, 0.3) !important;
        }

        .product-difficulty {
          font-size: 0.85rem !important;
          color: #6c757d !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }

        /* ===== FEATURES SECTION - FULL WIDTH ===== */
        .features-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .features-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
        }

        .features-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
          gap: 2rem !important;
        }

        .feature-card {
          text-align: center !important;
          padding: 2rem !important;
          background: #ffffff !important;
          border-radius: 20px !important;
          transition: var(--transition) !important;
          box-shadow: var(--shadow-md) !important;
        }

        .feature-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: var(--shadow-hover) !important;
        }

        .feature-icon-wrapper {
          width: 80px !important;
          height: 80px !important;
          margin: 0 auto 1.5rem !important;
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.1), rgba(255, 204, 0, 0.1)) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .feature-icon {
          font-size: 2rem !important;
          color: #4400ff !important;
        }

        .feature-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          color: #1a1a1a !important;
          margin-bottom: 1rem !important;
        }

        .feature-description {
          font-size: 0.95rem !important;
          color: #6c757d !important;
          line-height: 1.6 !important;
        }

        /* ===== CTA SECTION - FULL WIDTH ===== */
        .cta-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #4400ff 0%, #ffcc00 100%) !important;
          padding: 5rem 2rem !important;
          overflow: hidden !important;
          position: relative !important;
        }

        .cta-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
          position: relative !important;
          z-index: 1 !important;
        }

        .cta-content {
          text-align: center !important;
        }

        .cta-title {
          font-size: 2.5rem !important;
          font-weight: 800 !important;
          color: #ffffff !important;
          margin-bottom: 1rem !important;
        }

        .cta-subtitle {
          font-size: 1.2rem !important;
          color: rgba(255, 255, 255, 0.95) !important;
          margin-bottom: 2rem !important;
          max-width: 600px !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .btn-cta {
          background: #ffffff !important;
          color: #4400ff !important;
          border: none !important;
          padding: 1rem 2.5rem !important;
          border-radius: 50px !important;
          font-size: 1.1rem !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: var(--transition) !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
        }

        .btn-cta:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3) !important;
          gap: 1rem !important;
        }

        /* ===== EMPTY STATE ===== */
        .empty-state {
          text-align: center !important;
          padding: 4rem !important;
          background: #f8f9fa !important;
          border-radius: 20px !important;
        }

        .empty-state i {
          font-size: 4rem !important;
          color: #dee2e6 !important;
          margin-bottom: 1rem !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 991px) {
          .hero-text-content {
            max-width: 100% !important;
            text-align: center !important;
          }
          .hero-buttons-container {
            justify-content: center !important;
          }
          .hero-bg-image {
            mask-image: linear-gradient(to right, transparent 0%, black 20%, black 100%) !important;
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20%, black 100%) !important;
          }
          .section-title {
            font-size: 2rem !important;
          }
        }

        @media (max-width: 768px) {
          .hero-content {
            padding: 0 1.5rem !important;
          }
          .stats-section,
          .levels-section,
          .features-section,
          .cta-section {
            padding: 3rem 1rem !important;
          }
          .section-title {
            font-size: 1.75rem !important;
          }
          .hero-bg-image {
            mask-image: linear-gradient(to right, transparent 0%, black 10%, black 100%) !important;
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 100%) !important;
          }
        }

        @media (max-width: 576px) {
          .products-grid,
          .stats-grid,
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .btn-hero-primary,
          .btn-hero-secondary {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Hero Section - True Full Width */}
      <div className="hero-section-full">
        <img 
          src={slider1} 
          alt="Interview Preparation" 
          className="hero-bg-image"
        />
        <div className="hero-gradient-overlay"></div>
        
        <div className="hero-content">
          <div className="hero-text-content">
            <motion.h1 
              className="hero-main-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Pass All Interviews with <span>Confidence</span>
            </motion.h1>
            <motion.p 
              className="hero-description"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your trusted online gateway to passing any interview at the first attempt
            </motion.p>
            <motion.div 
              className="hero-buttons-container"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button 
                className="btn-hero-primary"
                onClick={() => navigate('/exams')}
              >
                Start Practicing <i className="fas fa-arrow-right"></i>
              </button>
              <button 
                className="btn-hero-secondary"
                onClick={() => navigate('/payment-plans')}
              >
                View Plans <i className="fas fa-chevron-right"></i>
              </button>
            </motion.div>
          </div>
        </div>
      </div>

  

      {/* Interview Levels Section */}
      <section className="levels-section">
        <div className="levels-container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Choose Your Interview Level</h2>
            <p className="section-subtitle">Select the job category you're preparing for</p>
          </motion.div>

          {productsArray.length > 0 ? (
            <div className="products-grid">
              {productsArray.map((product, index) => (
                <motion.div 
                  key={product.id || index}
                  className="product-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                >
                  <div className="product-card-inner">
                    <div className="product-image-wrapper">
                      <img 
                        src={product.image || '/images/default-product.jpg'} 
                        className="product-image" 
                        alt={product.name || 'Interview Category'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/default-product.jpg';
                        }}
                      />
                      <div className="product-badge">
                        <i className="fas fa-question-circle"></i>
                        {product.interview_count || '100+'} Questions
                      </div>
                    </div>
                    <div className="product-content">
                      <h4 className="product-title">{product.name || 'Interview Category'}</h4>
                      <p className="product-description">
                        {product.description || 'Prepare for your interview with our comprehensive question bank.'}
                      </p>
                      <div className="product-footer">
                        <button 
                          className="btn-primary-custom"
                          onClick={() => handleProductClick(product)}
                        >
                          Start Practicing
                          <i className="fas fa-arrow-right"></i>
                        </button>
                        <span className="product-difficulty">
                          <i className="fas fa-clock"></i>
                          {product.difficulty || 'All Levels'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-folder-open"></i>
              <h5>No interview categories available</h5>
              <p>Please check back later for new content</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Why Choose Our Interview Prep?</h2>
            <p className="section-subtitle">Everything you need to succeed in your next interview</p>
          </motion.div>

          <div className="features-grid">
            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              <div className="feature-icon-wrapper">
                <i className="fas fa-check-circle feature-icon"></i>
              </div>
              <h5 className="feature-title">Real Interview Questions</h5>
              <p className="feature-description">Curated from actual interviews at top companies worldwide</p>
            </motion.div>

            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="feature-icon-wrapper">
                <i className="fas fa-star feature-icon"></i>
              </div>
              <h5 className="feature-title">Expert Answers</h5>
              <p className="feature-description">Detailed explanations from industry professionals</p>
            </motion.div>

            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <div className="feature-icon-wrapper">
                <i className="fas fa-chart-line feature-icon"></i>
              </div>
              <h5 className="feature-title">Track Progress</h5>
              <p className="feature-description">Monitor your improvement with detailed analytics</p>
            </motion.div>

            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="feature-icon-wrapper">
                <i className="fas fa-mobile-alt feature-icon"></i>
              </div>
              <h5 className="feature-title">Mobile Friendly</h5>
              <p className="feature-description">Practice anytime, anywhere on any device</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="cta-title">Ready to Ace Your Interview?</h2>
            <p className="cta-subtitle">Join thousands of successful candidates who landed their dream jobs</p>
            <button 
              className="btn-cta"
              onClick={() => navigate('/payment-plans')}
            >
              Get Started Now
              <i className="fas fa-rocket"></i>
            </button>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default InterviewLevels;