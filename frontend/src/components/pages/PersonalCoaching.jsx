import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const PersonalCoaching = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const coachingBenefits = [
    {
      icon: 'bi-person-check',
      title: 'Personalized Attention',
      description: 'One-on-one coaching tailored to your specific needs, goals, and learning style'
    },
    {
      icon: 'bi-calendar-check',
      title: 'Flexible Scheduling',
      description: 'Schedule sessions at your convenience, including evenings and weekends'
    },
    {
      icon: 'bi-graph-up-arrow',
      title: 'Measurable Progress',
      description: 'Track your improvement with regular assessments and progress reports'
    },
    {
      icon: 'bi-chat-square-text',
      title: 'Ongoing Support',
      description: 'Get continuous support via WhatsApp and email between sessions'
    },
    {
      icon: 'bi-file-person',
      title: 'Personal Branding',
      description: 'Develop your personal brand and professional presence'
    },
    {
      icon: 'bi-award',
      title: 'Certification',
      description: 'Receive a certificate of completion after finishing your coaching program'
    }
  ];

  const coachingPrograms = [
    {
      title: 'Career Launch',
      duration: '4 weeks',
      price: '₦80,000',
      description: 'Perfect for fresh graduates and early career professionals',
      features: [
        '4 coaching sessions',
        'Resume & cover letter review',
        'LinkedIn profile optimization',
        'Interview preparation basics',
        'Career path guidance'
      ]
    },
    {
      title: 'Executive Excellence',
      duration: '8 weeks',
      price: '₦150,000',
      description: 'For mid to senior-level professionals seeking advancement',
      features: [
        '8 coaching sessions',
        'Executive presence training',
        'Leadership communication',
        'Strategic career planning',
        'Negotiation strategies',
        'Personal brand development'
      ],
      popular: true
    },
    {
      title: 'Mastery Program',
      duration: '12 weeks',
      price: '₦220,000',
      description: 'Comprehensive coaching for career transformation',
      features: [
        '12 coaching sessions',
        'All Executive Excellence features',
        'Industry networking introduction',
        'Mentorship matching',
        'Post-program support (3 months)',
        'Priority job opportunity alerts'
      ]
    }
  ];

  const coachingApproach = [
    {
      step: 1,
      title: 'Discovery Call',
      description: 'We start with a free 30-minute consultation to understand your goals and challenges'
    },
    {
      step: 2,
      title: 'Personalized Plan',
      description: 'I create a custom coaching plan tailored to your specific needs and timeline'
    },
    {
      step: 3,
      title: 'Weekly Sessions',
      description: 'Regular 1-on-1 sessions focused on skill development and goal achievement'
    },
    {
      step: 4,
      title: 'Ongoing Support',
      description: 'Continuous guidance and accountability between sessions to keep you on track'
    }
  ];

  const clientResults = [
    { number: '500+', label: 'Clients Coached' },
    { number: '95%', label: 'Success Rate' },
    { number: '30+', label: 'Industries' },
    { number: '200%', label: 'Avg. Salary Increase' }
  ];

  const testimonials = [
    {
      name: 'Amara Nwachukwu',
      role: 'Product Manager at Paystack',
      quote: 'The personal coaching transformed my career. My coach helped me identify my strengths and position myself for a leadership role.',
      rating: 5
    },
    {
      name: 'Tunde Bakare',
      role: 'Senior Developer at Andela',
      quote: 'I was stuck in my career for years. After 3 months of coaching, I got promoted and received a 40% salary increase.',
      rating: 5
    },
    {
      name: 'Funmi Adeyemi',
      role: 'Marketing Director',
      quote: 'The executive presence training was game-changing. I now confidently lead teams and present to C-level executives.',
      rating: 5
    }
  ];

  return (
    <div className="personal-coaching-page">
      {/* Hero Section */}
      <section className="hero-section py-5" style={{ 
        background: 'linear-gradient(135deg, #4400ff 0%, #00a3ff 100%)',
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
                Personal <span style={{ color: '#ffc100' }}>Coaching</span>
              </motion.h1>
              <motion.p 
                className="lead mb-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Unlock your full potential with personalized 1-on-1 coaching. 
                Whether you're just starting out or aiming for the C-suite, 
                I'll help you get there faster.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link to="/contact" className="btn btn-warning btn-lg px-5 py-3 me-3">
                  Schedule Free Call <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <Link to="#programs" className="btn btn-outline-light btn-lg px-5 py-3">
                  View Programs
                </Link>
              </motion.div>
            </div>
            <div className="col-lg-6 mt-4 mt-lg-0" data-aos="fade-left">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Personal Coaching" 
                className="img-fluid rounded-4 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            {clientResults.map((stat, index) => (
              <div className="col-md-3 col-6" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="text-center">
                  <h3 className="display-4 fw-bold text-primary">{stat.number}</h3>
                  <p className="text-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Why Personal Coaching?</h2>
            <p className="lead text-muted">Experience the difference that personalized attention makes</p>
          </div>

          <div className="row g-4">
            {coachingBenefits.map((benefit, index) => (
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
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="feature-icon me-3">
                        <i className={`bi ${benefit.icon}`} style={{ fontSize: '2rem', color: '#4400ff' }}></i>
                      </div>
                      <h5 className="fw-bold mb-0">{benefit.title}</h5>
                    </div>
                    <p className="text-muted mb-0">{benefit.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching Approach */}
      <section className="approach-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>My Coaching Approach</h2>
            <p className="lead text-muted">A proven methodology for guaranteed results</p>
          </div>

          <div className="row g-4">
            {coachingApproach.map((step, index) => (
              <div className="col-md-3" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="text-center">
                  <div className="step-circle bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                       style={{ width: '80px', height: '80px' }}>
                    <span className="h3 mb-0">{step.step}</span>
                  </div>
                  <h5 className="fw-bold mt-3">{step.title}</h5>
                  <p className="text-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaching Programs */}
      <section id="programs" className="programs-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Coaching Programs</h2>
            <p className="lead text-muted">Choose the program that aligns with your goals</p>
          </div>

          <div className="row g-4 justify-content-center">
            {coachingPrograms.map((program, index) => (
              <div className="col-lg-4 col-md-6" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className={`card h-100 border-0 shadow-lg ${program.popular ? 'popular-program' : ''}`}>
                  {program.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <span className="badge bg-warning text-dark px-3 py-2">
                        <i className="bi bi-star-fill me-1"></i> Most Popular
                      </span>
                    </div>
                  )}
                  <div className="card-body p-4">
                    <h4 className="fw-bold text-center mb-2">{program.title}</h4>
                    <p className="text-muted text-center mb-3">{program.duration}</p>
                    <div className="text-center mb-4">
                      <span className="display-5 fw-bold text-primary">{program.price}</span>
                    </div>
                    <p className="text-center text-muted small mb-4">{program.description}</p>
                    <ul className="list-unstyled mb-4">
                      {program.features.map((feature, idx) => (
                        <li key={idx} className="mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link to="/contact" className="btn btn-primary w-100 py-2">
                      Enroll Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>What My Clients Say</h2>
            <p className="lead text-muted">Real results from real people</p>
          </div>

          <div className="row g-4">
            {testimonials.map((testimonial, index) => (
              <div className="col-md-4" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="card h-100 border-0 shadow-lg">
                  <div className="card-body p-4">
                    <div className="text-warning mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <i key={i} className="bi bi-star-fill"></i>
                      ))}
                    </div>
                    <p className="text-muted mb-4">"{testimonial.quote}"</p>
                    <div>
                      <h6 className="fw-bold mb-1">{testimonial.name}</h6>
                      <small className="text-muted">{testimonial.role}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="cta-section py-5" style={{ background: 'linear-gradient(135deg, #4400ff 0%, #00a3ff 100%)' }}>
        <div className="container text-center">
          <h2 className="display-6 fw-bold text-white mb-4">Ready to Transform Your Career?</h2>
          <p className="lead text-white mb-4">Book your free 30-minute discovery call today</p>
          <Link to="/contact" className="btn btn-warning btn-lg px-5 py-3 fw-bold">
            Schedule Your Free Call <i className="bi bi-arrow-right ms-2"></i>
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
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(68, 0, 255, 0.15) !important;
          }
          .popular-program {
            transform: scale(1.05);
            border: 2px solid #ffc100;
            position: relative;
            z-index: 1;
          }
          .step-circle {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          .step-circle:hover {
            transform: scale(1.1);
            box-shadow: 0 10px 20px rgba(68, 0, 255, 0.3);
          }
          @media (max-width: 768px) {
            .popular-program {
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default PersonalCoaching;