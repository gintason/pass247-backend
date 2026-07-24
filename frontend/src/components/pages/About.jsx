import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import aboutImage from '../../assets/senior1.jpeg';
import heroBg from '../../assets/slider2.png';

const About = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const features = [
    'Expert Interview Tips & Strategies',
    'Commonly Asked Questions & Winning Answers',
    'Resume & Cover Letter Guidance (TEMPLATES)',
    'Improving Typing Skills',
    'Industry-Specific Insights',
    'Mock Interviews & Real-Life Success Stories'
  ];

  const stats = [
    { value: '10K+', label: 'Active Users', delay: 100 },
    { value: '5K+', label: 'Interview Questions', delay: 200 },
    { value: '98%', label: 'Success Rate', delay: 300 },
    { value: '24/7', label: 'Support', delay: 400 }
  ];

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow-x: hidden !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }

        :root {
          --primary: #4400ff; --primary-dark: #3300cc; --primary-light: #6a4cff;
          --secondary: #ffc100; --secondary-dark: #e6ae00; --secondary-light: #ffd700;
          --dark: #1a1a1a; --gray: #6c757d; --light: #f8f9fa; --white: #ffffff;
        }

        /* ===== HERO SECTION WITH BACKGROUND IMAGE ===== */
        .about-hero-section {
          position: relative !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          min-height: 550px !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
        }

        /* Background Image - faded to the left */
        .hero-bg-image {
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          z-index: 0 !important;
          mask-image: linear-gradient(to left, black 20%, black 60%, transparent 100%) !important;
          -webkit-mask-image: linear-gradient(to left, black 20%, black 60%, transparent 100%) !important;
        }

        /* Gradient Overlay */
        .hero-gradient-overlay {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.9) 0%, rgba(68, 0, 255, 0.75) 50%, rgba(0, 0, 0, 0.3) 100%) !important;
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
          max-width: 600px !important;
        }

        .about-hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem) !important;
          font-weight: 800 !important;
          color: #fff !important;
          margin-bottom: 1.5rem !important;
          line-height: 1.2 !important;
        }

        .about-hero-title span {
          color: var(--secondary) !important;
        }

        .about-hero-subtitle {
          font-size: clamp(1rem, 1.5vw, 1.2rem) !important;
          color: rgba(255, 255, 255, 0.95) !important;
          line-height: 1.6 !important;
          margin-bottom: 2rem !important;
        }

        .hero-buttons {
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
          transition: all 0.3s ease !important;
          text-decoration: none !important;
        }

        .btn-hero-primary:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 25px rgba(255, 193, 0, 0.3) !important;
        }

        .btn-hero-secondary {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          padding: 1rem 2rem !important;
          background: transparent !important;
          color: #fff !important;
          border: 2px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 50px !important;
          font-weight: 600 !important;
          font-size: 1rem !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          text-decoration: none !important;
        }

        .btn-hero-secondary:hover {
          border-color: var(--secondary) !important;
          color: var(--secondary) !important;
          transform: translateY(-3px) !important;
        }

        /* ===== MAIN CONTENT SECTION ===== */
        .about-main-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: #ffffff;
          padding: 5rem 2rem !important;
        }

        .about-main-container { max-width: 1200px !important; margin: 0 auto !important; }

        .about-content-title {
          font-size: 2.5rem !important; font-weight: 800 !important;
          color: var(--primary) !important; margin-bottom: 1.5rem !important;
          position: relative !important; display: inline-block !important;
        }

        .about-content-title::after {
          content: '' !important; position: absolute !important; bottom: -10px !important;
          left: 0 !important; width: 80px !important; height: 4px !important;
          background: linear-gradient(90deg, var(--primary), var(--secondary)) !important; border-radius: 2px !important;
        }

        .about-lead-text { font-size: 1.1rem !important; line-height: 1.6 !important; color: #495057 !important; margin-bottom: 1.5rem !important; }

        .features-list-title { font-size: 1.25rem !important; font-weight: 700 !important; margin-bottom: 1.5rem !important; color: var(--dark) !important; }

        .feature-item { display: flex !important; align-items: center !important; margin-bottom: 1rem !important; transition: transform 0.3s ease !important; }
        .feature-item:hover { transform: translateX(10px) !important; }
        .feature-icon { margin-right: 1rem !important; }
        .feature-icon i { font-size: 1.5rem !important; color: var(--secondary) !important; }
        .feature-text { color: #6c757d !important; font-size: 1rem !important; }
        .about-description { margin-top: 1.5rem !important; color: #6c757d !important; line-height: 1.6 !important; }

        .cta-buttons { margin-top: 2rem !important; display: flex; gap: 1rem; flex-wrap: wrap; }

        .btn-primary-custom {
          display: inline-flex !important; align-items: center !important; gap: 0.5rem !important;
          padding: 0.875rem 2rem !important; background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important;
          color: #fff !important; border: none !important; border-radius: 50px !important;
          font-weight: 600 !important; text-decoration: none !important; transition: all 0.3s ease !important;
        }
        .btn-primary-custom:hover { transform: translateY(-2px) !important; box-shadow: 0 5px 15px rgba(68,0,255,0.3) !important; }

        .btn-outline-custom {
          display: inline-flex !important; align-items: center !important; gap: 0.5rem !important;
          padding: 0.875rem 2rem !important; background: transparent !important;
          color: var(--primary) !important; border: 2px solid var(--primary) !important;
          border-radius: 50px !important; font-weight: 600 !important; text-decoration: none !important; transition: all 0.3s ease !important;
        }
        .btn-outline-custom:hover { background: var(--primary) !important; color: #fff !important; transform: translateY(-2px) !important; }

        .about-image { max-width: 100% !important; height: auto !important; border-radius: 20px !important; box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important; }
        .about-image-wrapper { text-align: center !important; }

        /* ===== STATS SECTION ===== */
        .about-stats-section {
          width: 100vw !important; margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 5rem 2rem !important;
        }

        .about-stats-container { max-width: 1200px !important; margin: 0 auto !important; }
        .stats-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important; gap: 2rem !important; }

        .stat-card {
          text-align: center !important; padding: 2rem !important; background: #fff !important;
          border-radius: 20px !important; transition: all 0.3s ease !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05) !important; position: relative; overflow: hidden;
        }
        .stat-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #4400ff, #ffc100); transform: scaleX(0); transition: transform 0.3s ease;
        }
        .stat-card:hover::before { transform: scaleX(1); }
        .stat-card:hover { transform: translateY(-8px) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important; }
        .stat-value { font-size: 2.5rem !important; font-weight: 800 !important; color: var(--primary) !important; margin-bottom: 0.5rem !important; }
        .stat-label { font-size: 1rem !important; color: #6c757d !important; font-weight: 500 !important; }

        /* ===== MISSION & VISION ===== */
        .about-mission-section {
          width: 100vw !important; margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important; background: #ffffff; padding: 5rem 2rem !important;
        }

        .about-mission-container { max-width: 1200px !important; margin: 0 auto !important; }
        .mission-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)) !important; gap: 2rem !important; }

        .mission-card {
          background: #fff !important; border-radius: 24px !important; padding: 2.5rem !important;
          text-align: center !important; transition: all 0.3s ease !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05) !important; border: 1px solid rgba(0,0,0,0.05) !important;
        }
        .mission-card:hover { transform: translateY(-8px) !important; box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important; }
        .mission-icon {
          width: 80px; height: 80px; margin: 0 auto 1.5rem;
          background: linear-gradient(135deg, rgba(68,0,255,0.1), rgba(255,193,0,0.1));
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .mission-icon i { font-size: 2.5rem; color: var(--primary); }
        .mission-title { font-size: 1.75rem; font-weight: 700; color: var(--dark); margin-bottom: 1rem; }
        .mission-text { color: #6c757d; line-height: 1.6; font-size: 1rem; }

        @media (max-width: 991px) {
          .hero-text-content { max-width: 100% !important; }
          .about-content-title { font-size: 2rem !important; }
        }
        @media (max-width: 768px) {
          .about-hero-section { min-height: 400px !important; }
          .hero-content { padding: 0 1.5rem !important; }
          .about-main-section, .about-stats-section, .about-mission-section { padding: 3rem 1rem !important; }
          .about-content-title { font-size: 1.75rem !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .mission-grid { grid-template-columns: 1fr !important; }
          .cta-buttons { flex-direction: column; }
          .hero-bg-image {
            mask-image: linear-gradient(to bottom, black 0%, black 40%, transparent 100%) !important;
            -webkit-mask-image: linear-gradient(to bottom, black 0%, black 40%, transparent 100%) !important;
          }
          .hero-gradient-overlay {
            background: linear-gradient(135deg, rgba(68,0,255,0.95) 0%, rgba(68,0,255,0.85) 100%) !important;
          }
        }
        @media (max-width: 576px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Hero Section with Background Image */}
      <section className="about-hero-section">
        <img src={heroBg} alt="About PAS24/7" className="hero-bg-image" />
        <div className="hero-gradient-overlay"></div>
        
        <div className="hero-content">
          <div className="hero-text-content">
            <motion.h1 
              className="about-hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              About <span>PAS24/7</span>
            </motion.h1>
            <motion.p 
              className="about-hero-subtitle"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Unlock Opportunities, Elevate Careers – Your Ultimate Interview Hub!
            </motion.p>
            <motion.div 
              className="hero-buttons"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <a href="/register" className="btn-hero-primary">
                Get Started <i className="bi bi-arrow-right"></i>
              </a>
              <a href="/contact" className="btn-hero-secondary">
                Contact Us
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="about-main-section">
        <div className="about-main-container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6" data-aos="fade-right">
              <div className="about-content">
                <h2 className="about-content-title">Welcome to PAS24-7</h2>
                <p className="about-lead-text">
                  The go-to platform for interview success! Whether you're a job seeker preparing for your big break, 
                  a recruiter, or an employer streamlining the hiring process, we've got you covered.
                </p>
                <div className="features-list">
                  <h5 className="features-list-title">What We Offer:</h5>
                  {features.map((feature, index) => (
                    <motion.div key={index} className="feature-item" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
                      <div className="feature-icon"><i className="bi bi-check-circle-fill"></i></div>
                      <span className="feature-text">{feature}</span>
                    </motion.div>
                  ))}
                </div>
                <p className="about-description">
                  From fresh graduates to seasoned professionals, we help you navigate the interview process with confidence. 
                  Ace your next interview and land your dream job with <strong>PAS24-7</strong>, where preparation meets opportunity!
                </p>
                <div className="cta-buttons">
                  <a href="/register" className="btn-primary-custom">Get Started <i className="bi bi-arrow-right ms-2"></i></a>
                  <a href="/contact" className="btn-outline-custom">Contact Us</a>
                </div>
              </div>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <div className="about-image-wrapper">
                <img src={aboutImage} alt="About PAS24/7" className="about-image"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/600x400?text=About+Us'; }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats-section">
        <div className="about-stats-container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card" data-aos="zoom-in" data-aos-delay={stat.delay}>
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-mission-section">
        <div className="about-mission-container">
          <div className="mission-grid">
            <div className="mission-card" data-aos="fade-up">
              <div className="mission-icon"><i className="bi bi-bullseye"></i></div>
              <h3 className="mission-title">Our Mission</h3>
              <p className="mission-text">
                To empower individuals with the knowledge, skills, and confidence needed to excel in interviews 
                and secure their dream jobs, making quality interview preparation accessible to everyone.
              </p>
            </div>
            <div className="mission-card" data-aos="fade-up" data-aos-delay="200">
              <div className="mission-icon"><i className="bi bi-eye"></i></div>
              <h3 className="mission-title">Our Vision</h3>
              <p className="mission-text">
                To become Africa's leading interview preparation platform, recognized for transforming job seekers 
                into confident, successful professionals through innovative learning solutions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;