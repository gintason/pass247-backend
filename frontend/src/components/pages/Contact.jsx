import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import AOS from 'aos';
import 'aos/dist/aos.css';
import contactBg from '../../assets/contact.jpg';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/interview/contact/', formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Contact form error:', error);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: 'bi-geo-alt-fill',
      title: 'Visit Us',
      details: ['No. 1 Lucky Igbenedion Drive,', 'GRA, Benin City'],
      link: null
    },
    {
      icon: 'bi-telephone-fill',
      title: 'Call Us',
      details: ['+234 807 248 3764'],
      link: 'tel:+2348072483764'
    },
    {
      icon: 'bi-envelope-fill',
      title: 'Email Us',
      details: ['info@pass247.net'],
      link: 'mailto:info@pass247.net'
    },
    {
      icon: 'bi-globe',
      title: 'Website',
      details: ['www.pass247.net'],
      link: 'https://www.pass247.net'
    }
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
        .contact-hero-section {
          position: relative !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          min-height: 500px !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
        }

        /* Background Image */
        .hero-bg-image {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          z-index: 0 !important;
          opacity: 0.98 !important;
          filter: brightness(0.6) !important;
        }

        /* Gradient Overlay */
        .hero-gradient-overlay {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.85) 0%, rgba(68, 0, 255, 0.7) 50%, rgba(0, 0, 0, 0.5) 100%) !important;
          z-index: 1 !important;
        }

        /* Pulse animation */
        .hero-gradient-overlay::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
          animation: heroPulse 8s ease-in-out infinite;
        }

        @keyframes heroPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
        }

        .contact-hero-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
          position: relative;
          z-index: 2;
          text-align: center;
          color: var(--white);
        }

        .contact-hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem) !important;
          font-weight: 800 !important;
          margin-bottom: 1.5rem !important;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3) !important;
        }

        .contact-hero-title span {
          color: var(--secondary) !important;
        }

        .contact-hero-subtitle {
          font-size: clamp(1rem, 1.5vw, 1.2rem) !important;
          max-width: 600px !important;
          margin: 0 auto !important;
          opacity: 0.95 !important;
          line-height: 1.6 !important;
          text-shadow: 0 1px 10px rgba(0, 0, 0, 0.2) !important;
        }

        /* ===== MAIN CONTENT SECTION ===== */
        .contact-main-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .contact-main-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
        }

        .contact-info-card {
          background: #ffffff !important;
          border-radius: 24px !important;
          padding: 2rem !important;
          height: 100% !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }

        .contact-info-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 20px 40px rgba(68, 0, 255, 0.1) !important;
        }

        .contact-info-title {
          font-size: 1.75rem !important;
          font-weight: 800 !important;
          color: var(--primary) !important;
          margin-bottom: 2rem !important;
          position: relative !important;
          display: inline-block !important;
        }

        .contact-info-title::after {
          content: '' !important;
          position: absolute !important;
          bottom: -8px !important;
          left: 0 !important;
          width: 50px !important;
          height: 3px !important;
          background: linear-gradient(90deg, var(--primary), var(--secondary)) !important;
          border-radius: 2px !important;
        }

        .info-item {
          display: flex !important;
          gap: 1rem !important;
          margin-bottom: 1.5rem !important;
        }

        .info-icon {
          width: 50px !important;
          height: 50px !important;
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.1), rgba(255, 193, 0, 0.1)) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
        }

        .info-icon i {
          font-size: 1.5rem !important;
          color: var(--primary) !important;
        }

        .info-content h6 {
          font-weight: 700 !important;
          margin-bottom: 0.5rem !important;
          color: var(--dark) !important;
        }

        .info-content p, .info-content a {
          color: #6c757d !important;
          margin-bottom: 0 !important;
          text-decoration: none !important;
          transition: color 0.3s ease !important;
        }

        .info-content a:hover {
          color: var(--primary) !important;
        }

        .social-section {
          margin-top: 2rem !important;
          padding-top: 1.5rem !important;
          border-top: 1px solid #e9ecef !important;
        }

        .social-title {
          font-weight: 700 !important;
          margin-bottom: 1rem !important;
          color: var(--dark) !important;
        }

        .social-links {
          display: flex !important;
          gap: 1rem !important;
        }

        .social-link {
          width: 45px !important;
          height: 45px !important;
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.1), rgba(255, 193, 0, 0.1)) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: all 0.3s ease !important;
          text-decoration: none !important;
        }

        .social-link i {
          font-size: 1.2rem !important;
          color: var(--primary) !important;
        }

        .social-link:hover {
          transform: translateY(-3px) !important;
          background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important;
        }

        .social-link:hover i {
          color: #ffffff !important;
        }

        .contact-form-card {
          background: #ffffff !important;
          border-radius: 24px !important;
          padding: 2rem !important;
          height: 100% !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }

        .contact-form-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 20px 40px rgba(68, 0, 255, 0.1) !important;
        }

        .form-title {
          font-size: 1.75rem !important;
          font-weight: 800 !important;
          color: var(--primary) !important;
          margin-bottom: 2rem !important;
          position: relative !important;
          display: inline-block !important;
        }

        .form-title::after {
          content: '' !important;
          position: absolute !important;
          bottom: -8px !important;
          left: 0 !important;
          width: 50px !important;
          height: 3px !important;
          background: linear-gradient(90deg, var(--primary), var(--secondary)) !important;
          border-radius: 2px !important;
        }

        .form-label {
          font-weight: 600 !important;
          color: var(--dark) !important;
          margin-bottom: 0.5rem !important;
        }

        .form-control-custom {
          width: 100% !important;
          padding: 0.875rem 1rem !important;
          border: 2px solid #e9ecef !important;
          border-radius: 12px !important;
          transition: all 0.3s ease !important;
          font-size: 1rem !important;
        }

        .form-control-custom:focus {
          outline: none !important;
          border-color: var(--secondary) !important;
          box-shadow: 0 0 0 3px rgba(255, 193, 0, 0.1) !important;
        }

        textarea.form-control-custom {
          resize: vertical !important;
          min-height: 120px !important;
        }

        .submit-btn {
          width: 100% !important;
          background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important;
          color: #ffffff !important;
          border: none !important;
          padding: 1rem !important;
          border-radius: 50px !important;
          font-weight: 700 !important;
          font-size: 1rem !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 25px rgba(68, 0, 255, 0.3) !important;
        }

        .submit-btn:disabled {
          opacity: 0.7 !important;
          cursor: not-allowed !important;
        }

        .contact-map-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: #ffffff;
          padding: 5rem 2rem !important;
        }

        .contact-map-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
        }

        .map-header {
          text-align: center !important;
          margin-bottom: 3rem !important;
        }

        .map-title {
          font-size: 2rem !important;
          font-weight: 800 !important;
          color: var(--primary) !important;
          margin-bottom: 1rem !important;
          position: relative !important;
          display: inline-block !important;
        }

        .map-title::after {
          content: '' !important;
          position: absolute !important;
          bottom: -10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 80px !important;
          height: 4px !important;
          background: linear-gradient(90deg, var(--primary), var(--secondary)) !important;
          border-radius: 2px !important;
        }

        .map-subtitle {
          font-size: 1.1rem !important;
          color: #6c757d !important;
          max-width: 600px !important;
          margin: 1rem auto 0 !important;
        }

        .map-wrapper {
          border-radius: 24px !important;
          overflow: hidden !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
        }

        .map-iframe {
          width: 100% !important;
          height: 450px !important;
          border: none !important;
        }

        @media (max-width: 991px) {
          .contact-hero-section { min-height: 400px !important; }
          .contact-main-section, .contact-map-section { padding: 3rem 1.5rem !important; }
        }

        @media (max-width: 768px) {
          .contact-hero-section { min-height: 350px !important; }
          .contact-main-section, .contact-map-section { padding: 2rem 1rem !important; }
          .contact-info-card, .contact-form-card { padding: 1.5rem !important; }
          .contact-info-title, .form-title { font-size: 1.5rem !important; }
          .map-title { font-size: 1.75rem !important; }
          .map-iframe { height: 350px !important; }
        }

        @media (max-width: 576px) {
          .info-item { flex-direction: column !important; text-align: center !important; }
          .info-icon { margin: 0 auto !important; }
          .info-content { text-align: center !important; }
          .contact-info-title, .form-title { display: block !important; text-align: center !important; }
          .contact-info-title::after, .form-title::after { left: 50% !important; transform: translateX(-50%) !important; }
          .social-links { justify-content: center !important; }
          .map-iframe { height: 250px !important; }
        }
      `}</style>

      {/* Hero Section with Background Image */}
      <section className="contact-hero-section">
        <img src={contactBg} alt="Contact Us" className="hero-bg-image" />
        <div className="hero-gradient-overlay"></div>
        
        <div className="contact-hero-container">
          <motion.h1 
            className="contact-hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Contact <span>Us</span>
          </motion.h1>
          <motion.p 
            className="contact-hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="contact-main-section">
        <div className="contact-main-container">
          <div className="row g-4">
            <div className="col-lg-5" data-aos="fade-right">
              <div className="contact-info-card">
                <h2 className="contact-info-title">Get in Touch</h2>
                {contactInfo.map((item, index) => (
                  <div key={index} className="info-item">
                    <div className="info-icon">
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <div className="info-content">
                      <h6>{item.title}</h6>
                      {item.link ? (
                        <a href={item.link} target={item.link.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                          {item.details[0]}
                        </a>
                      ) : (
                        item.details.map((line, i) => <p key={i}>{line}</p>)
                      )}
                    </div>
                  </div>
                ))}
                <div className="social-section">
                  <h6 className="social-title">Follow Us</h6>
                  <div className="social-links">
                    <a href="#" className="social-link" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
                    <a href="#" className="social-link" aria-label="Twitter"><i className="bi bi-twitter"></i></a>
                    <a href="#" className="social-link" aria-label="LinkedIn"><i className="bi bi-linkedin"></i></a>
                    <a href="#" className="social-link" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-7" data-aos="fade-left">
              <div className="contact-form-card">
                <h3 className="form-title">Send Us a Message</h3>
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-md-6">
                      <label className="form-label">Your Name</label>
                      <input type="text" name="name" className="form-control-custom" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input type="email" name="email" className="form-control-custom" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Subject</label>
                      <input type="text" name="subject" className="form-control-custom" placeholder="How can we help you?" value={formData.subject} onChange={handleChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Your Message</label>
                      <textarea name="message" className="form-control-custom" rows="5" placeholder="Type your message here..." value={formData.message} onChange={handleChange} required></textarea>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</>
                        ) : (
                          <>Send Message <i className="bi bi-send ms-2"></i></>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="contact-map-section">
        <div className="contact-map-container">
          <div className="map-header" data-aos="fade-up">
            <h2 className="map-title">Find Us Here</h2>
            <p className="map-subtitle">Visit our office for personalized consultation</p>
          </div>
          <div className="map-wrapper" data-aos="zoom-in">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.111111111111!2d5.6035!3d6.3335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjAnMDAuNiJOIDXCsDM2JzEyLjYiRQ!5e0!3m2!1sen!2sng!4v1234567890" 
              className="map-iframe"
              allowFullScreen="" 
              loading="lazy"
              title="Office Location"
            ></iframe>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;