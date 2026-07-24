import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const InterviewMentoring = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const mentoringFeatures = [
    {
      icon: 'bi-person-badge',
      title: '1-on-1 Coaching',
      description: 'Personalized sessions with industry experts who have conducted hundreds of interviews'
    },
    {
      icon: 'bi-camera-video',
      title: 'Mock Interviews',
      description: 'Realistic interview simulations with immediate feedback and constructive criticism'
    },
    {
      icon: 'bi-file-text',
      title: 'Resume Review',
      description: 'Expert review of your CV and cover letter to make you stand out'
    },
    {
      icon: 'bi-chat-dots',
      title: 'Communication Skills',
      description: 'Improve your verbal and non-verbal communication for maximum impact'
    },
    {
      icon: 'bi-graph-up',
      title: 'Progress Tracking',
      description: 'Track your improvement with detailed feedback after each session'
    },
    {
      icon: 'bi-star',
      title: 'Industry Insights',
      description: 'Get insider knowledge about specific industries and companies'
    }
  ];

  const mentors = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Senior HR Director',
      company: 'Tech Corp International',
      experience: '15+ years',
      image: 'https://via.placeholder.com/150',
      specialties: ['Tech Interviews', 'Leadership Roles', 'Career Strategy']
    },
    {
      name: 'Michael Adebayo',
      role: 'Career Coach',
      company: 'Top 100 Companies',
      experience: '12+ years',
      image: 'https://via.placeholder.com/150',
      specialties: ['Banking & Finance', 'Executive Search', 'Negotiation']
    },
    {
      name: 'Prof. Elizabeth Okonkwo',
      role: 'Academic Mentor',
      company: 'University of Lagos',
      experience: '20+ years',
      image: 'https://via.placeholder.com/150',
      specialties: ['Academic Positions', 'Research Roles', 'Teaching Interviews']
    }
  ];

  const packages = [
    {
      name: 'Starter',
      sessions: 3,
      price: '₦50,000',
      features: [
        '3 mentoring sessions',
        'Resume review',
        'Basic feedback',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Professional',
      sessions: 6,
      price: '₦90,000',
      features: [
        '6 mentoring sessions',
        'Comprehensive resume review',
        'Mock interviews (2)',
        'Priority email support',
        'Career strategy session'
      ],
      popular: true
    },
    {
      name: 'Premium',
      sessions: 12,
      price: '₦150,000',
      features: [
        '12 mentoring sessions',
        'Unlimited resume revisions',
        'Mock interviews (4)',
        '24/7 WhatsApp support',
        'LinkedIn profile optimization',
        'Salary negotiation coaching'
      ],
      popular: false
    }
  ];

  const successStories = [
    {
      name: 'Oluwaseun A.',
      role: 'Software Engineer at Google',
      image: 'https://via.placeholder.com/100',
      quote: 'The mentoring sessions were transformative. My mentor helped me prepare for technical interviews and negotiate my offer.'
    },
    {
      name: 'Blessing E.',
      role: 'Banking Executive at First Bank',
      image: 'https://via.placeholder.com/100',
      quote: 'I was struggling with interview anxiety. After 6 sessions, I confidently landed my dream role in banking.'
    },
    {
      name: 'Chinedu O.',
      role: 'PhD Candidate, Cambridge',
      image: 'https://via.placeholder.com/100',
      quote: 'The academic interview preparation was exceptional. My mentor guided me through every step of the process.'
    }
  ];

  return (
    <div className="interview-mentoring-page">
      {/* Hero Section */}
      <section className="hero-section py-5" style={{ 
        background: 'linear-gradient(135deg, #4400ff 0%, #6a4cff 100%)',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 text-white" data-aos="fade-right">
              <motion.h1 
                className="display-3 fw-bold mb-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                Interview <span style={{ color: '#ffc100' }}>Mentoring</span>
              </motion.h1>
              <motion.p 
                className="lead mb-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Get personalized guidance from industry experts who have been where you want to go. 
                Transform your interview skills and land your dream job.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link to="/contact" className="btn btn-warning btn-lg px-5 py-3 me-3">
                  Book a Session <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <Link to="/payment-plans" className="btn btn-outline-light btn-lg px-5 py-3">
                  View Packages
                </Link>
              </motion.div>
            </div>
            <div className="col-lg-6 mt-4 mt-lg-0" data-aos="fade-left">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Interview Mentoring" 
                className="img-fluid rounded-4 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Why Choose Our Mentoring?</h2>
            <p className="lead text-muted">Comprehensive support tailored to your needs</p>
          </div>

          <div className="row g-4">
            {mentoringFeatures.map((feature, index) => (
              <motion.div 
                key={index}
                className="col-md-6 col-lg-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
              >
                <div className="card h-100 border-0 shadow-lg hover-card">
                  <div className="card-body text-center p-4">
                    <div className="feature-icon mb-4">
                      <i className={`bi ${feature.icon}`} style={{ fontSize: '3rem', color: '#4400ff' }}></i>
                    </div>
                    <h5 className="fw-bold mb-3">{feature.title}</h5>
                    <p className="text-muted mb-0">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>How It Works</h2>
            <p className="lead text-muted">Your journey to interview success in 4 simple steps</p>
          </div>

          <div className="row g-4">
            {[
              { step: 1, title: 'Choose Your Package', desc: 'Select the mentoring package that fits your goals and budget' },
              { step: 2, title: 'Get Matched', desc: 'We pair you with a mentor who specializes in your industry' },
              { step: 3, title: 'Attend Sessions', desc: 'Meet with your mentor for personalized coaching and mock interviews' },
              { step: 4, title: 'Land Your Dream Job', desc: 'Apply your new skills and confidence to ace your interviews' }
            ].map((item, index) => (
              <div className="col-md-3" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="text-center">
                  <div className="step-number bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '60px', height: '60px' }}>
                    <span className="h3 mb-0">{item.step}</span>
                  </div>
                  <h5 className="fw-bold mt-3">{item.title}</h5>
                  <p className="text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Our Mentors */}
      <section className="mentors-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Meet Our Expert Mentors</h2>
            <p className="lead text-muted">Learn from the best in the industry</p>
          </div>

          <div className="row g-4">
            {mentors.map((mentor, index) => (
              <div className="col-md-4" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="card h-100 border-0 shadow-lg hover-card">
                  <div className="card-body text-center p-4">
                    <img 
                      src={mentor.image} 
                      alt={mentor.name}
                      className="rounded-circle mb-3"
                      width="120"
                      height="120"
                      style={{ objectFit: 'cover' }}
                    />
                    <h5 className="fw-bold mb-1">{mentor.name}</h5>
                    <p className="text-primary mb-1">{mentor.role}</p>
                    <p className="text-muted small mb-2">{mentor.company} • {mentor.experience}</p>
                    <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
                      {mentor.specialties.map((spec, idx) => (
                        <span key={idx} className="badge bg-light text-dark px-2 py-1">
                          {spec}
                        </span>
                      ))}
                    </div>
                    <button className="btn btn-outline-primary btn-sm">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="pricing-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Mentoring Packages</h2>
            <p className="lead text-muted">Choose the plan that works for you</p>
          </div>

          <div className="row g-4 justify-content-center">
            {packages.map((pkg, index) => (
              <div className="col-lg-4 col-md-6" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className={`card h-100 border-0 shadow-lg ${pkg.popular ? 'popular-plan' : ''}`}>
                  {pkg.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <span className="badge bg-warning text-dark px-3 py-2">
                        <i className="bi bi-star-fill me-1"></i> Most Popular
                      </span>
                    </div>
                  )}
                  <div className="card-body p-4">
                    <h4 className="fw-bold text-center mb-3">{pkg.name}</h4>
                    <div className="text-center mb-4">
                      <span className="display-4 fw-bold text-primary">{pkg.price}</span>
                      <p className="text-muted">for {pkg.sessions} sessions</p>
                    </div>
                    <ul className="list-unstyled mb-4">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link to="/contact" className="btn btn-primary w-100 py-2">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="testimonials-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Success Stories</h2>
            <p className="lead text-muted">Real results from real people</p>
          </div>

          <div className="row g-4">
            {successStories.map((story, index) => (
              <div className="col-md-4" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="card h-100 border-0 shadow-lg">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <img 
                        src={story.image} 
                        alt={story.name}
                        className="rounded-circle me-3"
                        width="60"
                        height="60"
                      />
                      <div>
                        <h6 className="fw-bold mb-1">{story.name}</h6>
                        <small className="text-muted">{story.role}</small>
                      </div>
                    </div>
                    <div className="text-warning mb-2">
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                      <i className="bi bi-star-fill"></i>
                    </div>
                    <p className="text-muted mb-0">"{story.quote}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Frequently Asked Questions</h2>
            <p className="lead text-muted">Everything you need to know about our mentoring program</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                {[
                  {
                    q: 'How are mentors matched with mentees?',
                    a: 'We carefully match you with a mentor based on your industry, experience level, and specific goals. You can also request a specific mentor if you prefer.'
                  },
                  {
                    q: 'Are sessions conducted online or in-person?',
                    a: 'All mentoring sessions are conducted online via video call, making it convenient for you to participate from anywhere.'
                  },
                  {
                    q: 'Can I change my mentor if I\'m not satisfied?',
                    a: 'Absolutely! Your success is our priority. If you feel the match isn\'t right, we\'ll gladly reassign you to another mentor.'
                  },
                  {
                    q: 'How long is each mentoring session?',
                    a: 'Each session typically lasts 60 minutes, but can be adjusted based on your needs and the package you choose.'
                  },
                  {
                    q: 'Do you offer a money-back guarantee?',
                    a: 'Yes, we offer a 100% satisfaction guarantee. If you\'re not happy after your first session, we\'ll refund your payment.'
                  }
                ].map((faq, index) => (
                  <div className="accordion-item mb-3 border-0 shadow-sm" key={index} data-aos="fade-up" data-aos-delay={index * 50}>
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`} 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target={`#faq${index}`}
                      >
                        <strong>{faq.q}</strong>
                      </button>
                    </h2>
                    <div id={`faq${index}`} className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`} data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5" style={{ background: 'linear-gradient(135deg, #ffc100 0%, #ffd700 100%)' }}>
        <div className="container text-center">
          <h2 className="display-6 fw-bold mb-4" style={{ color: '#4400ff' }}>Ready to Transform Your Interview Skills?</h2>
          <p className="lead mb-4">Join hundreds of successful candidates who landed their dream jobs through our mentoring program</p>
          <Link to="/contact" className="btn btn-primary btn-lg px-5 py-3 fw-bold">
            Book Your Free Consultation <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>

      {/* Custom Styles */}
      <style>
        {`
          .hover-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .hover-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(68, 0, 255, 0.2) !important;
          }
          .popular-plan {
            transform: scale(1.05);
            border: 2px solid #ffc100;
            position: relative;
            z-index: 1;
          }
          @media (max-width: 768px) {
            .popular-plan {
              transform: scale(1);
            }
          }
          .step-number {
            transition: transform 0.3s ease;
          }
          .step-number:hover {
            transform: scale(1.1);
          }
        `}
      </style>
    </div>
  );
};

export default InterviewMentoring;