import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const Aptitude = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(false);
  }, []);

  const topicsList = [
    {
      id: 'verbal',
      title: 'Verbal Reasoning',
      icon: 'bi-chat-text-fill',
      description: 'Enhance your vocabulary, comprehension and logical reasoning skills',
      color: '#4400ff',
      questions: 250,
      duration: '30 mins',
      difficulty: 'Medium'
    },
    {
      id: 'numerical',
      title: 'Numerical Reasoning',
      icon: 'bi-calculator-fill',
      description: 'Master calculations, data interpretation and mathematical problems',
      color: '#28a745',
      questions: 300,
      duration: '45 mins',
      difficulty: 'Hard'
    },
    {
      id: 'abstract',
      title: 'Abstract Reasoning',
      icon: 'bi-puzzle-fill',
      description: 'Develop pattern recognition and logical thinking abilities',
      color: '#ffc100',
      questions: 200,
      duration: '25 mins',
      difficulty: 'Medium'
    },
    {
      id: 'time-management',
      title: 'Time Management',
      icon: 'bi-clock-fill',
      description: 'Learn strategies to manage time effectively during tests',
      color: '#17a2b8',
      questions: 150,
      duration: '20 mins',
      difficulty: 'Easy'
    }
  ];

  const handleStartPractice = (topic) => {
    if (!user) {
      navigate('/login?redirect=/careers/aptitude');
      return;
    }
    // Navigate to exams page to use the exam system for practice
    navigate('/exams');
    toast.info(`Select a question bank to practice ${topic.title}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="aptitude-page">
      <style>
        {`
          *:focus, *:focus-visible, *:active, button:focus, button:focus-visible,
          a:focus, a:focus-visible {
            outline: none !important;
            box-shadow: none !important;
          }

          .aptitude-hero {
            background: linear-gradient(135deg, #1a0533 0%, #4400ff 50%, #6a4cff 100%);
            position: relative;
            padding: 6rem 2rem 8rem 2rem;
            overflow: hidden;
            margin-bottom: 0;
          }

          .aptitude-hero .hero-icon {
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

          .aptitude-hero .hero-icon i {
            font-size: 3rem;
            color: white;
          }

          .aptitude-hero .hero-title {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            color: white;
            margin-bottom: 1rem;
          }

          .aptitude-hero .hero-subtitle {
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

          .topics-section {
            padding: 4rem 0;
            background: #f8f9fa;
          }

          .topic-card {
            background: white;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          .topic-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }

          .topic-header {
            padding: 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-bottom: 1px solid #f0f0f0;
          }

          .topic-icon {
            width: 55px;
            height: 55px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.6rem;
          }

          .topic-body {
            padding: 1.25rem 1.5rem;
            flex: 1;
          }

          .topic-body h3 {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }

          .topic-body p {
            color: #6c757d;
            font-size: 0.9rem;
            line-height: 1.6;
          }

          .topic-stats {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
          }

          .stat-badge {
            background: #f8f9fa;
            padding: 0.4rem 0.8rem;
            border-radius: 50px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #495057;
          }

          .topic-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid #f0f0f0;
          }

          .start-topic-btn {
            width: 100%;
            padding: 0.7rem;
            border: none;
            border-radius: 50px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .start-topic-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
          }

          @media (max-width: 768px) {
            .aptitude-hero {
              padding: 4rem 1rem 6rem 1rem;
            }
            .aptitude-hero .hero-icon {
              width: 70px;
              height: 70px;
            }
            .aptitude-hero .hero-icon i {
              font-size: 2rem;
            }
          }
        `}
      </style>

      {/* Hero Section */}
      <section className="aptitude-hero">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="hero-icon mb-4">
                  <i className="bi bi-lightbulb-fill"></i>
                </div>
                <h1 className="hero-title">Aptitude Tests</h1>
                <p className="hero-subtitle">
                  Master verbal, numerical and abstract reasoning with our comprehensive practice tests designed to boost your confidence and performance.
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

      {/* Topics Section */}
      <section className="topics-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2" style={{ fontSize: '2rem' }}>Practice Topics</h2>
            <p className="text-muted">Choose a topic to start practicing</p>
          </div>
          <div className="row g-4">
            {topicsList.map((topic, index) => (
              <div key={topic.id} className="col-md-6 col-lg-3">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="topic-card">
                    <div className="topic-header">
                      <div className="topic-icon" style={{ background: `${topic.color}20`, color: topic.color }}>
                        <i className={`bi ${topic.icon}`}></i>
                      </div>
                    </div>
                    <div className="topic-body">
                      <h3>{topic.title}</h3>
                      <p>{topic.description}</p>
                      <div className="topic-stats">
                        <span className="stat-badge">
                          <i className="bi bi-question-circle me-1"></i>
                          {topic.questions} Questions
                        </span>
                        <span className="stat-badge">
                          <i className="bi bi-clock me-1"></i>
                          {topic.duration}
                        </span>
                        <span className="stat-badge">
                          <i className="bi bi-speedometer2 me-1"></i>
                          {topic.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="topic-footer">
                      <button 
                        className="start-topic-btn"
                        style={{ background: topic.color }}
                        onClick={() => handleStartPractice(topic)}
                      >
                        Start Practice <i className="bi bi-arrow-right ms-2"></i>
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
                background: 'linear-gradient(135deg, #4400ff, #6a4cff)',
                padding: '3rem',
                borderRadius: '30px',
                color: 'white'
              }}
            >
              <h2 className="fw-bold mb-3">Ready to Ace Your Aptitude Test?</h2>
              <p className="mb-4 opacity-90">Sign up now and start practicing with our comprehensive test materials!</p>
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

export default Aptitude;