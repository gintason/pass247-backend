import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const Promotion = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(false);
  }, []);

  const examModules = [
    {
      id: 'leadership',
      title: 'Leadership Assessment',
      icon: 'bi-people-fill',
      description: 'Evaluate and develop essential leadership competencies required for senior roles',
      color: '#4400ff',
      duration: '60 mins',
      sections: ['Decision Making', 'Team Management', 'Strategic Vision', 'Emotional Intelligence']
    },
    {
      id: 'management',
      title: 'Management Skills',
      icon: 'bi-gear-fill',
      description: 'Core management principles including planning, organizing and controlling',
      color: '#28a745',
      duration: '45 mins',
      sections: ['Project Management', 'Resource Allocation', 'Performance Evaluation', 'Change Management']
    },
    {
      id: 'strategic',
      title: 'Strategic Thinking',
      icon: 'bi-compass-fill',
      description: 'Develop analytical and strategic planning capabilities for organizational growth',
      color: '#ffc100',
      duration: '50 mins',
      sections: ['SWOT Analysis', 'Risk Management', 'Innovation Strategy', 'Policy Formulation']
    },
    {
      id: 'case-studies',
      title: 'Case Studies',
      icon: 'bi-file-earmark-text-fill',
      description: 'Real-world scenarios to test practical application of management concepts',
      color: '#dc3545',
      duration: '90 mins',
      sections: ['Public Sector Cases', 'Private Sector Cases', 'Crisis Management', 'Ethical Dilemmas']
    }
  ];

  const handleStartModule = (module) => {
    if (!user) {
      navigate('/login?redirect=/careers/promotion');
      return;
    }
    navigate('/exams');
    toast.info(`Select a question bank to practice ${module.title}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="promotion-page">
      <style>
        {`
          *:focus, *:focus-visible, *:active, button:focus, button:focus-visible,
          a:focus, a:focus-visible {
            outline: none !important;
            box-shadow: none !important;
          }

          .promotion-hero {
            background: linear-gradient(135deg, #14532d 0%, #28a745 50%, #ffc100 100%);
            position: relative;
            padding: 6rem 2rem 8rem 2rem;
            overflow: hidden;
          }

          .promotion-hero .hero-icon {
            width: 100px;
            height: 100px;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
          }

          .promotion-hero .hero-icon i {
            font-size: 3rem;
            color: white;
          }

          .promotion-hero .hero-title {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            color: white;
            margin-bottom: 1rem;
          }

          .promotion-hero .hero-subtitle {
            font-size: 1.1rem;
            color: rgba(255,255,255,0.9);
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }

          .hero-wave {
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            line-height: 0;
          }

          .modules-section {
            padding: 4rem 0;
            background: #f8f9fa;
          }

          .module-card {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            height: 100%;
          }

          .module-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }

          .module-card-body {
            padding: 2rem;
          }

          .module-icon {
            width: 65px;
            height: 65px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin-bottom: 1.25rem;
          }

          .module-card h3 {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }

          .module-card p {
            color: #6c757d;
            font-size: 0.9rem;
            line-height: 1.6;
            margin-bottom: 1rem;
          }

          .duration-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: #f8f9fa;
            padding: 0.4rem 0.8rem;
            border-radius: 50px;
            font-size: 0.8rem;
            font-weight: 600;
            color: #495057;
            margin-bottom: 1rem;
          }

          .section-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }

          .section-tag {
            background: #f0f0f0;
            padding: 0.35rem 0.75rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 500;
            color: #495057;
          }

          .start-module-btn {
            width: 100%;
            padding: 0.75rem;
            border: none;
            border-radius: 50px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .start-module-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          }

          @media (max-width: 768px) {
            .promotion-hero {
              padding: 4rem 1rem 6rem 1rem;
            }
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="promotion-hero">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="hero-icon mb-4">
                  <i className="bi bi-graph-up"></i>
                </div>
                <h1 className="hero-title">Promotion Exams</h1>
                <p className="hero-subtitle">
                  Prepare for public and private sector promotion examinations with our targeted study modules and practice assessments.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#f8f9fa" fillOpacity="1" d="M0,160L48,149.3C96,139,192,117,288,122.7C384,128,480,160,576,181.3C672,203,768,213,864,208C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Modules Section */}
      <section className="modules-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2" style={{ fontSize: '2rem' }}>Exam Modules</h2>
            <p className="text-muted">Comprehensive modules designed for career advancement exams</p>
          </div>
          <div className="row g-4">
            {examModules.map((module, index) => (
              <div key={module.id} className="col-md-6 col-lg-3">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="module-card">
                    <div className="module-card-body">
                      <div className="module-icon" style={{ background: `${module.color}20` }}>
                        <i className={`bi ${module.icon}`} style={{ color: module.color }}></i>
                      </div>
                      <h3>{module.title}</h3>
                      <p>{module.description}</p>
                      <div className="duration-badge">
                        <i className="bi bi-clock"></i>
                        {module.duration}
                      </div>
                      <div className="section-list">
                        {module.sections.map((section, i) => (
                          <span key={i} className="section-tag">{section}</span>
                        ))}
                      </div>
                      <button 
                        className="start-module-btn"
                        style={{ background: `linear-gradient(135deg, ${module.color}, ${module.color}dd)` }}
                        onClick={() => handleStartModule(module)}
                      >
                        Start Module <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section style={{ padding: '4rem 0', background: 'linear-gradient(135deg, #f8f9fa, #ffffff)' }}>
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                textAlign: 'center',
                background: 'linear-gradient(135deg, #28a745, #14532d)',
                padding: '3rem',
                borderRadius: '30px',
                color: 'white'
              }}
            >
              <h2 className="fw-bold mb-3">Earn Your Promotion!</h2>
              <p className="mb-4 opacity-90">Take your career to the next level with our promotion exam preparation materials.</p>
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: '#ffc100',
                  border: 'none',
                  padding: '0.8rem 2rem',
                  borderRadius: '50px',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  cursor: 'pointer'
                }}
              >
                Create Free Account <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Promotion;