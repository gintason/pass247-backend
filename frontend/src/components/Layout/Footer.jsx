import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo1.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-full-width">
      <div className="footer-content">
        <div className="container-fluid px-4 px-lg-5">
          <div className="row py-5">
            {/* Logo & About Section */}
            <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
              <Link to="/" className="d-inline-block mb-3">
                <img src={logo} alt="Pass24/7 Logo" height="50" />
              </Link>
              <p className="footer-text">
                Overcome your nervousness and lack of preparation today! Pass every interview on the first attempt using the Pass24/7 App.
              </p>
              <div className="social-links">
                <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-facebook"></i>
                </a>
                <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-linkedin"></i>
                </a>
                <a href="#" className="social-link" target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-instagram"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
              <h5 className="footer-title">Quick Links</h5>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/exams">Exams</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/skills">Skills</Link></li>
                <li><Link to="/blog">Blog</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
              <h5 className="footer-title">Services</h5>
              <ul className="footer-links">
                <li><Link to="/interview-mentoring">Interview Mentoring</Link></li>
                <li><Link to="/typing-skills">Typing Skills</Link></li>
                <li><Link to="/personal-coaching">Personal Coaching</Link></li>
                <li><Link to="/cv-build-up">CV Build Up</Link></li>
                <li><Link to="/remote-jobs">Remote Jobs</Link></li>
              </ul>
            </div>

            {/* Contact / Location */}
            <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
              <h5 className="footer-title">Contact Us</h5>
              <ul className="footer-contact">
                <li>
                  <i className="bi bi-geo-alt-fill"></i>
                  <span>No. 1 Lucky Igbenedion Drive, GRA, Benin City</span>
                </li>
                <li>
                  <i className="bi bi-telephone-fill"></i>
                  <a href="tel:+2348072483764">+234 807 248 3764</a>
                </li>
                <li>
                  <i className="bi bi-envelope-fill"></i>
                  <a href="mailto:info@pass247.net">info@pass247.net</a>
                </li>
                <li>
                  <i className="bi bi-globe"></i>
                  <a href="https://www.pass247.net" target="_blank" rel="noopener noreferrer">www.pass247.net</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Horizontal Divider */}
          <hr className="footer-divider" />

          {/* Copyright */}
          <div className="footer-bottom">
            <p className="copyright">
              © {currentYear} Pass247.net. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .footer-full-width {
          width: 100vw !important;
          position: relative !important;
          left: 50% !important;
          right: 50% !important;
          margin-left: -50vw !important;
          margin-right: -50vw !important;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%) !important;
          color: #ffffff !important;
          overflow: hidden !important;
        }

        .footer-content {
          position: relative !important;
          z-index: 1 !important;
        }

        .footer-full-width::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: 
            radial-gradient(circle at 20% 50%, rgba(68, 0, 255, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(255, 193, 0, 0.05) 0%, transparent 50%) !important;
          pointer-events: none !important;
        }

        .footer-title {
          color: #ffc100 !important;
          font-size: 1.15rem !important;
          font-weight: 700 !important;
          margin-bottom: 1.5rem !important;
          position: relative !important;
          padding-bottom: 0.75rem !important;
          text-align: left !important;
        }

        .footer-title::after {
          content: '' !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 35px !important;
          height: 3px !important;
          background: linear-gradient(90deg, #ffc100, #ffd700) !important;
          border-radius: 2px !important;
        }

        .footer-text {
          color: rgba(255, 255, 255, 0.55) !important;
          font-size: 0.9rem !important;
          line-height: 1.7 !important;
          margin-bottom: 1.5rem !important;
          max-width: 320px !important;
          text-align: left !important;
        }

        .social-links {
          display: flex !important;
          gap: 0.75rem !important;
          justify-content: flex-start !important;
        }

        .social-link {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 38px !important;
          height: 38px !important;
          background: rgba(255, 255, 255, 0.06) !important;
          border-radius: 10px !important;
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 1.1rem !important;
          transition: all 0.3s ease !important;
          text-decoration: none !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        .social-link:hover {
          background: #ffc100 !important;
          color: #1a1a1a !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 20px rgba(255, 193, 0, 0.25) !important;
          border-color: #ffc100 !important;
        }

        .footer-links {
          list-style: none !important;
          padding: 0 !important;
          margin: 0 !important;
          text-align: left !important;
        }

        .footer-links li {
          margin-bottom: 0.65rem !important;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.55) !important;
          text-decoration: none !important;
          font-size: 0.9rem !important;
          transition: all 0.3s ease !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }

        .footer-links a::before {
          content: '' !important;
          width: 0 !important;
          height: 2px !important;
          background: #ffc100 !important;
          transition: width 0.3s ease !important;
          border-radius: 2px !important;
        }

        .footer-links a:hover {
          color: #ffc100 !important;
        }

        .footer-links a:hover::before {
          width: 12px !important;
        }

        .footer-contact {
          list-style: none !important;
          padding: 0 !important;
          margin: 0 !important;
          text-align: left !important;
        }

        .footer-contact li {
          display: flex !important;
          align-items: flex-start !important;
          gap: 0.75rem !important;
          margin-bottom: 0.9rem !important;
          color: rgba(255, 255, 255, 0.55) !important;
          font-size: 0.9rem !important;
          line-height: 1.5 !important;
          justify-content: flex-start !important;
        }

        .footer-contact i {
          color: #ffc100 !important;
          font-size: 0.95rem !important;
          margin-top: 0.2rem !important;
          flex-shrink: 0 !important;
          width: 18px !important;
          text-align: left !important;
        }

        .footer-contact a {
          color: rgba(255, 255, 255, 0.55) !important;
          text-decoration: none !important;
          transition: color 0.3s ease !important;
        }

        .footer-contact a:hover {
          color: #ffc100 !important;
        }

        .footer-divider {
          border: none !important;
          height: 1px !important;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent) !important;
          margin: 1rem 0 !important;
          opacity: 1 !important;
        }

        .footer-bottom {
          text-align: left !important;
          padding: 0.5rem 0 1.5rem 0 !important;
        }

        .copyright {
          color: rgba(255, 255, 255, 0.35) !important;
          font-size: 0.85rem !important;
          margin: 0 !important;
          letter-spacing: 0.5px !important;
        }

        .container-fluid {
          max-width: 1200px !important;
          margin: 0 auto !important;
        }

        /* Keep left-aligned on all screen sizes */
        @media (max-width: 767px) {
          .footer-title {
            text-align: left !important;
          }
          
          .footer-title::after {
            left: 0 !important;
            transform: none !important;
          }
          
          .footer-text {
            text-align: left !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          .social-links {
            justify-content: flex-start !important;
          }
          
          .footer-links {
            text-align: left !important;
          }
          
          .footer-links a {
            justify-content: flex-start !important;
          }
          
          .footer-contact li {
            justify-content: flex-start !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            text-align: left !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;