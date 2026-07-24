import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { motion, useScroll, useTransform } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import slider1 from '../../assets/slider1.png';
import slider2 from '../../assets/slider2.png';
import signUpIcon from '../../assets/sign-up.png';
import subscriptionIcon from '../../assets/subscription.png';
import successIcon from '../../assets/successful.png';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreloader, setShowPreloader] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
      easing: 'ease-out-cubic'
    });

    setTimeout(() => {
      setShowPreloader(false);
    }, 1000);

    fetchData();

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 2);
    }, 5000);

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setNavbarScrolled(true);
      } else {
        setNavbarScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchData = async () => {
  try {
    const productsRes = await api.get('/api/interview/products/');
    const productsData = productsRes.data?.results ?? 
                         (Array.isArray(productsRes.data) ? productsRes.data : []);
    setProducts(productsData);
  } catch (error) {
    console.error('Products fetch error:', error);
  }

  try {
    const postsRes = await api.get('/api/blog/posts/');
    setPosts(postsRes.data?.results ?? []);
  } catch (error) {
    console.error('Blog fetch error:', error);
  }

  setLoading(false);
};

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* Embedded Styles */}
      <style>{`
      /* ===== REMOVE ALL OUTLINES FROM EVERYTHING ===== */
*,
*:focus,
*:focus-visible,
*:active,
*:hover,
*::before,
*::after,
button:focus,
button:focus-visible,
a:focus,
a:focus-visible,
input:focus,
input:focus-visible,
textarea:focus,
textarea:focus-visible,
select:focus,
select:focus-visible,
[tabindex]:focus,
[tabindex]:focus-visible,
div:focus,
section:focus,
article:focus,
aside:focus,
header:focus,
footer:focus,
nav:focus,
main:focus,
span:focus,
h1:focus,
h2:focus,
h3:focus,
h4:focus,
h5:focus,
h6:focus,
p:focus,
img:focus,
svg:focus,
.btn:focus,
.btn:active,
.btn:focus-visible,
.btn-check:focus + .btn,
.btn-check:active + .btn {
  outline: none !important;
  outline-width: 0 !important;
  outline-style: none !important;
  outline-color: transparent !important;
  box-shadow: none !important;
  border-color: transparent !important;
  -webkit-tap-highlight-color: transparent !important;
}

/* Remove focus ring from all elements */
:focus {
  outline: 0 !important;
  box-shadow: none !important;
}

/* Specifically target Bootstrap btn classes */
.btn:focus,
.btn.focus,
.btn:active,
.btn.active,
.btn:focus-visible,
.btn-primary:focus,
.btn-warning:focus,
.btn-success:focus,
.btn-info:focus,
.btn-danger:focus,
.btn-secondary:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* Remove outline from any element that might get focus */
button,
a,
[role="button"],
input,
select,
textarea,
[tabindex] {
  outline: none !important;
}

/* Remove the blue ring that appears on click */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Remove any border from the hero section specifically */
.exams-hero-section,
.exams-hero-section *,
.exams-hero-section button,
.exams-hero-section .btn,
.exams-hero-section .btn-warning,
.exams-hero-section .btn-warning:focus,
.exams-hero-section .btn-warning:active {
  outline: none !important;
  box-shadow: none !important;
}

/* Remove any possible border from the upgrade prompt */
[class*="upgrade"],
[class*="Upgrade"],
.modal,
.modal-content,
.modal-dialog,
.modal-header,
.modal-body,
.modal-footer {
  outline: none !important;
  box-shadow: none !important;
}
  
        /* Global Styles */
        body {
          overflow-x: hidden !important;
          width: 100% !important;
        }

        :root {
          --primary: #4400ff;
          --primary-dark: #3300cc;
          --primary-light: #6a4cff;
          --secondary: #ffc100;
          --secondary-dark: #e6ae00;
          --secondary-light: #ffd700;
          --dark: #1a1a1a;
          --dark-bg: #0a0a0a;
          --gray: #6c757d;
          --light: #f8f9fa;
          --white: #ffffff;
          --gradient-primary: linear-gradient(135deg, #4400ff 0%, #6a4cff 100%);
          --gradient-secondary: linear-gradient(135deg, #ffc100 0%, #ffd700 100%);
          --gradient-hero: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(68, 0, 255, 0.4) 100%);
          --shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.05);
          --shadow-md: 0 10px 25px rgba(68, 0, 255, 0.1);
          --shadow-lg: 0 20px 40px rgba(68, 0, 255, 0.15);
          --shadow-hover: 0 30px 50px rgba(68, 0, 255, 0.25);
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --border-radius: 16px;
          --border-radius-sm: 8px;
          --border-radius-lg: 24px;
        }

        /* Sticky Navbar */
        .home-navbar {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          z-index: 1000 !important;
          background: transparent !important;
          transition: var(--transition) !important;
          padding: 1.5rem 0 !important;
        }

        .home-navbar.scrolled {
          background: var(--dark-bg) !important;
          padding: 0.75rem 0 !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3) !important;
        }

        .home-navbar .navbar-brand img {
          height: 40px !important;
          transition: var(--transition) !important;
        }

        .home-navbar.scrolled .navbar-brand img {
          height: 35px !important;
        }

        .home-navbar .nav-link {
          color: var(--white) !important;
          font-weight: 500 !important;
          margin: 0 1rem !important;
          transition: var(--transition) !important;
          position: relative !important;
        }

        .home-navbar .nav-link::after {
          content: '' !important;
          position: absolute !important;
          bottom: -5px !important;
          left: 0 !important;
          width: 0 !important;
          height: 2px !important;
          background: var(--secondary) !important;
          transition: width 0.3s ease !important;
        }

        .home-navbar .nav-link:hover::after {
          width: 100% !important;
        }

        .home-navbar .btn-signup {
          background: var(--secondary) !important;
          color: var(--dark) !important;
          border: none !important;
          border-radius: 50px !important;
          padding: 0.5rem 1.5rem !important;
          font-weight: 600 !important;
          transition: var(--transition) !important;
        }

        .home-navbar .btn-signup:hover {
          background: var(--secondary-dark) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 5px 15px rgba(255, 193, 0, 0.3) !important;
        }

        .home-navbar .btn-login {
          color: var(--white) !important;
          border: 2px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 50px !important;
          padding: 0.5rem 1.5rem !important;
          font-weight: 600 !important;
          transition: var(--transition) !important;
          margin-right: 0.5rem !important;
        }

        .home-navbar .btn-login:hover {
          border-color: var(--secondary) !important;
          color: var(--secondary) !important;
        }

        /* Preloader */
        .home-preloader {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: var(--white) !important;
          z-index: 9999 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }

        .home-preloader .spinner {
          width: 60px !important;
          height: 60px !important;
          border: 4px solid rgba(68, 0, 255, 0.1) !important;
          border-top-color: var(--primary) !important;
          border-right-color: var(--secondary) !important;
          border-radius: 50% !important;
          animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Hero Carousel - Full Width */
        .home-hero-carousel {
          position: relative !important;
          width: 100vw !important;
          /* svh accounts for mobile browser chrome; 100vh overflows on iOS.
             Capped so the hero doesn't dwarf content on tall desktop screens. */
          height: clamp(560px, 92svh, 900px) !important;
          overflow: hidden !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
        }

        .home-hero-carousel .carousel,
        .home-hero-carousel .carousel-inner,
        .home-hero-carousel .carousel-item {
          height: 100% !important;
          width: 100% !important;
        }

        .home-hero-carousel .carousel-item {
          position: relative !important;
        }

        .home-hero-carousel .carousel-item img {
          height: 100% !important;
          width: 100% !important;
          object-fit: cover !important;
          /* Desaturate rather than only darken: keeps the photo readable as
             texture while letting the brand colours in the scrim dominate. */
          filter: brightness(0.62) saturate(0.65) !important;
          transform: scale(1.04) !important;
          transition: transform 9s var(--pas-ease) !important;
        }

        .home-hero-carousel .carousel-item.active img {
          transform: scale(1.12) !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .home-hero-carousel .carousel-item img,
          .home-hero-carousel .carousel-item.active img {
            transform: none !important;
            transition: none !important;
          }
        }

        .home-hero-carousel .carousel-item::before {
          content: '' !important;
          position: absolute !important;
          inset: 0 !important;
          z-index: 1 !important;
          /* Brand wash + directional scrim. The vertical gradient is what
             actually guarantees text contrast; the radial tints carry the
             identity. Text no longer relies on text-shadow to stay legible. */
          background:
            radial-gradient(60% 70% at 20% 20%, rgba(68, 0, 255, 0.42) 0%, transparent 62%),
            radial-gradient(45% 60% at 88% 82%, rgba(255, 193, 0, 0.16) 0%, transparent 60%),
            linear-gradient(180deg,
              rgba(18, 16, 26, 0.42) 0%,
              rgba(18, 16, 26, 0.55) 45%,
              rgba(18, 16, 26, 0.80) 100%) !important;
        }

        .home-hero-carousel .carousel-caption {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          /* translate3d promotes to its own layer, so text rasterises
             crisply over the animating background image instead of being
             resampled with it. */
          transform: translate3d(-50%, -54%, 0) !important;
          width: 100% !important;
          max-width: 1100px !important;
          padding: 2rem clamp(1rem, 5vw, 3rem) !important;
          /* Room for the search card that overlaps the hero's lower edge */
          padding-bottom: clamp(5rem, 12vh, 9rem) !important;
          z-index: 2 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          color: #ffffff !important;
          background: transparent !important;
          right: auto !important;
          bottom: auto !important;
        }

        .home-hero-carousel .hero-title {
          font-family: var(--pas-font-display) !important;
          font-size: clamp(2.15rem, 1rem + 4.6vw, 4.5rem) !important;
          font-weight: 800 !important;
          margin: 0 auto 1.25rem !important;
          /* A capped measure is what fixes the ragged alignment: without it
             the headline runs the full 1100px and breaks unevenly. */
          max-width: 17ch !important;
          letter-spacing: -0.032em !important;
          line-height: 1.06 !important;
          color: #ffffff !important;
          text-wrap: balance !important;
          /* One tight shadow for edge definition. The old 2px/8px blur was
             what made the type read as soft — the scrim now does the
             contrast work, so this only needs to crisp the edges. */
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35) !important;
        }

        .home-hero-carousel .hero-title span {
          color: var(--secondary) !important;
          position: relative !important;
          display: inline-block !important;
        }

        .home-hero-carousel .hero-title span::after {
          content: '' !important;
          position: absolute !important;
          bottom: -5px !important;
          left: 0 !important;
          width: 100% !important;
          height: 4px !important;
          background: var(--secondary) !important;
          transform: scaleX(0) !important;
          animation: underline 1s ease forwards 0.5s !important;
        }

        @keyframes underline {
          to { transform: scaleX(1); }
        }

        .home-hero-carousel .hero-subtitle {
          font-family: var(--pas-font-body) !important;
          font-size: clamp(1rem, 0.9rem + 0.65vw, 1.3rem) !important;
          line-height: 1.55 !important;
          margin: 0 auto 2rem !important;
          max-width: 52ch !important;
          font-weight: 400 !important;
          color: rgba(255, 255, 255, 0.88) !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }

        .home-hero-carousel .hero-cta {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          padding: 1rem 3rem !important;
          font-size: 1.2rem !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
          color: var(--dark) !important;
          background: var(--secondary) !important;
          border: none !important;
          border-radius: 50px !important;
          transition: var(--transition) !important;
          box-shadow: 0 10px 30px rgba(255, 193, 0, 0.4) !important;
          text-decoration: none !important;
        }

        .home-hero-carousel .hero-cta:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 15px 40px rgba(255, 193, 0, 0.5) !important;
          background: var(--secondary-dark) !important;
          color: var(--dark) !important;
        }

        .home-hero-carousel .hero-cta i {
          transition: transform 0.3s ease !important;
        }

        .home-hero-carousel .hero-cta:hover i {
          transform: translateX(5px) !important;
        }

        .home-hero-carousel .carousel-control-prev,
        .home-hero-carousel .carousel-control-next {
          width: 60px !important;
          height: 60px !important;
          background: rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(5px) !important;
          border-radius: 50% !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          opacity: 0 !important;
          transition: var(--transition) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
        }

        .home-hero-carousel:hover .carousel-control-prev,
        .home-hero-carousel:hover .carousel-control-next {
          opacity: 1 !important;
        }

        .home-hero-carousel .carousel-control-prev {
          left: 30px !important;
        }

        .home-hero-carousel .carousel-control-next {
          right: 30px !important;
        }

        .home-hero-carousel .carousel-control-prev:hover,
        .home-hero-carousel .carousel-control-next:hover {
          background: var(--secondary) !important;
          border-color: var(--secondary) !important;
        }

        .home-hero-carousel .carousel-control-prev:hover .carousel-control-prev-icon,
        .home-hero-carousel .carousel-control-next:hover .carousel-control-next-icon {
          filter: brightness(0) !important;
        }

        .home-hero-carousel .carousel-indicators {
          bottom: 30px !important;
          z-index: 3 !important;
          margin-bottom: 0 !important;
        }

        .home-hero-carousel .carousel-indicators button {
          width: 50px !important;
          height: 5px !important;
          border-radius: 5px !important;
          background: rgba(255, 255, 255, 0.5) !important;
          border: none !important;
          margin: 0 5px !important;
          transition: var(--transition) !important;
        }

        .home-hero-carousel .carousel-indicators button.active {
          background: var(--secondary) !important;
          width: 70px !important;
        }

        /* Search Section - Full Width */
        .home-search-section {
          position: relative !important;
          width: 100vw !important;
          /* Pull the card up so it straddles the hero's lower edge. The hero
             caption reserves matching bottom padding so nothing collides. */
          margin-top: clamp(-7rem, -6vw, -4rem) !important;
          margin-bottom: clamp(1.5rem, 3vw, 3rem) !important;
          z-index: 10 !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          padding: 0 clamp(1rem, 4vw, 2rem) !important;
          background: transparent !important;
        }

        .home-search-card {
          background: #ffffff !important;
          border-radius: var(--pas-radius-lg) !important;
          /* Deeper than the standard elevation scale on purpose: this card
             sits over a photograph and needs to read as lifted off it. */
          box-shadow: 0 24px 60px rgba(18, 16, 26, 0.22),
                      0 6px 16px rgba(18, 16, 26, 0.10) !important;
          padding: clamp(1.75rem, 4vw, 2.75rem) !important;
          border: 1px solid var(--pas-line) !important;
          max-width: 860px !important;
          margin: 0 auto !important;
          text-align: center !important;
        }

        .home-search-title {
          font-family: var(--pas-font-display) !important;
          font-size: clamp(1.35rem, 1.1rem + 0.9vw, 1.85rem) !important;
          font-weight: 700 !important;
          letter-spacing: -0.022em !important;
          /* Ink rather than indigo: the indigo is spent on the button, which
             is the action. A coloured heading competes with it. */
          color: var(--pas-ink) !important;
          margin: 0 0 0.4rem !important;
        }

        .home-search-subtitle {
          color: var(--pas-slate) !important;
          font-size: 1rem !important;
          margin: 0 auto 1.5rem !important;
          max-width: 46ch !important;
        }

        /* One pill containing field + button, centred under the heading.
           Reads as a single control rather than two adjacent ones. */
        .home-search-form {
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          width: 100% !important;
          max-width: 620px !important;
          margin: 0 auto !important;
          padding: 0.4rem !important;
          background: var(--pas-mist) !important;
          border: 1px solid var(--pas-line) !important;
          border-radius: var(--pas-radius-pill) !important;
          transition: border-color var(--pas-duration-fast) var(--pas-ease),
                      box-shadow var(--pas-duration-fast) var(--pas-ease) !important;
        }

        .home-search-form:focus-within {
          border-color: var(--pas-indigo) !important;
          box-shadow: 0 0 0 3px rgba(68, 0, 255, 0.16) !important;
        }

        .home-search-input {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          border: 0 !important;
          background: transparent !important;
          padding: 0.7rem 1.1rem !important;
          font-family: var(--pas-font-body) !important;
          font-size: 1rem !important;
          color: var(--pas-ink) !important;
        }

        .home-search-input::placeholder { color: var(--pas-muted) !important; }
        .home-search-input:focus { outline: none !important; box-shadow: none !important; }

        @media (max-width: 575.98px) {
          .home-search-form {
            flex-direction: column !important;
            border-radius: var(--pas-radius-lg) !important;
            padding: 0.75rem !important;
          }
          .home-search-input { width: 100% !important; text-align: center !important; }
          .home-search-button { width: 100% !important; }
        }

        .home-search-button {
          background: var(--primary) !important;
          color: var(--white) !important;
          border: none !important;
          border-radius: 50px !important;
          padding: 1rem 2rem !important;
          font-weight: 600 !important;
          transition: var(--transition) !important;
          white-space: nowrap !important;
          height: auto !important;
        }

        .home-search-button:hover {
          background: var(--primary-dark) !important;
          transform: translateX(5px) !important;
          color: var(--white) !important;
        }

        /* Services Section - Full Width - NEW */
        .home-services-section {
          padding: 6rem 2rem !important;
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
          position: relative !important;
          overflow: hidden !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
        }

        .home-services-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 0% 0%, rgba(68, 0, 255, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }

        .home-service-card {
          background: var(--white) !important;
          border-radius: var(--border-radius-lg) !important;
          overflow: hidden !important;
          box-shadow: var(--shadow-md) !important;
          transition: var(--transition) !important;
          height: 100% !important;
          position: relative !important;
          z-index: 1 !important;
          border: none !important;
          text-align: center !important;
          padding: 2.5rem 2rem !important;
        }

        .home-service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary), var(--secondary));
          transition: var(--transition);
        }

        .home-service-card:hover {
          transform: translateY(-15px) !important;
          box-shadow: var(--shadow-hover) !important;
        }

        .home-service-card:hover::before {
          height: 6px;
        }

        .service-icon-wrapper {
          width: 90px !important;
          height: 90px !important;
          margin: 0 auto 1.5rem !important;
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.1), rgba(255, 193, 0, 0.1)) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: var(--transition) !important;
        }

        .home-service-card:hover .service-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
          background: linear-gradient(135deg, rgba(68, 0, 255, 0.2), rgba(255, 193, 0, 0.2)) !important;
        }

        .service-icon {
          font-size: 2.5rem !important;
          color: var(--primary) !important;
        }

        .service-title {
          font-size: 1.75rem !important;
          font-weight: 800 !important;
          margin-bottom: 1rem !important;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .service-subtitle {
          color: var(--gray) !important;
          font-size: 1rem !important;
          line-height: 1.6 !important;
          margin-bottom: 0 !important;
        }

        .service-badges {
          display: flex !important;
          flex-wrap: wrap !important;
          gap: 0.5rem !important;
          justify-content: center !important;
          margin-top: 1.5rem !important;
        }

        .service-badge {
          background: rgba(68, 0, 255, 0.1) !important;
          color: var(--primary) !important;
          padding: 0.35rem 0.75rem !important;
          border-radius: 50px !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
        }

      /* Service Card CTA Button */
      .service-cta-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        margin-top: 1.5rem !important;
        padding: 0.6rem 1.5rem !important;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%) !important;
        color: var(--white) !important;
        border: none !important;
        border-radius: 50px !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        text-decoration: none !important;
        transition: var(--transition) !important;
        box-shadow: 0 4px 12px rgba(68, 0, 255, 0.2) !important;
      }

      .service-cta-btn:hover {
        transform: translateX(5px) !important;
        background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%) !important;
        box-shadow: 0 6px 18px rgba(68, 0, 255, 0.35) !important;
        color: var(--white) !important;
      }

      .service-cta-btn i {
        transition: transform 0.3s ease !important;
      }

      .service-cta-btn:hover i {
        transform: translateX(3px) !important;
      }

        /* Categories Section - Full Width */
        .home-categories-section {
          padding: 6rem 2rem !important;
          background: var(--light) !important;
          position: relative !important;
          overflow: hidden !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
        }

        .home-section-header {
          text-align: center !important;
          margin-bottom: 3rem !important;
          position: relative !important;
          z-index: 1 !important;
          max-width: 1200px !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .home-section-title {
          font-size: 2.5rem !important;
          font-weight: 700 !important;
          margin-bottom: 1rem !important;
          position: relative !important;
          display: inline-block !important;
          color: var(--primary) !important;
        }
        
        .home-section-title2 {
          font-size: 2.5rem !important;
          font-weight: 700 !important;
          color: var(--white) !important;
          margin-bottom: 1rem !important;
          position: relative !important;
          display: inline-block !important;
          color: var(--light) !important;
        }

        .home-section-title::after {
          content: '' !important;
          position: absolute !important;
          bottom: -10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 80px !important;
          height: 4px !important;
          background: var(--gradient-secondary) !important;
          border-radius: 2px !important;
        }

        .home-section-subtitle {
          font-size: 1.2rem !important;
          color: var(--warning) !important;
          max-width: 700px !important;
          margin: 0 auto !important;
        }

        .home-category-card {
          background: var(--white) !important;
          border-radius: var(--border-radius) !important;
          overflow: hidden !important;
          box-shadow: var(--shadow-md) !important;
          transition: var(--transition) !important;
          height: 100% !important;
          position: relative !important;
          z-index: 1 !important;
          border: none !important;
        }

        .home-category-card:hover {
          transform: translateY(-15px) !important;
          box-shadow: var(--shadow-hover) !important;
        }

        .home-category-card .card-img-wrapper {
          position: relative !important;
          overflow: hidden !important;
          height: 220px !important;
        }

        .home-category-card .card-img-wrapper img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transition: transform 0.5s ease !important;
        }

        .home-category-card:hover .card-img-wrapper img {
          transform: scale(1.1) !important;
        }

        .home-category-card .card-body {
          padding: 1.5rem !important;
          text-align: center !important;
        }

        .home-category-card .card-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          margin-bottom: 0.75rem !important;
          color: var(--dark) !important;
        }

        .home-category-card .card-text {
          color: var(--gray) !important;
          font-size: 0.95rem !important;
          margin-bottom: 1.5rem !important;
          line-height: 1.6 !important;
        }

        .home-category-card .btn-category {
          background: transparent !important;
          color: var(--primary) !important;
          border: 2px solid var(--primary) !important;
          border-radius: 50px !important;
          padding: 0.5rem 1.5rem !important;
          font-weight: 600 !important;
          transition: var(--transition) !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
        }

        .home-category-card .btn-category:hover {
          background: var(--primary) !important;
          color: var(--white) !important;
          transform: translateX(5px) !important;
        }

        .home-view-all-btn {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          padding: 0.75rem 2rem !important;
          background: transparent !important;
          color: var(--primary) !important;
          border: 2px solid var(--primary) !important;
          border-radius: 50px !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          transition: var(--transition) !important;
        }

        .home-view-all-btn:hover {
          background: var(--primary) !important;
          color: var(--white) !important;
          transform: translateX(5px) !important;
        }

        /* How It Works - Full Width */
        .home-how-it-works {
          background: var(--gradient-primary) !important;
          padding: 6rem 2rem !important;
          position: relative !important;
          overflow: hidden !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
        }

        .home-step-card {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: var(--border-radius-lg) !important;
          padding: 2.5rem !important;
          text-align: center !important;
          height: 100% !important;
          transition: var(--transition) !important;
          position: relative !important;
          z-index: 1 !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }

        .home-step-card:hover {
          transform: translateY(-15px) scale(1.02) !important;
          box-shadow: 0 30px 50px rgba(0, 0, 0, 0.3) !important;
        }

        .home-step-card .step-icon {
          width: 100px !important;
          height: 100px !important;
          margin: 0 auto 1.5rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: var(--light) !important;
          border-radius: 50% !important;
          transition: var(--transition) !important;
          position: relative !important;
        }

        .home-step-card:hover .step-icon {
          transform: rotateY(180deg) !important;
          background: var(--gradient-secondary) !important;
        }

        .home-step-card .step-icon img {
          width: 50px !important;
          height: 50px !important;
          object-fit: contain !important;
        }

        .home-step-card .step-number {
          position: absolute !important;
          top: -10px !important;
          right: -10px !important;
          width: 30px !important;
          height: 30px !important;
          background: var(--secondary) !important;
          color: var(--dark) !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 700 !important;
          font-size: 1rem !important;
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2) !important;
        }

        .home-step-card h4 {
          color: var(--primary) !important;
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin-bottom: 1rem !important;
        }

        .home-step-card p {
          color: var(--gray) !important;
          line-height: 1.6 !important;
          margin-bottom: 0 !important;
        }

        /* Blog Section - Full Width */
        .home-blog-section {
          padding: 6rem 2rem !important;
          background: var(--white) !important;
          position: relative !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
        }

        .home-blog-card {
          background: var(--white) !important;
          border-radius: var(--border-radius) !important;
          overflow: hidden !important;
          box-shadow: var(--shadow-md) !important;
          transition: var(--transition) !important;
          height: 100% !important;
          position: relative !important;
          border: none !important;
        }

        .home-blog-card:hover {
          transform: translateY(-10px) !important;
          box-shadow: var(--shadow-hover) !important;
        }

        .home-blog-card .card-img-wrapper {
          position: relative !important;
          overflow: hidden !important;
          height: 200px !important;
        }

        .home-blog-card .card-img-wrapper img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transition: transform 0.5s ease !important;
        }

        .home-blog-card:hover .card-img-wrapper img {
          transform: scale(1.1) !important;
        }

        .home-blog-card .card-img-wrapper .category-badge {
          position: absolute !important;
          top: 1rem !important;
          left: 1rem !important;
          background: var(--secondary) !important;
          color: var(--dark) !important;
          padding: 0.25rem 1rem !important;
          border-radius: 50px !important;
          font-size: 0.75rem !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.5px !important;
          z-index: 2 !important;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
        }

        .home-blog-card .card-body {
          padding: 1.5rem !important;
        }

        .home-blog-card .post-meta {
          display: flex !important;
          align-items: center !important;
          gap: 1rem !important;
          margin-bottom: 1rem !important;
          font-size: 0.85rem !important;
          color: var(--gray) !important;
        }

        .home-blog-card .post-meta i {
          margin-right: 0.25rem !important;
          color: var(--primary) !important;
        }

        .home-blog-card .post-title {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          margin-bottom: 1rem !important;
          line-height: 1.4 !important;
          color: var(--dark) !important;
          transition: var(--transition) !important;
        }

        .home-blog-card .post-title a {
          color: inherit !important;
          text-decoration: none !important;
        }

        .home-blog-card .post-title:hover {
          color: var(--primary) !important;
        }

        .home-blog-card .post-excerpt {
          color: var(--gray) !important;
          font-size: 0.95rem !important;
          line-height: 1.6 !important;
          margin-bottom: 1.5rem !important;
        }

        .home-blog-card .read-more {
          color: var(--primary) !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          transition: var(--transition) !important;
        }

        .home-blog-card .read-more:hover {
          gap: 0.75rem !important;
          color: var(--secondary) !important;
        }

        /* CTA Section - Full Width */
        .home-cta-section {
          background: var(--gradient-secondary) !important;
          padding: 5rem 2rem !important;
          position: relative !important;
          overflow: hidden !important;
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
        }

        .home-cta-title {
          font-size: 2.5rem !important;
          font-weight: 700 !important;
          color: var(--primary) !important;
          margin-bottom: 1rem !important;
        }

        .home-cta-subtitle {
          font-size: 1.2rem !important;
          color: var(--dark) !important;
          margin-bottom: 2rem !important;
        }

        .home-cta-button {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          padding: 1rem 2.5rem !important;
          background: var(--primary) !important;
          color: var(--white) !important;
          border: none !important;
          border-radius: 50px !important;
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          text-decoration: none !important;
          transition: var(--transition) !important;
          box-shadow: 0 10px 20px rgba(68, 0, 255, 0.3) !important;
        }

        .home-cta-button:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 15px 30px rgba(68, 0, 255, 0.4) !important;
          background: var(--primary-dark) !important;
          color: var(--white) !important;
        }

        .home-cta-button i {
          transition: transform 0.3s ease !important;
        }

        .home-cta-button:hover i {
          transform: translateX(5px) !important;
        }

        /* Container adjustments */
        .container {
          max-width: 1200px !important;
          margin: 0 auto !important;
          padding: 0 1rem !important;
        }

        /* Responsive */
        @media (max-width: 991px) {
          .home-hero-carousel .hero-title {
            font-size: 2.5rem !important;
          }
          .home-hero-carousel .hero-subtitle {
            font-size: 1.2rem !important;
          }
          .home-search-section {
            margin-top: -30px !important;
          }
          .home-search-card {
            padding: 1.5rem !important;
          }
          .home-section-title {
            font-size: 2rem !important;
          }
          .service-title {
            font-size: 1.5rem !important;
          }
        }

        @media (max-width: 768px) {
          .home-navbar {
            padding: 1rem !important;
          }
          .home-hero-carousel .hero-title {
            font-size: 2rem !important;
          }
          .home-hero-carousel .hero-cta {
            padding: 0.75rem 2rem !important;
            font-size: 1rem !important;
          }
          .home-hero-carousel .carousel-control-prev,
          .home-hero-carousel .carousel-control-next {
            display: none !important;
          }
          .home-search-card {
            padding: 1.5rem !important;
          }
          .home-search-title {
            font-size: 1.5rem !important;
          }
          .home-step-card {
            padding: 1.5rem !important;
          }
          .home-step-card .step-icon {
            width: 80px !important;
            height: 80px !important;
          }
          .home-step-card .step-icon img {
            width: 40px !important;
            height: 40px !important;
          }
          .home-cta-title {
            font-size: 2rem !important;
          }
          .service-icon-wrapper {
            width: 70px !important;
            height: 70px !important;
          }
          .service-icon {
            font-size: 2rem !important;
          }
        }

        @media (max-width: 576px) {
          .home-hero-carousel .hero-title {
            font-size: 1.5rem !important;
          }
          .home-hero-carousel .hero-subtitle {
            font-size: 1rem !important;
          }
          .home-hero-carousel .hero-cta {
            padding: 0.5rem 1.5rem !important;
            font-size: 0.9rem !important;
          }
          .home-section-title {
            font-size: 1.75rem !important;
          }
          .home-section-subtitle {
            font-size: 1rem !important;
          }
          .home-category-card .card-img-wrapper {
            height: 180px !important;
          }
        }
      `}</style>

      {/* Preloader */}
      {showPreloader && (
        <div className="home-preloader">
          <div className="spinner"></div>
        </div>
      )}

      {/* Hero Carousel with Parallax */}
      <div ref={heroRef} className="home-hero-carousel">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="carousel slide carousel-fade"
          data-bs-ride="carousel"
        >
          <div className="carousel-inner">
            <div className={`carousel-item ${activeSlide === 0 ? 'active' : ''}`}>
              <img src={slider1} className="d-block w-100" alt="Slide 1" />
              <div className="carousel-caption">
                <motion.h5 
                  className="hero-title"
                  initial={{ opacity: 0, y: 50 }}
                  animate={activeSlide === 0 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Pass Exams with <span>Confidence</span>
                </motion.h5>
                <motion.p 
                  className="hero-subtitle"
                  initial={{ opacity: 0, y: 50 }}
                  animate={activeSlide === 0 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  Smart preparation tools and practice tests for better results.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={activeSlide === 0 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  <Link to="/register" className="hero-cta">
                    Get Started Now! <i className="bi bi-arrow-right"></i>
                  </Link>
                </motion.div>
              </div>
            </div>
            <div className={`carousel-item ${activeSlide === 1 ? 'active' : ''}`}>
              <img src={slider2} className="d-block w-100" alt="Slide 2" />
              <div className="carousel-caption">
                <motion.h5 
                  className="hero-title"
                  initial={{ opacity: 0, y: 50 }}
                  animate={activeSlide === 1 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  Boost Careers. <span>Build Skills.</span>
                </motion.h5>
                <motion.p 
                  className="hero-subtitle"
                  initial={{ opacity: 0, y: 50 }}
                  animate={activeSlide === 1 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  Learn practical skills and prepare for interviews professionally
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={activeSlide === 1 ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7, duration: 0.6 }}
                >
                  <Link to="/exams" className="hero-cta">
                    Explore Exams <i className="bi bi-arrow-right"></i>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>

          <button className="carousel-control-prev" type="button" onClick={() => setActiveSlide((prev) => (prev - 1 + 2) % 2)}>
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" onClick={() => setActiveSlide((prev) => (prev + 1) % 2)}>
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>

          <div className="carousel-indicators">
            <button 
              type="button" 
              className={activeSlide === 0 ? 'active' : ''} 
              onClick={() => setActiveSlide(0)}
            ></button>
            <button 
              type="button" 
              className={activeSlide === 1 ? 'active' : ''} 
              onClick={() => setActiveSlide(1)}
            ></button>
          </div>
        </motion.div>
      </div>

      {/* Search Section */}
      <section className="home-search-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <motion.div 
                className="home-search-card"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <h3 className="home-search-title">Find Your Path</h3>
                <p className="home-search-subtitle">Search for interviews, exams, and more</p>
                <form onSubmit={handleSearch} className="home-search-form">
                  <input 
                    type="text" 
                    className="home-search-input" 
                    placeholder="e.g., Software Engineer Interview, JAMB, WAEC..." 
                    aria-label="Search interviews, exams and study material"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="home-search-button">
                    <i className="bi bi-search me-2"></i>Search
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

     {/* Services Section - NEW */}
<section className="home-services-section">
  <div className="container">
    <div className="home-section-header" data-aos="fade-up">
      <h2 className="home-section-title">Our Services</h2>
      <p className="home-section-subtitle">Comprehensive preparation for your success journey</p>
    </div>

    <div className="row g-4">
      {/* Card 1 - Exams */}
      <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="100">
        <motion.div 
          className="home-service-card"
          whileHover={{ y: -15 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="service-icon-wrapper">
            <i className="bi bi-journal-bookmark-fill service-icon"></i>
          </div>
          <h3 className="service-title">Exams</h3>
          <p className="service-subtitle">
             Comprehensive exam preparation for students at all academic levels, from secondary to entrance
          </p>
          <div className="service-badges">
            <span className="service-badge">JSSCE</span>
            <span className="service-badge">WAEC</span>
            <span className="service-badge">NECO</span>
            <span className="service-badge">UTME/JAMB</span>
            <span className="service-badge">POST-UTME</span>
          </div>
          <Link to="/exams" className="service-cta-btn">
            Explore Exams <i className="bi bi-arrow-right"></i>
          </Link>
        </motion.div>
      </div>

      {/* Card 2 - Careers */}
      <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="200">
        <motion.div 
          className="home-service-card"
          whileHover={{ y: -15 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="service-icon-wrapper">
            <i className="bi bi-briefcase-fill service-icon"></i>
          </div>
          <h3 className="service-title">Careers</h3>
          <p className="service-subtitle">
            Career preparation and professional development
          </p>
          <div className="service-badges">
            <span className="service-badge">Aptitude Tests</span>
            <span className="service-badge">Interview Prep</span>
            <span className="service-badge">Civil Service Exams</span>
            <span className="service-badge">Campus Recruitment</span>
          </div>
          <Link to="/careers" className="service-cta-btn">
            Explore Careers <i className="bi bi-arrow-right"></i>
          </Link>
        </motion.div>
      </div>

      {/* Card 3 - Skills */}
      <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="300">
        <motion.div 
          className="home-service-card"
          whileHover={{ y: -15 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="service-icon-wrapper">
            <i className="bi bi-palette-fill service-icon"></i>
          </div>
          <h3 className="service-title">Skills</h3>
          <p className="service-subtitle">
            Essential skills for career advancement
          </p>
          <div className="service-badges">
            <span className="service-badge">Typing Skills</span>
            <span className="service-badge">Resume Builder</span>
            <span className="service-badge">Cover Letter</span>
            <span className="service-badge">Referrals Network</span>
            <span className="service-badge">LinkedIn Optimization</span>
          </div>
          <Link to="/skills" className="service-cta-btn">
            Explore Skills <i className="bi bi-arrow-right"></i>
          </Link>
        </motion.div>
      </div>
    </div>
  </div>
</section>

      {/* Categories Section */}
      <section className="home-categories-section">
        <div className="container">
          <div className="home-section-header" data-aos="fade-up">
            <h2 className="home-section-title">Popular Interview Categories</h2>
            <p className="home-section-subtitle">Choose from our wide range of interview preparation materials</p>
          </div>

          <div className="row g-4">
            {loading ? (
              [1, 2, 3].map((item) => (
                <div key={item} className="col-md-6 col-lg-4">
                  <div className="home-category-card">
                    <div className="card-img-wrapper" style={{ height: '200px', backgroundColor: '#f0f0f0' }}>
                      <div className="placeholder-glow h-100 d-flex align-items-center justify-content-center">
                        <span className="placeholder col-12 h-100"></span>
                      </div>
                    </div>
                    <div className="card-body">
                      <h5 className="placeholder-glow">
                        <span className="placeholder col-8"></span>
                      </h5>
                      <p className="placeholder-glow">
                        <span className="placeholder col-12"></span>
                        <span className="placeholder col-10"></span>
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : products && products.length > 0 ? (
              products.slice(0, 6).map((product, index) => (
                <motion.div 
                  key={product.id}
                  className="col-md-6 col-lg-4 d-flex align-items-stretch"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="home-category-card w-100">
                    <div className="card-img-wrapper">
                      <img 
                        src={product.image || 'https://via.placeholder.com/400x300?text=Interview+Prep'} 
                        alt={product.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x300?text=Interview+Preparation';
                        }}
                      />
                    </div>
                    <div className="card-body">
                      <h5 className="card-title">{product.name}</h5>
                      <p className="card-text">
                        {product.description && product.description.length > 120 
                          ? `${product.description.substring(0, 120)}...` 
                          : product.description || 'Prepare for your interview with our comprehensive question bank and practice materials.'}
                      </p>
                      <Link to={`/interview/${product.slug}`} className="btn-category">
                        Start Practicing <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-12 text-center py-5">
                <div className="alert alert-info" role="alert">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Interview categories are being prepared. Please check back soon!
                </div>
              </div>
            )}
          </div>

          {!loading && products && products.length > 6 && (
            <div className="text-center mt-5" data-aos="fade-up">
              <Link to="/interview-levels" className="home-view-all-btn">
                View All Categories <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="home-how-it-works">
        <div className="container">
          <div className="home-section-header text-white" data-aos="fade-up">
            <h2 className="home-section-title2">How It Works</h2>
            <p className="home-section-subtitle text-warning">Your journey to interview success in three simple steps</p>
          </div>

          <div className="row g-4">
            {[
              { icon: signUpIcon, title: '1. Sign Up', desc: 'Create your free account to access our platform and start your journey.', delay: 100 },
              { icon: subscriptionIcon, title: '2. Subscribe', desc: 'Choose a plan that suits you and unlock full access to all materials.', delay: 200 },
              { icon: successIcon, title: '3. Pass & Succeed', desc: 'Practice with our materials and ace your interviews with confidence.', delay: 300 }
            ].map((step, index) => (
              <div className="col-md-4" key={index} data-aos="fade-up" data-aos-delay={step.delay}>
                <motion.div 
                  className="home-step-card"
                  whileHover={{ y: -15, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="step-icon">
                    <img src={step.icon} alt={step.title} />
                    <span className="step-number">{index + 1}</span>
                  </div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="home-blog-section">
        <div className="container">
          <div className="home-section-header" data-aos="fade-up">
            <h2 className="home-section-title">Latest from Our Blog</h2>
            <p className="home-section-subtitle">Stay updated with interview tips and career advice</p>
          </div>

          <div className="row g-4">
            {posts.slice(0, 3).map((post, index) => (
              <motion.div 
                key={post.id}
                className="col-md-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="home-blog-card">
                  <div className="card-img-wrapper">
                    <img 
                      src={post.image || 'https://via.placeholder.com/400x250'} 
                      alt={post.title}
                    />
                    <span className="category-badge">Featured</span>
                  </div>
                  <div className="card-body">
                    <div className="post-meta">
                      <span>
                        <i className="bi bi-person-circle"></i> {post.author || 'Admin'}
                      </span>
                      <span>
                        <i className="bi bi-calendar"></i> {new Date(post.created_on || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <h5 className="post-title">
                      <Link to={`/blog/${post.slug || post.id}`}>{post.title}</Link>
                    </h5>
                    <p className="post-excerpt">
                      {post.content?.substring(0, 100) || 'Read our latest insights on interview preparation and career growth...'}
                    </p>
                    <Link to={`/blog/${post.slug || post.id}`} className="read-more">
                      Read More <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-5" data-aos="fade-up">
            <Link to="/blog" className="home-view-all-btn">
              View All Posts <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="home-cta-section">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="home-cta-title">Ready to Start Your Journey?</h2>
            <p className="home-cta-subtitle">Join thousands of successful candidates who passed their interviews with us</p>
            <Link to={user ? '/dashboard' : '/register'} className="home-cta-button">
              {user ? 'Go to Dashboard' : 'Create Free Account'} <i className="bi bi-arrow-right"></i>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Home;