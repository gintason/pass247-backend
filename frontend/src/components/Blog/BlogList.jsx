import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/client';
import { mediaUrl } from '../../config';
import AOS from 'aos';
import 'aos/dist/aos.css';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Use the correct API URL you set up earlier
      const response = await api.get('/api/blog/api/posts/');
      const data = response.data?.results ?? (Array.isArray(response.data) ? response.data : []);
      setPosts(data);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Posts', icon: 'bi-newspaper' },
    { id: 'interview-tips', name: 'Interview Tips', icon: 'bi-chat-dots' },
    { id: 'career-advice', name: 'Career Advice', icon: 'bi-briefcase' },
    { id: 'exam-prep', name: 'Exam Preparation', icon: 'bi-book' },
    { id: 'success-stories', name: 'Success Stories', icon: 'bi-star' },
    { id: 'industry-news', name: 'Industry News', icon: 'bi-globe' },
  ];

  // Featured = first 3 published posts
  const featuredPosts = posts.slice(0, 3);
  // Regular = the rest
  const regularPosts = posts.slice(3);

  const filteredRegular = regularPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.excerpt || post.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/800x400?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return mediaUrl(imagePath);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow-x: hidden !important; width: 100% !important; }

        :root {
          --primary: #4400ff;
          --primary-dark: #3300cc;
          --primary-light: #6a4cff;
          --secondary: #ffc100;
          --dark: #1a1a1a;
          --gray: #6c757d;
          --light: #f8f9fa;
          --white: #ffffff;
        }

        .blog-hero-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #4400ff 0%, #ff6b6b 100%) !important;
          padding: 5rem 2rem !important;
          min-height: 400px;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        .blog-hero-section::before {
          content: '';
          position: absolute;
          top: -50%; right: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: heroPulse 8s ease-in-out infinite;
        }
        @keyframes heroPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
        }
        .blog-hero-container { max-width: 1200px; margin: 0 auto; position: relative; z-index: 1; text-align: center; }
        .blog-hero-title { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; color: #fff; margin-bottom: 1.5rem; }
        .blog-hero-title span { color: var(--secondary); }
        .blog-hero-subtitle { font-size: clamp(1rem, 1.5vw, 1.2rem); max-width: 700px; margin: 0 auto 2rem; color: rgba(255,255,255,0.95); }
        .search-box { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 50px; padding: 0.25rem; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .search-box .input-group-text { background: transparent; border: none; padding-left: 1rem; }
        .search-box input { background: transparent; border: none; padding: 0.75rem 0; }
        .search-box input:focus { outline: none; box-shadow: none; }

        .blog-categories-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          background: #f8f9fa;
          padding: 2rem !important;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .blog-categories-container { max-width: 1200px; margin: 0 auto; }
        .categories-wrapper { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
        .category-btn { padding: 0.6rem 1.5rem; border-radius: 50px; font-weight: 500; transition: all 0.3s ease; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; }
        .category-btn.active { background: linear-gradient(135deg, #4400ff, #6a4cff); color: #fff; border: none; }
        .category-btn.inactive { background: transparent; border: 2px solid #e9ecef; color: #6c757d; }
        .category-btn.inactive:hover { border-color: #4400ff; color: #4400ff; transform: translateY(-2px); }

        .blog-featured-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          background: #fff;
          padding: 5rem 2rem !important;
        }
        .blog-featured-container { max-width: 1200px; margin: 0 auto; }
        .section-header { text-align: center; margin-bottom: 3rem; }
        .section-title { font-size: 2.5rem; font-weight: 800; color: #1a1a1a; margin-bottom: 1rem; position: relative; display: inline-block; }
        .section-title::after { content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); width: 80px; height: 4px; background: linear-gradient(90deg, #4400ff, #ff6b6b); border-radius: 2px; }
        .featured-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
        .featured-card { background: #fff; border-radius: 20px; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); }
        .featured-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(68,0,255,0.1); }
        .featured-image { width: 100%; height: 220px; object-fit: cover; }
        .featured-content { padding: 1.5rem; }
        .featured-meta { display: flex; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
        .category-badge { background: rgba(68,0,255,0.1); color: #4400ff; padding: 0.25rem 1rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }
        .read-time { font-size: 0.75rem; color: #6c757d; }
        .featured-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem; color: #1a1a1a; line-height: 1.4; }
        .featured-excerpt { font-size: 0.9rem; color: #6c757d; line-height: 1.6; margin-bottom: 1.5rem; }
        .featured-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
        .author-info { display: flex; flex-direction: column; }
        .author-name { font-size: 0.85rem; font-weight: 600; color: #495057; }
        .post-date { font-size: 0.7rem; color: #6c757d; }
        .read-more-btn { background: transparent; border: 2px solid #4400ff; color: #4400ff; padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 600; transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; }
        .read-more-btn:hover { background: #4400ff; color: #fff; }

        .blog-posts-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          background: #f8f9fa;
          padding: 5rem 2rem !important;
        }
        .blog-posts-container { max-width: 1200px; margin: 0 auto; }
        .posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
        .post-card { background: #fff; border-radius: 16px; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .post-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(68,0,255,0.1); }
        .post-image { width: 100%; height: 200px; object-fit: cover; }
        .post-content { padding: 1.25rem; }
        .post-status { display: inline-block; background: rgba(68,0,255,0.1); color: #4400ff; padding: 0.2rem 0.8rem; border-radius: 50px; font-size: 0.7rem; font-weight: 600; margin-bottom: 0.75rem; }
        .post-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem; color: #1a1a1a; line-height: 1.4; }
        .post-excerpt { font-size: 0.85rem; color: #6c757d; line-height: 1.5; margin-bottom: 1rem; }
        .post-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e9ecef; padding-top: 0.75rem; }
        .post-author { font-size: 0.75rem; color: #6c757d; }
        .post-link { color: #4400ff; text-decoration: none; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; }
        .post-link:hover { gap: 0.5rem; }

        .empty-state { text-align: center; padding: 4rem; }
        .empty-state i { font-size: 4rem; color: #dee2e6; margin-bottom: 1rem; display: block; }

        .blog-newsletter-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #4400ff 0%, #ff6b6b 100%);
          padding: 5rem 2rem !important;
          position: relative;
          overflow: hidden;
        }
        .blog-newsletter-container { max-width: 800px; margin: 0 auto; position: relative; z-index: 1; text-align: center; }
        .newsletter-title { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 1rem; }
        .newsletter-text { color: rgba(255,255,255,0.9); margin-bottom: 2rem; }
        .newsletter-form { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
        .newsletter-input { flex: 1; min-width: 250px; padding: 0.875rem 1.5rem; border: none; border-radius: 50px; font-size: 1rem; }
        .newsletter-input:focus { outline: none; }
        .newsletter-btn { background: var(--secondary); color: #1a1a1a; border: none; padding: 0.875rem 2rem; border-radius: 50px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; }
        .newsletter-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .privacy-note { font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 1rem; }

        @media (max-width: 768px) {
          .featured-grid, .posts-grid { grid-template-columns: 1fr !important; }
          .newsletter-form { flex-direction: column; }
        }
      `}</style>

      {/* Hero */}
      <section className="blog-hero-section">
        <div className="blog-hero-container">
          <motion.h1 className="blog-hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            Our <span>Blog</span>
          </motion.h1>
          <motion.p className="blog-hero-subtitle" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            Insights, tips, and success stories to help you ace your interviews and exams
          </motion.p>
          <motion.div className="search-box" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search text-primary"></i></span>
              <input type="text" className="form-control" placeholder="Search articles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="blog-categories-section">
        <div className="blog-categories-container">
          <div className="categories-wrapper">
            {categories.map((cat) => (
              <button key={cat.id} className={`category-btn ${selectedCategory === cat.id ? 'active' : 'inactive'}`} onClick={() => setSelectedCategory(cat.id)}>
                <i className={`bi ${cat.icon}`}></i> {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error state */}
      {error && (
        <div className="container py-4">
          <div className="alert alert-danger">{error}</div>
        </div>
      )}

      {/* Featured Posts — first 3 from API */}
      {featuredPosts.length > 0 && (
        <section className="blog-featured-section">
          <div className="blog-featured-container">
            <div className="section-header" data-aos="fade-up">
              <h2 className="section-title">Featured Articles</h2>
            </div>
            <div className="featured-grid">
              {featuredPosts.map((post, index) => (
                <motion.div className="featured-card" key={post.id} data-aos="fade-up" data-aos-delay={index * 100} whileHover={{ y: -8 }}>
                  <img src={getImageUrl(post.image)} className="featured-image" alt={post.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/800x400?text=No+Image'; }} />
                  <div className="featured-content">
                    <div className="featured-meta">
                      <span className="category-badge">Featured</span>
                      <span className="read-time"><i className="bi bi-clock me-1"></i> 5 min read</span>
                    </div>
                    <h5 className="featured-title">{post.title}</h5>
                    <p className="featured-excerpt">{post.excerpt || post.content?.substring(0, 120) + '...'}</p>
                    <div className="featured-footer">
                      <div className="author-info">
                        <span className="author-name"><i className="bi bi-person-circle me-1"></i> {post.author}</span>
                        <span className="post-date"><i className="bi bi-calendar me-1"></i> {formatDate(post.created_on)}</span>
                      </div>
                      <Link to={`/blog/${post.slug || post.id}`} className="read-more-btn">
                        Read More <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts — rest from API, filtered by search */}
      <section className="blog-posts-section">
        <div className="blog-posts-container">
          <div className="section-header" data-aos="fade-up">
            <h2 className="section-title">Latest Articles</h2>
          </div>

          {posts.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-journal-x"></i>
              <h5>No articles published yet</h5>
              <p className="text-muted">Check back soon!</p>
            </div>
          ) : filteredRegular.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-search"></i>
              <h5>No articles found</h5>
              <p className="text-muted">Try adjusting your search</p>
            </div>
          ) : (
            <div className="posts-grid">
              {filteredRegular.map((post, index) => (
                <motion.div className="post-card" key={post.id} data-aos="fade-up" data-aos-delay={index * 50} whileHover={{ y: -5 }}>
                  <img src={getImageUrl(post.image)} className="post-image" alt={post.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x250?text=No+Image'; }} />
                  <div className="post-content">
                    <span className="post-status">Published</span>
                    <h6 className="post-title">{post.title}</h6>
                    <p className="post-excerpt">{post.excerpt || post.content?.substring(0, 100) + '...'}</p>
                    <div className="post-footer">
                      <span className="post-author"><i className="bi bi-person-circle me-1"></i> {post.author}</span>
                      <Link to={`/blog/${post.slug || post.id}`} className="post-link">
                        Read <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="blog-newsletter-section">
        <div className="blog-newsletter-container">
          <h3 className="newsletter-title">Never Miss an Update</h3>
          <p className="newsletter-text">Subscribe and get the latest interview tips and exam strategies</p>
          <div className="newsletter-form">
            <input type="email" className="newsletter-input" placeholder="Enter your email address" />
            <button className="newsletter-btn">Subscribe <i className="bi bi-send ms-2"></i></button>
          </div>
          <p className="privacy-note"><i className="bi bi-shield-check me-1"></i>We respect your privacy. Unsubscribe at any time.</p>
        </div>
      </section>
    </>
  );
};

export default BlogList;
