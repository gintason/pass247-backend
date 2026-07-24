import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const CivilService = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(false);
  }, []);

  const examTypes = [
    {
      id: 'general-paper',
      title: 'General Paper',
      icon: 'bi-journal-text',
      description: 'Comprehensive general knowledge covering current affairs, history, and governance',
      color: '#4400ff',
      questions: 500,
      topics: ['Current Affairs', 'Nigerian History', 'Government & Politics', 'International Relations']
    },
    {
      id: 'public-admin',
      title: 'Public Administration',
      icon: 'bi-building',
      description: 'Principles and practices of public sector management and administration',
      color: '#28a745',
      questions: 350,
      topics: ['Administrative Law', 'Policy Making', 'Public Finance', 'Ethics in Government']
    },
    {
      id: 'quantitative',
      title: 'Quantitative Aptitude',
      icon: 'bi-graph-up',
      description: 'Numerical and statistical analysis for civil service examinations',
      color: '#ffc100',
      questions: 400,
      topics: ['Data Interpretation', 'Statistics', 'Budget Analysis', 'Basic Mathematics']
    },
    {
      id: 'english',
      title: 'English Language',
      icon: 'bi-pencil-square',
      description: 'Grammar, comprehension and official communication skills',
      color: '#17a2b8',
      questions: 300,
      topics: ['Grammar & Usage', 'Comprehension', 'Official Writing', 'Report Writing']
    }
  ];

  const handleStartExam = (exam) => {
    if (!user) {
      navigate('/login?redirect=/careers/civil');
      return;
    }
    navigate('/exams');
    toast.info(`Select a question bank to practice ${exam.title}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="civil-service-page">
      <style>
        {`
          *:focus, *:focus-visible, *:active, button:focus, button:focus-visible,
          a:focus, a:focus-visible {
            outline: none !important;
            box-shadow: none !important;
          }

          .civil-hero {
            background: linear-gradient(135deg, #0d3b66 0%, #17a2b8 50%, #28a745 100%);
            position: relative;
            padding: 6rem 2rem 8rem 2rem;
            overflow: hidden;
          }

          .civil-hero .hero-icon {
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

          .civil-hero .hero-icon i {
            font-size: 3rem;
            color: white;
          }

          .civil-hero .hero-title {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            color: white;
            margin-bottom: 1rem;
          }

          .civil-hero .hero-subtitle {
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

          .exams-section {
            padding: 4rem 0;
            background: #f8f9fa;
          }

          .exam-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            height: 100%;
          }

          .exam-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }

          .exam-icon {
            width: 60px;
            height: 60px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin-bottom: 1rem;
          }

          .exam-card h3 {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
          }

          .exam-card p {
            color: #6c757d;
            font-size: 0.9rem;
            line-height: 1.6;
            margin-bottom: 1rem;
          }

          .topic-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }

          .topic-tag {
            background: #f8f9fa;
            padding: 0.3rem 0.7rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 500;
            color: #495057;
          }

          .questions-count {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.85rem;
            color: #6c757d;
            margin-bottom: 1rem;
          }

          .start-exam-btn {
            width: 100%;
            padding: 0.7rem;
            border: none;
            border-radius: 50px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .start-exam-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          }

          @media (max-width: 768px) {
            .civil-hero {
              padding: 4rem 1rem 6rem 1rem;
            }
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="civil-hero">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="hero-icon mb-4">
                  <i className="bi bi-building"></i>
                </div>
                <h1 className="hero-title">Civil Service Exams</h1>
                <p className="hero-subtitle">
                  Prepare for federal and state civil service examinations with our comprehensive study materials and practice tests.
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

      {/* Exam Types Section */}
      <section className="exams-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2" style={{ fontSize: '2rem' }}>Exam Categories</h2>
            <p className="text-muted">Select an exam category to begin your preparation</p>
          </div>
          <div className="row g-4">
            {examTypes.map((exam, index) => (
              <div key={exam.id} className="col-md-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="exam-card">
                    <div className="exam-icon" style={{ background: `${exam.color}20` }}>
                      <i className={`bi ${exam.icon}`} style={{ color: exam.color }}></i>
                    </div>
                    <h3>{exam.title}</h3>
                    <p>{exam.description}</p>
                    <div className="topic-tags">
                      {exam.topics.map((topic, i) => (
                        <span key={i} className="topic-tag">{topic}</span>
                      ))}
                    </div>
                    <div className="questions-count">
                      <i className="bi bi-question-circle"></i>
                      {exam.questions}+ Practice Questions
                    </div>
                    <button 
                      className="start-exam-btn"
                      style={{ background: exam.color }}
                      onClick={() => handleStartExam(exam)}
                    >
                      Start Preparation <i className="bi bi-arrow-right ms-2"></i>
                    </button>
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
                background: 'linear-gradient(135deg, #17a2b8, #0d3b66)',
                padding: '3rem',
                borderRadius: '30px',
                color: 'white'
              }}
            >
              <h2 className="fw-bold mb-3">Start Your Civil Service Journey!</h2>
              <p className="mb-4 opacity-90">Join thousands of successful candidates who prepared with us.</p>
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

export default CivilService;