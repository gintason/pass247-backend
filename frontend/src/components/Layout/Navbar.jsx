import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo1.png';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isAdminUser = Boolean(user?.is_staff || user?.is_superuser || user?.isAdmin);

  const closeDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(false);
  };

  const handleLogout = async () => {
    closeDropdown();
    setIsMenuOpen(false);
    await logout();
    navigate('/');
  };

  // Close the menu when clicking elsewhere or pressing Escape. Without this
  // a React-controlled dropdown stays open until its toggle is clicked again.
  useEffect(() => {
    if (!isDropdownOpen) return undefined;

    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleDropdownEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 200);
  };

  const menuItems = [
    { path: '/', label: 'Home', icon: 'bi-house-door-fill' },
    { path: '/about', label: 'About', icon: 'bi-info-circle-fill' },
    { path: '/exams', label: 'Exams', icon: 'bi-journal-bookmark-fill' },
    { path: '/careers', label: 'Careers', icon: 'bi-briefcase-fill' },
    { path: '/skills', label: 'Skills', icon: 'bi-palette-fill' },
    { path: '/payment-plans', label: 'Pricing', icon: 'bi-star-fill' },
    { path: '/contact', label: 'Contact', icon: 'bi-envelope-fill' },
  ];

  return (
    <>
      <nav className={`navbar navbar-expand-lg fixed-top ${isScrolled ? 'navbar-scrolled' : 'navbar-dark-bg'}`}>
        <div className="container-fluid px-4 px-lg-5">
          {/* Logo */}
          <Link className="navbar-brand" to="/">
            <img src={logo} alt="Pass24/7 Logo" className="navbar-logo" />
          </Link>

          {/* Mobile Toggle */}
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navbar Items */}
          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              {menuItems.map((item) => (
                <li key={item.path} className="nav-item">
                  <Link 
                    className="nav-link" 
                    to={item.path} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className={`bi ${item.icon} nav-icon`}></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* User Authentication - Login/Signup Buttons */}
            <div className="d-flex align-items-center">
              {isAuthenticated ? (
                <div
                  className="dropdown"
                  ref={dropdownRef}
                  onMouseEnter={handleDropdownEnter}
                  onMouseLeave={handleDropdownLeave}
                >
                  {/* This used data-bs-toggle="dropdown", which needs
                      Bootstrap's JS bundle — and only Bootstrap's CSS is
                      imported. So the menu never opened and Dashboard,
                      Profile and Logout were unreachable. The component
                      already had isDropdownOpen state, a ref and hover
                      handlers; they simply were not wired to the markup.
                      Now driven by React, like the mobile menu above. */}
                  <button
                    className="btn btn-link text-white dropdown-toggle user-menu"
                    type="button"
                    onClick={() => setIsDropdownOpen((open) => !open)}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="true"
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    <span>{user?.username}</span>
                  </button>
                  <ul className={`dropdown-menu dropdown-menu-end ${isDropdownOpen ? 'show' : ''}`}>
                    <li><Link className="dropdown-item" to="/dashboard" onClick={closeDropdown}>
                      <i className="bi bi-speedometer2 me-2"></i>Dashboard
                    </Link></li>
                    <li><Link className="dropdown-item" to="/profile" onClick={closeDropdown}>
                      <i className="bi bi-person me-2"></i>Profile
                    </Link></li>
                    {isAdminUser && (
                      <li><a className="dropdown-item" href="/admin/" onClick={closeDropdown}>
                        <i className="bi bi-shield-lock me-2"></i>Django admin
                      </a></li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-login">Login</Link>
                  <Link to="/register" className="btn-signup">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <style>{`
        /* Navbar Base Styles */
        .navbar {
          transition: all 0.3s ease;
          padding: 1rem 0;
          z-index: 1000;
        }

        .navbar-dark-bg {
          background: #0a0a0a !important;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        }

        .navbar-scrolled {
          background: #0a0a0a !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
          padding: 0.75rem 0;
        }

        /* Logo */
        .navbar-logo {
          height: 45px;
          transition: all 0.3s ease;
        }

        .navbar-scrolled .navbar-logo {
          height: 40px;
        }

        /* Navbar Items */
        .navbar-nav {
          gap: 0.25rem;
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.85) !important;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.6rem 1.1rem !important;
          transition: all 0.3s ease;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link:hover {
          color: #ffc100 !important;
          background: rgba(255, 193, 0, 0.08);
        }

        .nav-link .nav-icon {
          font-size: 1rem;
          color: #ffc100 !important;
          transition: all 0.3s ease;
        }

        .nav-link:hover .nav-icon {
          transform: scale(1.15);
        }

        .nav-link::after {
          display: none !important;
        }

        /* Active nav link */
        .nav-link.active {
          color: #ffc100 !important;
          background: rgba(255, 193, 0, 0.12);
        }

        /* User Menu */
        .user-menu {
          text-decoration: none;
          padding: 0.5rem 1.5rem;
          border-radius: 30px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          font-weight: 500;
          white-space: nowrap;
          color: #fff !important;
        }

        .user-menu:hover {
          background: rgba(255, 193, 0, 0.15);
          border-color: #ffc100;
          color: #ffc100 !important;
        }

        .user-menu::after {
          display: none;
        }

        /* Dropdown Menu (for user) */
        .dropdown-menu {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          padding: 0.75rem 0;
          margin-top: 0.5rem;
          min-width: 220px;
        }

        .dropdown-item {
          color: rgba(255, 255, 255, 0.8);
          padding: 0.75rem 1.5rem;
          transition: all 0.3s ease;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: rgba(255, 193, 0, 0.1);
          color: #ffc100;
          padding-left: 2rem;
        }

        .dropdown-item i {
          width: 20px;
          color: #ffc100 !important;
        }

        .dropdown-divider {
          border-top-color: rgba(255, 255, 255, 0.1);
        }

        /* Login/Signup Buttons */
        .btn-login {
          color: #ffffff;
          text-decoration: none;
          padding: 0.5rem 1.8rem;
          margin-right: 0.75rem;
          font-weight: 500;
          border-radius: 30px;
          transition: all 0.3s ease;
          border: 2px solid rgba(255, 255, 255, 0.2);
          white-space: nowrap;
          min-width: 90px;
          text-align: center;
          display: inline-block;
        }

        .btn-login:hover {
          border-color: #ffc100;
          color: #ffc100;
          background: rgba(255, 193, 0, 0.05);
        }

        .btn-signup {
          background: #ffc100;
          color: #0a0a0a;
          text-decoration: none;
          padding: 0.5rem 1.4rem;
          font-weight: 600;
          border-radius: 30px;
          transition: all 0.3s ease;
          border: 2px solid #ffc100;
          white-space: nowrap;
          min-width: 100px;
          text-align: center;
          display: inline-block;
        }

        .btn-signup:hover {
          background: #ffd700;
          border-color: #ffd700;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 193, 0, 0.3);
          color: #0a0a0a;
        }

        /* Mobile Styles */
        .navbar-toggler {
          border: 2px solid rgba(255, 255, 255, 0.2);
          padding: 0.5rem;
          transition: all 0.3s ease;
        }

        .navbar-toggler:focus {
          box-shadow: none;
        }

        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.9%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
        }

        @media (max-width: 991px) {
          .navbar-collapse {
            background: #0a0a0a;
            padding: 1.5rem;
            border-radius: 15px;
            margin-top: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 80vh;
            overflow-y: auto;
          }

          .navbar-nav {
            margin-bottom: 1.5rem !important;
            gap: 0.5rem;
          }

          .nav-link {
            padding: 0.8rem 1rem !important;
            border-radius: 12px;
            font-size: 1rem;
          }

          .user-menu {
            width: 100%;
            text-align: center;
            margin-bottom: 0.5rem;
          }

          .btn-login, .btn-signup {
            flex: 1;
            text-align: center;
            min-width: 0;
            padding: 0.6rem 1rem;
            font-size: 0.95rem;
          }

          .btn-login {
            margin-right: 0.5rem;
          }
        }

        @media (max-width: 575px) {
          .btn-login, .btn-signup {
            padding: 0.5rem 0.8rem;
            font-size: 0.9rem;
          }
        }

        .container-fluid {
          max-width: 1400px;
          margin: 0 auto;
        }
      `}</style>
    </>
  );
};

export default Navbar;