import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import axios from 'axios';
import slider2 from '../../assets/slider2.png';

const Careers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [progressData, setProgressData] = useState({
    aptitude: { completed: 30, points: 200 },
    interview: { completed: 15, points: 100 },
    promotion: { completed: 10, points: 50 },
    civil: { completed: 5, points: 25 }
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchUserProgress();
  }, []);

  const fetchUserProgress = async () => {
    if (!user) return;
    try {
      const response = await axios.get('/api/auth/stats/', { withCredentials: true });
      if (response.data) {}
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleStart = (category) => {
    if (category === 'interview') {
      window.location.href = '/interview-levels';
      return;
    }
    if (!user) {
      navigate('/login?redirect=/careers');
      return;
    }
    switch(category) {
      case 'aptitude':
        navigate('/practice/aptitude/Verbal%20Reasoning?trial=true');
        break;
      case 'promotion':
        navigate('/practice/promotion/Leadership%20Assessment?trial=true');
        break;
      case 'civil':
        navigate('/practice/civil/General%20Paper?trial=true');
        break;
      default:
        navigate(`/careers/${category}`);
    }
  };

  const categories = [
    {
      id: 'aptitude', title: 'Aptitude Tests', icon: 'bi-lightbulb-fill',
      description: 'Verbal, numerical and abstract reasoning', color: '#4400ff',
      iconBg: 'rgba(68, 0, 255, 0.15)', progress: progressData.aptitude.completed,
      points: progressData.aptitude.points,
      features: ['Verbal Reasoning', 'Numerical Reasoning', 'Abstract Reasoning', 'Time Management']
    },
    {
      id: 'interview', title: 'Interview Preparation', icon: 'bi-mic-fill',
      description: 'Common interview questions and techniques', color: '#ffc100',
      iconBg: 'rgba(255, 193, 0, 0.15)', progress: progressData.interview.completed,
      points: progressData.interview.points,
      features: ['HR Questions', 'Technical Interviews', 'Behavioral Questions', 'Salary Negotiation']
    },
    {
      id: 'promotion', title: 'Promotion Exams', icon: 'bi-graph-up',
      description: 'Public and private sector promotion tests', color: '#28a745',
      iconBg: 'rgba(40, 167, 69, 0.15)', progress: progressData.promotion.completed,
      points: progressData.promotion.points,
      features: ['Leadership Assessment', 'Management Skills', 'Strategic Thinking', 'Case Studies']
    },
    {
      id: 'civil', title: 'Civil Service Exams', icon: 'bi-building',
      description: 'Federal and state civil service exams', color: '#17a2b8',
      iconBg: 'rgba(23, 162, 184, 0.15)', progress: progressData.civil.completed,
      points: progressData.civil.points,
      features: ['General Paper', 'Current Affairs', 'Public Administration', 'Interview Preparation']
    }
  ];

  const filteredCategories = selectedTab === 'all' 
    ? categories 
    : categories.filter(cat => cat.id === selectedTab);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="careers-page">
      <style>{`
        *:focus, *:focus-visible, *:active, button:focus, button:focus-visible,
        a:focus, a:focus-visible { outline: none !important; box-shadow: none !important; }

        :root {
          --primary: #4400ff; --primary-dark: #3300cc;
          --secondary: #ffc100; --secondary-dark: #e6ae00;
          --dark: #1a1a1a; --gray: #6c757d; --light: #f8f9fa; --white: #ffffff;
          --shadow-sm: 0 4px 6px rgba(0,0,0,0.05);
          --shadow-md: 0 10px 25px rgba(68,0,255,0.1);
          --shadow-lg: 0 20px 40px rgba(68,0,255,0.15);
          --shadow-hover: 0 30px 50px rgba(68,0,255,0.25);
          --transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }

        /* ===== HERO - FULL WIDTH ===== */
        .hero-section-full {
          position: relative !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          min-height: 90vh !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .hero-bg-image {
          position: absolute !important;
          top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover !important; z-index: 0 !important;
          /* FADED TO THE LEFT - image visible on right, fades out toward left */
          mask-image: linear-gradient(to left, black 0%, black 50%, transparent 100%) !important;
          -webkit-mask-image: linear-gradient(to left, black 0%, black 50%, transparent 100%) !important;
        }

        .hero-gradient-overlay {
          position: absolute !important;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(68,0,255,0.5) 50%, rgba(0,0,0,0.2) 100%) !important;
          z-index: 1 !important;
        }

        .hero-content {
          position: relative !important; z-index: 2 !important;
          width: 100% !important; max-width: 1200px !important;
          margin: 0 auto !important; padding: 0 2rem !important;
        }

        .hero-text-content { max-width: 55% !important; }

        .hero-main-title {
          font-size: clamp(2.5rem, 5vw, 4rem) !important;
          font-weight: 800 !important; margin-bottom: 1.5rem !important;
          line-height: 1.2 !important; color: #fff !important;
        }

        .hero-main-title span { color: var(--secondary) !important; }

        .hero-description {
          font-size: clamp(1rem, 1.5vw, 1.2rem) !important;
          margin-bottom: 2rem !important; line-height: 1.6 !important;
          color: rgba(255,255,255,0.95) !important;
        }

        .hero-buttons-container {
          display: flex !important; gap: 1rem !important; flex-wrap: wrap !important;
        }

        .btn-hero-primary {
          display: inline-flex !important; align-items: center !important; gap: 0.5rem !important;
          padding: 1rem 2rem !important; background: var(--secondary) !important;
          color: var(--dark) !important; border: none !important;
          border-radius: 50px !important; font-weight: 600 !important;
          font-size: 1rem !important; cursor: pointer !important;
          transition: var(--transition) !important; text-decoration: none !important;
        }

        .btn-hero-primary:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 25px rgba(255,193,0,0.3) !important;
        }

        .btn-hero-secondary {
          display: inline-flex !important; align-items: center !important; gap: 0.5rem !important;
          padding: 1rem 2rem !important; background: transparent !important;
          color: #fff !important; border: 2px solid rgba(255,255,255,0.3) !important;
          border-radius: 50px !important; font-weight: 600 !important;
          font-size: 1rem !important; cursor: pointer !important;
          transition: var(--transition) !important; text-decoration: none !important;
        }

        .btn-hero-secondary:hover {
          border-color: var(--secondary) !important; color: var(--secondary) !important;
          transform: translateY(-3px) !important;
        }

        /* ===== TABS - FULL WIDTH ===== */
        .filter-tabs {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          padding: 2rem 0 !important; background: white !important;
          border-bottom: 1px solid rgba(0,0,0,0.05) !important;
          position: sticky !important; top: 76px !important; z-index: 100 !important;
        }

        .tabs-wrapper {
          display: flex !important; flex-wrap: wrap !important;
          gap: 0.75rem !important; justify-content: center !important;
          max-width: 1200px !important; margin: 0 auto !important; padding: 0 2rem !important;
        }

        .tab-btn {
          padding: 0.7rem 1.6rem !important; border: 2px solid #e9ecef !important;
          background: white !important; border-radius: 50px !important;
          font-weight: 600 !important; font-size: 0.9rem !important;
          color: #6c757d !important; cursor: pointer !important;
          transition: var(--transition) !important;
        }

        .tab-btn:hover { border-color: #4400ff !important; color: #4400ff !important; }

        .tab-btn.active {
          background: linear-gradient(135deg, #4400ff, #6a4cff) !important;
          border-color: #4400ff !important; color: white !important;
          box-shadow: 0 4px 15px rgba(68,0,255,0.3) !important;
        }

        /* ===== CARDS - FULL WIDTH ===== */
        .careers-cards {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          padding: 5rem 2rem !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%) !important;
        }

        .cards-container { max-width: 1200px !important; margin: 0 auto !important; }

        .career-card {
          background: #fff !important; border-radius: 24px !important;
          overflow: hidden !important; transition: var(--transition) !important;
          box-shadow: var(--shadow-md) !important; height: 100% !important;
          display: flex !important; flex-direction: column !important;
        }

        .career-card:hover {
          transform: translateY(-10px) !important;
          box-shadow: var(--shadow-hover) !important;
        }

        .card-header-section {
          padding: 1.75rem !important; border-bottom: 1px solid #f0f0f0 !important;
        }

        .icon-wrapper {
          width: 60px; height: 60px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: var(--transition); flex-shrink: 0;
        }

        .career-card:hover .icon-wrapper { transform: scale(1.08) rotate(-5deg); }

        .icon-wrapper i { font-size: 1.8rem; }

        .card-title { font-size: 1.35rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.25rem; }
        .card-description { font-size: 0.85rem; color: #6c757d; margin-bottom: 0; }

        .mode-badge {
          background: linear-gradient(135deg, #f0edff, #e8e5ff);
          padding: 0.4rem 0.9rem; border-radius: 50px;
          font-size: 0.7rem; font-weight: 600; color: #4400ff; white-space: nowrap;
        }

        .features-list {
          padding: 1.25rem 1.75rem; display: flex; flex-wrap: wrap;
          gap: 0.65rem; border-bottom: 1px solid #f0f0f0;
        }

        .feature-item {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8rem; color: #495057; background: #f8f9fa;
          padding: 0.45rem 0.9rem; border-radius: 50px; font-weight: 500;
        }

        .progress-section { padding: 1.75rem; flex: 1; }
        .progress-label { font-size: 0.8rem; font-weight: 600; color: #6c757d; }
        .progress-percent { font-size: 0.9rem; font-weight: 700; }

        .progress-bar-container {
          background: #e9ecef; border-radius: 10px; height: 8px; overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%; border-radius: 10px; transition: width 0.5s ease;
        }

        .points-earned {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.85rem; font-weight: 500; color: #6c757d;
        }

        .points-earned i { font-size: 1rem; color: #ffc100; }

        .start-btn {
          padding: 0.7rem 1.6rem; border: none; border-radius: 50px;
          font-weight: 600; font-size: 0.9rem; color: white;
          cursor: pointer; transition: var(--transition);
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        .start-btn:hover { transform: translateX(5px); filter: brightness(1.1); }

        /* ===== STATS - FULL WIDTH ===== */
        .stats-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .stats-container { max-width: 1200px !important; margin: 0 auto !important; }

        .stats-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
          gap: 2rem !important;
        }

        .stat-card {
          background: #fff !important; border-radius: 20px !important;
          padding: 2.5rem !important; text-align: center !important;
          transition: var(--transition) !important; box-shadow: var(--shadow-md) !important;
          position: relative !important; overflow: hidden !important;
        }

        .stat-card::before {
          content: '' !important; position: absolute !important;
          top: 0; left: 0; right: 0; height: 4px !important;
          background: linear-gradient(90deg, #4400ff, #ffcc00) !important;
          transform: scaleX(0) !important; transition: transform 0.3s ease !important;
        }

        .stat-card:hover::before { transform: scaleX(1) !important; }
        .stat-card:hover {
          transform: translateY(-8px) !important; box-shadow: var(--shadow-hover) !important;
        }

        .stat-icon-wrapper {
          width: 80px; height: 80px; margin: 0 auto 1.5rem;
          background: linear-gradient(135deg, rgba(68,0,255,0.1), rgba(255,204,0,0.1));
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          transition: transform 0.3s ease;
        }

        .stat-card:hover .stat-icon-wrapper { transform: scale(1.1); }
        .stat-icon { font-size: 2.5rem; color: #4400ff; }
        .stat-number { font-size: 2.5rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.5rem; }
        .stat-label { font-size: 1rem; color: #6c757d; font-weight: 500; }

        /* ===== CTA - FULL WIDTH ===== */
        .cta-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #4400ff 0%, #ffcc00 100%) !important;
          padding: 5rem 2rem !important; overflow: hidden !important;
          position: relative !important;
        }

        .cta-container {
          max-width: 1200px !important; margin: 0 auto !important;
          position: relative !important; z-index: 1 !important;
        }

        .cta-content { text-align: center !important; }

        .cta-title {
          font-size: 2.5rem !important; font-weight: 800 !important;
          color: #fff !important; margin-bottom: 1rem !important;
        }

        .cta-subtitle {
          font-size: 1.2rem !important; color: rgba(255,255,255,0.95) !important;
          margin-bottom: 2rem !important; max-width: 600px !important;
          margin-left: auto !important; margin-right: auto !important;
        }

        .btn-cta {
          background: #fff !important; color: #4400ff !important; border: none !important;
          padding: 1rem 2.5rem !important; border-radius: 50px !important;
          font-size: 1.1rem !important; font-weight: 700 !important; cursor: pointer !important;
          transition: var(--transition) !important; display: inline-flex !important;
          align-items: center !important; gap: 0.75rem !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
        }

        .btn-cta:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 15px 40px rgba(0,0,0,0.3) !important;
          gap: 1rem !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 991px) {
          .hero-text-content { max-width: 100% !important; text-align: center !important; }
          .hero-buttons-container { justify-content: center !important; }
          .hero-bg-image {
            mask-image: linear-gradient(to left, black 0%, black 30%, transparent 100%) !important;
            -webkit-mask-image: linear-gradient(to left, black 0%, black 30%, transparent 100%) !important;
          }
        }

        @media (max-width: 768px) {
          .hero-content { padding: 0 1.5rem !important; }
          .careers-cards, .stats-section, .cta-section { padding: 3rem 1rem !important; }
          .hero-bg-image {
            mask-image: linear-gradient(to bottom, black 0%, black 30%, transparent 100%) !important;
            -webkit-mask-image: linear-gradient(to bottom, black 0%, black 30%, transparent 100%) !important;
          }
          .hero-gradient-overlay {
            background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(68,0,255,0.6) 100%) !important;
          }
        }

        @media (max-width: 576px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>


      {/* Filter Tabs */}
      <section className="filter-tabs">
        <div className="tabs-wrapper">
          {['all', 'aptitude', 'interview', 'promotion', 'civil'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${selectedTab === tab ? 'active' : ''}`}
              onClick={() => setSelectedTab(tab)}
            >
              <i className={`bi ${tab === 'all' ? 'bi-grid-3x3-gap-fill' : tab === 'aptitude' ? 'bi-lightbulb-fill' : tab === 'interview' ? 'bi-mic-fill' : tab === 'promotion' ? 'bi-graph-up' : 'bi-building'} me-2`}></i>
              {tab === 'all' ? 'All Categories' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Cards Section */}
      <section className="careers-cards">
        <div className="cards-container">
          <div className="row g-4">
            {filteredCategories.map((category, index) => (
              <div key={category.id} className="col-lg-6">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.5 }}>
                  <div className="career-card">
                    <div className="card-header-section">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex gap-3">
                          <div className="icon-wrapper" style={{ background: category.iconBg }}>
                            <i className={`bi ${category.icon}`} style={{ color: category.color }}></i>
                          </div>
                          <div>
                            <h3 className="card-title">{category.title}</h3>
                            <p className="card-description">{category.description}</p>
                          </div>
                        </div>
                        <div className="mode-badge">
                          <i className="bi bi-infinity me-1"></i> Self-Paced
                        </div>
                      </div>
                    </div>
                    <div className="features-list">
                      {category.features.map((feature, idx) => (
                        <div key={idx} className="feature-item">
                          <i className="bi bi-check-circle-fill" style={{ color: category.color }}></i>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="progress-section">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="progress-label"><i className="bi bi-arrow-repeat me-1"></i>Overall Progress</span>
                        <span className="progress-percent" style={{ color: category.color }}>{category.progress}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${category.progress}%` }} transition={{ duration: 1, delay: 0.3 }}
                          style={{ background: `linear-gradient(90deg, ${category.color}, ${category.color}cc)` }}
                        ></motion.div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="points-earned">
                          <i className="bi bi-star-fill"></i>
                          <span>{category.points.toLocaleString()} points earned</span>
                        </div>
                        <button className="start-btn" style={{ background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)` }}
                          onClick={() => handleStart(category.id)}>
                          Get Started <i className="bi bi-arrow-right ms-2"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            {[
              { icon: 'fas fa-users', value: '10,000+', label: 'Active Users' },
              { icon: 'fas fa-question-circle', value: '5,000+', label: 'Practice Questions' },
              { icon: 'fas fa-trophy', value: '85%', label: 'Success Rate' },
              { icon: 'fas fa-building', value: '50+', label: 'Organizations' }
            ].map((stat, i) => (
              <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="stat-icon-wrapper"><i className={`${stat.icon} stat-icon`}></i></div>
                <h3 className="stat-number">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="cta-section">
          <div className="cta-container">
            <motion.div className="cta-content" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="cta-title">Ready to Advance Your Career?</h2>
              <p className="cta-subtitle">Join thousands of successful candidates who prepared with us</p>
              <button className="btn-cta" onClick={() => navigate('/register')}>
                Create Free Account <i className="fas fa-rocket"></i>
              </button>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Careers;