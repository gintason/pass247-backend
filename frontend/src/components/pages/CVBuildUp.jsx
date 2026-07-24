import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const CVBuildUp = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const services = [
    {
      icon: 'bi-file-earmark-text',
      title: 'Professional CV Writing',
      description: 'Get a professionally crafted CV that highlights your strengths and achievements',
      features: [
        'ATS-optimized formatting',
        'Keyword optimization',
        'Achievement-focused content',
        'Professional summary'
      ]
    },
    {
      icon: 'bi-envelope-paper',
      title: 'Cover Letter Writing',
      description: 'Compelling cover letters that grab recruiters attention',
      features: [
        'Tailored to each application',
        'Story-driven narrative',
        'Company research included',
        'Follow-up templates'
      ]
    },
    {
      icon: 'bi-linkedin',
      title: 'LinkedIn Profile Optimization',
      description: 'Transform your LinkedIn profile to attract recruiters',
      features: [
        'Headline optimization',
        'About section rewrite',
        'Experience descriptions',
        'Keyword strategy'
      ]
    },
    {
      icon: 'bi-briefcase',
      title: 'Portfolio Development',
      description: 'Create a stunning portfolio that showcases your best work',
      features: [
        'Portfolio structure',
        'Case study templates',
        'Visual design tips',
        'Project descriptions'
      ]
    }
  ];

  const packages = [
    {
      name: 'Essential',
      price: '₦35,000',
      includes: [
        'Professional CV (2 pages)',
        'Cover Letter template',
        '1 revision round',
        '5 working days delivery'
      ]
    },
    {
      name: 'Professional',
      price: '₦65,000',
      popular: true,
      includes: [
        'Professional CV (3 pages)',
        'Custom Cover Letter',
        'LinkedIn profile optimization',
        '3 revision rounds',
        '3 working days delivery',
        'Interview preparation guide'
      ]
    },
    {
      name: 'Executive',
      price: '₦100,000',
      includes: [
        'Executive CV (4 pages)',
        'Custom Cover Letter',
        'LinkedIn profile optimization',
        'Portfolio review',
        'Unlimited revisions',
        '24-hour delivery',
        'Career coaching session'
      ]
    }
  ];

  const templates = [
    { id: 1, name: 'Modern Professional', image: 'https://via.placeholder.com/200x280', category: 'Professional' },
    { id: 2, name: 'Creative Design', image: 'https://via.placeholder.com/200x280', category: 'Creative' },
    { id: 3, name: 'Executive Suite', image: 'https://via.placeholder.com/200x280', category: 'Executive' },
    { id: 4, name: 'Tech Minimal', image: 'https://via.placeholder.com/200x280', category: 'Technology' },
    { id: 5, name: 'Academic', image: 'https://via.placeholder.com/200x280', category: 'Academic' },
    { id: 6, name: 'Entry Level', image: 'https://via.placeholder.com/200x280', category: 'Graduate' }
  ];

  const testimonials = [
    {
      name: 'David Okafor',
      role: 'Software Engineer',
      company: 'Microsoft',
      quote: 'My new CV helped me stand out and land interviews at top tech companies. Worth every naira!'
    },
    {
      name: 'Chioma Eze',
      role: 'Marketing Manager',
      company: 'Nestle',
      quote: 'The LinkedIn optimization service got me noticed by recruiters. I get messages weekly now.'
    },
    {
      name: 'Ahmed Bello',
      role: 'Project Manager',
      company: 'Shell',
      quote: 'Professional, thorough, and fast. My CV opens doors I never thought possible.'
    }
  ];

  const process = [
    {
      step: 1,
      title: 'Consultation',
      description: 'We discuss your career goals, industry, and target positions'
    },
    {
      step: 2,
      title: 'Information Gathering',
      description: 'You provide your current CV, achievements, and job descriptions'
    },
    {
      step: 3,
      title: 'Draft Creation',
      description: 'We create your first draft with optimized content and formatting'
    },
    {
      step: 4,
      title: 'Review & Revise',
      description: 'You review and we make revisions until you are 100% satisfied'
    }
  ];

  const faqs = [
    {
      q: 'How long does it take to get my CV?',
      a: 'Delivery times vary by package: Essential (5 days), Professional (3 days), Executive (24 hours).'
    },
    {
      q: 'Do you offer revisions?',
      a: 'Yes, all packages include revisions. The number of revisions depends on your chosen package.'
    },
    {
      q: 'What information do you need from me?',
      a: 'Your current CV (if available), job descriptions of roles you\'re targeting, and your key achievements.'
    },
    {
      q: 'Are your CVs ATS-friendly?',
      a: 'Yes, all our CVs are optimized for Applicant Tracking Systems (ATS) used by most companies.'
    },
    {
      q: 'Do you write for specific industries?',
      a: 'Yes, we have writers specialized in various industries including tech, finance, healthcare, and more.'
    }
  ];

  return (
    <>
      {/* Embedded Styles - Full Width */}
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
          --gray: #6c757d;
          --light: #f8f9fa;
          --white: #ffffff;
        }

        /* ===== HERO SECTION - FULL WIDTH ===== */
        .cv-hero-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #4400ff 0%, #ff6b6b 100%) !important;
          position: relative;
          overflow: hidden;
          padding: 5rem 2rem !important;
          min-height: 550px;
          display: flex;
          align-items: center;
        }

        .cv-hero-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          animation: heroPulse 8s ease-in-out infinite;
        }

        @keyframes heroPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
        }

        .cv-hero-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
          position: relative;
          z-index: 1;
        }

        .cv-hero-title {
          font-size: clamp(2rem, 5vw, 3.5rem) !important;
          font-weight: 800 !important;
          margin-bottom: 1.5rem !important;
          color: var(--white) !important;
        }

        .cv-hero-title span {
          color: var(--secondary) !important;
        }

        .cv-hero-subtitle {
          font-size: clamp(1rem, 1.5vw, 1.2rem) !important;
          margin-bottom: 2rem !important;
          color: rgba(255, 255, 255, 0.95) !important;
          line-height: 1.6 !important;
        }

        .cv-hero-buttons {
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
          font-weight: 700 !important;
          text-decoration: none !important;
          transition: all 0.3s ease !important;
        }

        .btn-hero-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 25px rgba(255, 193, 0, 0.3) !important;
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
          font-weight: 700 !important;
          text-decoration: none !important;
          transition: all 0.3s ease !important;
        }

        .btn-hero-secondary:hover {
          border-color: var(--secondary) !important;
          color: var(--secondary) !important;
          transform: translateY(-2px) !important;
        }

        .hero-image-wrapper {
          text-align: center !important;
        }

        .hero-image {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 20px !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
        }

        /* ===== SERVICES SECTION - FULL WIDTH ===== */
        .cv-services-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: #ffffff;
          padding: 5rem 2rem !important;
        }

        .cv-services-container {
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
          color: var(--primary) !important;
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
          background: linear-gradient(90deg, var(--primary), #ff6b6b) !important;
          border-radius: 2px !important;
        }

        .section-subtitle {
          font-size: 1.2rem !important;
          color: #6c757d !important;
          max-width: 700px !important;
          margin: 1rem auto 0 !important;
        }

        .services-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
          gap: 2rem !important;
        }

        .service-card {
          background: #ffffff !important;
          border-radius: 20px !important;
          padding: 2rem !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          height: 100% !important;
        }

        .service-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 40px rgba(68, 0, 255, 0.1) !important;
        }

        .service-icon {
          width: 70px !important;
          height: 70px !important;
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.1), rgba(255, 107, 107, 0.1)) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin-bottom: 1.5rem !important;
        }

        .service-icon i {
          font-size: 2rem !important;
          color: var(--primary) !important;
        }

        .service-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          margin-bottom: 1rem !important;
          color: var(--dark) !important;
        }

        .service-description {
          font-size: 0.9rem !important;
          color: #6c757d !important;
          line-height: 1.6 !important;
          margin-bottom: 1rem !important;
        }

        .feature-list {
          list-style: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .feature-list li {
          font-size: 0.85rem !important;
          color: #6c757d !important;
          margin-bottom: 0.5rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }

        .feature-list li i {
          color: #28a745 !important;
          font-size: 0.8rem !important;
        }

        /* ===== PROCESS SECTION - FULL WIDTH ===== */
        .cv-process-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .process-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
          gap: 2rem !important;
          margin-top: 2rem !important;
        }

        .process-step {
          text-align: center !important;
        }

        .step-number {
          width: 70px !important;
          height: 70px !important;
          margin: 0 auto !important;
          background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important;
          color: #ffffff !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 1.8rem !important;
          font-weight: 700 !important;
          transition: all 0.3s ease !important;
        }

        .step-number:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 10px 25px rgba(68, 0, 255, 0.3) !important;
        }

        .step-title {
          font-size: 1.2rem !important;
          font-weight: 700 !important;
          margin: 1rem 0 0.5rem !important;
          color: var(--dark) !important;
        }

        .step-description {
          font-size: 0.9rem !important;
          color: #6c757d !important;
          line-height: 1.5 !important;
        }

        /* ===== PACKAGES SECTION - FULL WIDTH ===== */
        .cv-packages-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: #ffffff;
          padding: 5rem 2rem !important;
        }

        .packages-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)) !important;
          gap: 2rem !important;
        }

        .package-card {
          background: #ffffff !important;
          border-radius: 24px !important;
          overflow: hidden !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          position: relative !important;
        }

        .package-card.popular {
          border: 2px solid var(--secondary) !important;
          transform: scale(1.02) !important;
        }

        .package-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 40px rgba(68, 0, 255, 0.1) !important;
        }

        .popular-badge {
          position: absolute !important;
          top: 20px !important;
          right: 20px !important;
          background: var(--secondary) !important;
          color: var(--dark) !important;
          padding: 0.5rem 1rem !important;
          border-radius: 50px !important;
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }

        .package-header {
          padding: 2rem !important;
          text-align: center !important;
          border-bottom: 1px solid #e9ecef !important;
        }

        .package-name {
          font-size: 1.5rem !important;
          font-weight: 800 !important;
          margin-bottom: 0.5rem !important;
        }

        .package-price {
          font-size: 2rem !important;
          font-weight: 800 !important;
          color: var(--primary) !important;
        }

        .package-body {
          padding: 2rem !important;
        }

        .package-features {
          list-style: none !important;
          padding: 0 !important;
          margin: 0 0 2rem 0 !important;
        }

        .package-features li {
          padding: 0.5rem 0 !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          font-size: 0.9rem !important;
          color: #6c757d !important;
        }

        .package-features li i {
          color: #28a745 !important;
        }

        .package-btn {
          width: 100% !important;
          padding: 0.875rem !important;
          border-radius: 50px !important;
          font-weight: 700 !important;
          text-align: center !important;
          text-decoration: none !important;
          transition: all 0.3s ease !important;
        }

        .package-btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-light)) !important;
          color: #ffffff !important;
        }

        .package-btn-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 5px 15px rgba(68, 0, 255, 0.3) !important;
        }

        /* ===== TEMPLATES SECTION - FULL WIDTH ===== */
        .cv-templates-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .templates-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)) !important;
          gap: 1.5rem !important;
        }

        .template-card {
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        .template-card.selected {
          transform: scale(1.05) !important;
        }

        .template-card.selected .template-inner {
          box-shadow: 0 0 0 3px var(--secondary) !important;
        }

        .template-inner {
          background: #ffffff !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
        }

        .template-inner:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
        }

        .template-image {
          width: 100% !important;
          height: 200px !important;
          object-fit: cover !important;
        }

        .template-info {
          padding: 0.75rem !important;
          text-align: center !important;
        }

        .template-name {
          font-size: 0.85rem !important;
          font-weight: 700 !important;
          margin-bottom: 0.25rem !important;
        }

        .template-category {
          font-size: 0.7rem !important;
          color: #6c757d !important;
        }

        /* ===== TESTIMONIALS SECTION - FULL WIDTH ===== */
        .cv-testimonials-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: #ffffff;
          padding: 5rem 2rem !important;
        }

        .testimonials-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)) !important;
          gap: 2rem !important;
        }

        .testimonial-card {
          background: #ffffff !important;
          border-radius: 20px !important;
          padding: 2rem !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }

        .testimonial-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 20px 40px rgba(68, 0, 255, 0.1) !important;
        }

        .stars {
          color: var(--secondary) !important;
          margin-bottom: 1rem !important;
        }

        .testimonial-quote {
          font-size: 0.95rem !important;
          line-height: 1.6 !important;
          color: #6c757d !important;
          margin-bottom: 1.5rem !important;
        }

        /* ===== FAQ SECTION - FULL WIDTH ===== */
        .cv-faq-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .faq-container {
          max-width: 800px !important;
          margin: 0 auto !important;
        }

        .accordion-item-custom {
          background: #ffffff !important;
          border-radius: 16px !important;
          margin-bottom: 1rem !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
          overflow: hidden !important;
        }

        .accordion-button-custom {
          width: 100% !important;
          padding: 1.25rem !important;
          background: #ffffff !important;
          border: none !important;
          text-align: left !important;
          font-weight: 600 !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
        }

        .accordion-button-custom:hover {
          background: #f8f9fa !important;
        }

        .accordion-content {
          padding: 0 1.25rem 1.25rem 1.25rem !important;
          color: #6c757d !important;
          line-height: 1.6 !important;
        }

        /* ===== CTA SECTION - FULL WIDTH ===== */
        .cv-cta-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #4400ff 0%, #ff6b6b 100%) !important;
          padding: 5rem 2rem !important;
          position: relative;
          overflow: hidden;
        }

        .cv-cta-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }

        .cv-cta-container {
          max-width: 800px !important;
          margin: 0 auto !important;
          text-align: center !important;
          position: relative;
          z-index: 1;
        }

        .cta-title {
          font-size: 2rem !important;
          font-weight: 800 !important;
          color: #ffffff !important;
          margin-bottom: 1rem !important;
        }

        .cta-subtitle {
          font-size: 1.1rem !important;
          color: rgba(255, 255, 255, 0.95) !important;
          margin-bottom: 2rem !important;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 991px) {
          .cv-hero-section {
            padding: 4rem 1.5rem !important;
          }
          .section-title {
            font-size: 2rem !important;
          }
          .packages-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
          }
          .package-card.popular {
            transform: scale(1) !important;
          }
        }

        @media (max-width: 768px) {
          .cv-hero-section {
            padding: 3rem 1rem !important;
          }
          .cv-services-section,
          .cv-process-section,
          .cv-packages-section,
          .cv-templates-section,
          .cv-testimonials-section,
          .cv-faq-section,
          .cv-cta-section {
            padding: 3rem 1rem !important;
          }
          .section-title {
            font-size: 1.75rem !important;
          }
          .section-subtitle {
            font-size: 1rem !important;
          }
          .cv-hero-buttons {
            justify-content: center !important;
          }
          .hero-image-wrapper {
            margin-top: 2rem !important;
          }
          .services-grid,
          .process-grid,
          .packages-grid,
          .testimonials-grid {
            grid-template-columns: 1fr !important;
          }
          .templates-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .cta-title {
            font-size: 1.5rem !important;
          }
        }

        @media (max-width: 576px) {
          .cv-hero-buttons {
            flex-direction: column !important;
            width: 100% !important;
          }
          .btn-hero-primary,
          .btn-hero-secondary {
            justify-content: center !important;
            width: 100% !important;
          }
          .templates-grid {
            grid-template-columns: 1fr !important;
          }
          .template-image {
            height: 180px !important;
          }
        }
      `}</style>

      {/* Hero Section - Full Width */}
      <section className="cv-hero-section">
        <div className="cv-hero-container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <motion.h1 
                className="cv-hero-title"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                CV <span>Build Up</span>
              </motion.h1>
              <motion.p 
                className="cv-hero-subtitle"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Stand out from the crowd with a professionally crafted CV that gets you noticed. 
                Our expert writers know exactly what recruiters are looking for.
              </motion.p>
              <motion.div 
                className="cv-hero-buttons"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Link to="/contact" className="btn-hero-primary">
                  Get Started <i className="bi bi-arrow-right ms-2"></i>
                </Link>
                <a href="#templates" className="btn-hero-secondary">
                  View Templates
                </a>
              </motion.div>
            </div>
            <div className="col-lg-6">
              <div className="hero-image-wrapper">
                <img 
                  src="https://via.placeholder.com/600x400" 
                  alt="CV Build Up" 
                  className="hero-image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Full Width */}
      <section className="cv-services-section">
        <div className="cv-services-container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">Comprehensive career documentation services</p>
          </div>

          <div className="services-grid">
            {services.map((service, index) => (
              <motion.div 
                key={index}
                className="service-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                data-aos="zoom-in"
                data-aos-delay={index * 100}
              >
                <div className="service-icon">
                  <i className={`bi ${service.icon}`}></i>
                </div>
                <h5 className="service-title">{service.title}</h5>
                <p className="service-description">{service.description}</p>
                <ul className="feature-list">
                  {service.features.map((feature, idx) => (
                    <li key={idx}>
                      <i className="bi bi-check-circle-fill"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section - Full Width */}
      <section className="cv-process-section">
        <div className="cv-services-container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple 4-step process to your perfect CV</p>
          </div>

          <div className="process-grid">
            {process.map((step, index) => (
              <div className="process-step" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="step-number">{step.step}</div>
                <h5 className="step-title">{step.title}</h5>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section - Full Width */}
      <section className="cv-packages-section">
        <div className="cv-services-container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">Our Packages</h2>
            <p className="section-subtitle">Choose the package that fits your needs</p>
          </div>

          <div className="packages-grid">
            {packages.map((pkg, index) => (
              <div key={index} className={`package-card ${pkg.popular ? 'popular' : ''}`} data-aos="zoom-in" data-aos-delay={index * 100}>
                {pkg.popular && (
                  <div className="popular-badge">
                    <i className="bi bi-star-fill"></i>
                    Most Popular
                  </div>
                )}
                <div className="package-header">
                  <h4 className="package-name">{pkg.name}</h4>
                  <div className="package-price">{pkg.price}</div>
                </div>
                <div className="package-body">
                  <ul className="package-features">
                    {pkg.includes.map((item, idx) => (
                      <li key={idx}>
                        <i className="bi bi-check-circle-fill"></i>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/contact" className="package-btn package-btn-primary">
                    Select Package
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section - Full Width */}
      <section id="templates" className="cv-templates-section">
        <div className="cv-services-container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">CV Templates</h2>
            <p className="section-subtitle">Choose from our professionally designed templates</p>
          </div>

          <div className="templates-grid">
            {templates.map((template, index) => (
              <div 
                key={template.id} 
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                data-aos="zoom-in"
                data-aos-delay={index * 50}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-inner">
                  <img 
                    src={template.image} 
                    alt={template.name}
                    className="template-image"
                  />
                  <div className="template-info">
                    <div className="template-name">{template.name}</div>
                    <div className="template-category">{template.category}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedTemplate && (
            <motion.div 
              className="text-center mt-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Link to="/contact" className="package-btn package-btn-primary" style={{ width: 'auto', padding: '1rem 2rem' }}>
                Use This Template <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Testimonials Section - Full Width */}
      <section className="cv-testimonials-section">
        <div className="cv-services-container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">Success Stories</h2>
            <p className="section-subtitle">Hear from our satisfied clients</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card" data-aos="fade-up" data-aos-delay={index * 100}>
                <div className="stars">
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                  <i className="bi bi-star-fill"></i>
                </div>
                <p className="testimonial-quote">"{testimonial.quote}"</p>
                <div>
                  <h6 className="fw-bold mb-1">{testimonial.name}</h6>
                  <small className="text-muted">{testimonial.role} at {testimonial.company}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Full Width */}
      <section className="cv-faq-section">
        <div className="cv-services-container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Answers to common questions about our CV services</p>
          </div>

          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div key={index} className="accordion-item-custom" data-aos="fade-up" data-aos-delay={index * 50}>
                <button 
                  className="accordion-button-custom"
                  onClick={(e) => {
                    const content = e.currentTarget.nextElementSibling;
                    const icon = e.currentTarget.querySelector('.accordion-icon');
                    content.classList.toggle('show');
                    if (icon) {
                      icon.classList.toggle('rotate');
                    }
                  }}
                >
                  <strong>{faq.q}</strong>
                  <i className="bi bi-chevron-down accordion-icon"></i>
                </button>
                <div className="accordion-content" style={{ display: 'none' }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="cv-cta-section">
        <div className="cv-cta-container">
          <h2 className="cta-title">Ready to Transform Your CV?</h2>
          <p className="cta-subtitle">Get started today and land your dream job</p>
          <Link to="/contact" className="btn-hero-primary" style={{ background: '#ffc100', color: '#1a1a1a' }}>
            Get Your Free Consultation <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>

      {/* Accordion JavaScript */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.querySelectorAll('.accordion-button-custom').forEach(button => {
            button.addEventListener('click', () => {
              const content = button.nextElementSibling;
              const icon = button.querySelector('.accordion-icon');
              if (content.style.display === 'none' || !content.style.display) {
                content.style.display = 'block';
                if (icon) icon.style.transform = 'rotate(180deg)';
              } else {
                content.style.display = 'none';
                if (icon) icon.style.transform = 'rotate(0deg)';
              }
            });
          });
        `
      }} />
    </>
  );
};

export default CVBuildUp;