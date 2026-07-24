import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const HowItWorks = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const steps = [
    {
      icon: 'bi-person-plus-fill',
      title: 'SIGN UP',
      description: 'Visit www.pass247.net and sign up. You must register to get access.',
      color: '#4400ff'
    },
    {
      icon: 'bi-credit-card-fill',
      title: 'SUBSCRIPTION',
      description: 'You must subscribe to get full access to all our interview questions and answers.',
      color: '#ffc100'
    },
    {
      icon: 'bi-clipboard-check-fill',
      title: 'TAKE THE INTERVIEW & PASS',
      description: 'The sole purpose of this platform is that all our subscribers pass their interviews. Take the first step now!',
      color: '#4400ff'
    }
  ];

  const benefits = [
    {
      icon: 'bi-clock-history',
      title: '24/7 Access',
      description: 'Practice anytime, anywhere with our online platform'
    },
    {
      icon: 'bi-book-half',
      title: 'Comprehensive Library',
      description: 'Thousands of interview questions with expert answers'
    },
    {
      icon: 'bi-graph-up-arrow',
      title: 'Track Progress',
      description: 'Monitor your improvement with detailed analytics'
    },
    {
      icon: 'bi-award',
      title: 'Certificate',
      description: 'Get certified after completing your interview preparation'
    }
  ];

  return (
    <div className="how-it-works-page">
      {/* Hero Section */}
      <section className="hero-section py-5" style={{ 
        background: 'linear-gradient(135deg, #4400ff 0%, #6a4cff 100%)',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container text-center text-white">
          <motion.h1 
            className="display-3 fw-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            How It <span style={{ color: '#ffc100' }}>Works</span>
          </motion.h1>
          <motion.p 
            className="lead mx-auto"
            style={{ maxWidth: '700px' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Get started with PAS24/7 in three simple steps and ace your interviews with confidence
          </motion.p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section py-5">
        <div className="container">
          <div className="row justify-content-center g-4">
            {steps.map((step, index) => (
              <div className="col-md-4" key={index}>
                <motion.div 
                  className="step-card text-center p-4 h-100"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="step-number mb-4">
                    <span className="badge rounded-circle p-3" style={{ 
                      background: step.color,
                      width: '60px',
                      height: '60px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="icon-container mb-4">
                    <i className={`bi ${step.icon}`} style={{ fontSize: '4rem', color: step.color }}></i>
                  </div>
                  <h4 className="fw-bold mb-3" style={{ color: '#4400ff' }}>{step.title}</h4>
                  <p className="text-muted">{step.description}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Why Choose PAS24/7?</h2>
            <p className="lead text-muted">Everything you need to succeed in your interview journey</p>
          </div>

          <div className="row g-4">
            {benefits.map((benefit, index) => (
              <div className="col-md-3 col-6" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="benefit-card text-center p-4 bg-white rounded-4 shadow-sm">
                  <div className="benefit-icon mb-3">
                    <i className={`bi ${benefit.icon}`} style={{ fontSize: '2.5rem', color: '#ffc100' }}></i>
                  </div>
                  <h6 className="fw-bold mb-2">{benefit.title}</h6>
                  <small className="text-muted">{benefit.description}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Frequently Asked Questions</h2>
            <p className="lead text-muted">Got questions? We've got answers</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                <div className="accordion-item mb-3 border-0 shadow-sm" data-aos="fade-up">
                  <h2 className="accordion-header">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                      <strong>How do I get started?</strong>
                    </button>
                  </h2>
                  <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Simply create a free account on our platform. Once registered, you can access free trial questions 
                      for various subjects. When you're ready for full access, choose a subscription plan that suits you.
                    </div>
                  </div>
                </div>

                <div className="accordion-item mb-3 border-0 shadow-sm" data-aos="fade-up" data-aos-delay="100">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                      <strong>What payment methods do you accept?</strong>
                    </button>
                  </h2>
                  <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      We accept various payment methods including card payments, bank transfers, and mobile money. 
                      All payments are processed securely through Paystack.
                    </div>
                  </div>
                </div>

                <div className="accordion-item mb-3 border-0 shadow-sm" data-aos="fade-up" data-aos-delay="200">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                      <strong>Can I cancel my subscription?</strong>
                    </button>
                  </h2>
                  <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Yes, you can cancel your subscription at any time. Your access will continue until the end of 
                      your billing period.
                    </div>
                  </div>
                </div>

                <div className="accordion-item mb-3 border-0 shadow-sm" data-aos="fade-up" data-aos-delay="300">
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                      <strong>Are the questions regularly updated?</strong>
                    </button>
                  </h2>
                  <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Absolutely! We regularly update our question bank to reflect current interview trends and 
                      industry requirements.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5" style={{ background: 'linear-gradient(135deg, #ffc100 0%, #ffd700 100%)' }}>
        <div className="container text-center">
          <h2 className="display-6 fw-bold mb-4" style={{ color: '#4400ff' }}>Ready to Start Your Journey?</h2>
          <p className="lead mb-4">Join thousands of successful candidates who passed their interviews with us</p>
          <Link to="/register" className="btn btn-primary btn-lg px-5 py-3 fw-bold">
            Create Your Account <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>

      {/* Custom Styles */}
      <style>
        {`
          .step-card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
          }
          .step-card:hover {
            transform: translateY(-10px);
          }
          .benefit-card {
            transition: all 0.3s ease;
            cursor: default;
          }
          .benefit-card:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(68, 0, 255, 0.2) !important;
          }
          .accordion-button:not(.collapsed) {
            background-color: #4400ff;
            color: white;
          }
          .accordion-button:focus {
            box-shadow: none;
            border-color: rgba(68, 0, 255, 0.2);
          }
        `}
      </style>
    </div>
  );
};

export default HowItWorks;