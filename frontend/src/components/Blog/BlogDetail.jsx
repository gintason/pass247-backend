import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/client';
import { mediaUrl } from '../../config';
import AOS from 'aos';
import 'aos/dist/aos.css';

const BlogDetail = () => {
  const { id } = useParams(); // matches /blog/:id or /blog/:slug
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    window.scrollTo(0, 0);
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try fetching by pk first, then slug
      const url = `/api/blog/api/posts/${id}/`;
      const response = await api.get(url);
      setPost(response.data);

      // Fetch related posts (all posts, then exclude current)
      const allRes = await api.get('/api/blog/api/posts/');
      const all = allRes.data?.results ?? (Array.isArray(allRes.data) ? allRes.data : []);
      setRelatedPosts(all.filter((p) => String(p.id) !== String(id) && p.slug !== id).slice(0, 3));
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Post not found or could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/1200x600?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return mediaUrl(imagePath);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this article: ${post?.title}`;
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(post?.title)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
    };
    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([
        { id: comments.length + 1, name: 'You', avatar: 'https://via.placeholder.com/50', comment, date: 'Just now', likes: 0 },
        ...comments,
      ]);
      setComment('');
    }
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

  if (error || !post) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-exclamation-circle display-1 text-muted"></i>
        <h3 className="mt-3">{error || 'Post not found'}</h3>
        <Link to="/blog" className="btn btn-primary mt-3 rounded-pill px-4">
          <i className="bi bi-arrow-left me-2"></i>Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow-x: hidden !important; }
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

        .blog-detail-hero {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          position: relative;
          height: 500px;
          overflow: hidden;
        }
        .blog-detail-hero-image { width: 100%; height: 100%; object-fit: cover; }
        .blog-detail-hero-overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(68,0,255,0.85));
        }
        .blog-detail-hero-content { position: absolute; bottom: 0; left: 0; width: 100%; padding: 3rem 2rem; color: #fff; }
        .blog-detail-hero-container { max-width: 1200px; margin: 0 auto; }
        .blog-detail-category-badge { display: inline-block; background: var(--secondary); color: #1a1a1a; padding: 0.5rem 1rem; border-radius: 50px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
        .blog-detail-title { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; margin-bottom: 1rem; line-height: 1.3; }
        .blog-detail-meta { display: flex; flex-wrap: wrap; gap: 1.5rem; font-size: 0.9rem; opacity: 0.9; }
        .blog-detail-meta span { display: inline-flex; align-items: center; gap: 0.5rem; }

        .blog-detail-main {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          background: #fff;
          padding: 3rem 2rem !important;
        }
        .blog-detail-main-container { max-width: 1200px; margin: 0 auto; }

        .action-buttons { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .action-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 50px; font-weight: 500; transition: all 0.3s ease; cursor: pointer; background: transparent; border: 2px solid; }
        .action-btn.liked { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; border-color: transparent; }
        .action-btn.unliked { border-color: var(--primary); color: var(--primary); }
        .action-btn.saved { background: var(--secondary); color: #1a1a1a; border-color: transparent; }
        .action-btn.unsaved { border-color: var(--secondary); color: var(--secondary); }

        .share-dropdown { position: relative; }
        .share-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 50px; font-weight: 500; border: 2px solid #e9ecef; background: transparent; color: #6c757d; cursor: pointer; }
        .share-btn:hover { border-color: var(--primary); color: var(--primary); }
        .share-menu { position: absolute; top: 110%; left: 0; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); padding: 0.5rem; min-width: 180px; z-index: 10; display: none; }
        .share-dropdown:hover .share-menu { display: block; }
        .share-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; width: 100%; background: transparent; border: none; cursor: pointer; transition: all 0.3s ease; border-radius: 8px; }
        .share-item:hover { background: #f8f9fa; }

        .article-content { font-size: 1.05rem; line-height: 1.8; color: #4a5568; }
        .article-content h2 { color: var(--primary); font-size: 1.8rem; margin: 2rem 0 1rem; font-weight: 700; }
        .article-content h3 { color: #1a1a1a; font-size: 1.4rem; margin: 1.5rem 0 1rem; font-weight: 600; }
        .article-content p { margin-bottom: 1.5rem; }
        .article-content ul, .article-content ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
        .article-content li { margin-bottom: 0.5rem; }

        .tags-section { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e9ecef; }
        .tag-link { display: inline-block; background: #f8f9fa; color: #6c757d; padding: 0.4rem 1rem; border-radius: 50px; font-size: 0.85rem; text-decoration: none; transition: all 0.3s ease; margin: 0.25rem; }
        .tag-link:hover { background: var(--primary); color: white; }

        .author-bio-card { background: linear-gradient(135deg, #f8f9fa, #fff); border-radius: 20px; padding: 2rem; margin-top: 2rem; }
        .author-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
        .author-name { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.25rem; }
        .author-bio-text { color: #6c757d; font-size: 0.9rem; line-height: 1.6; margin: 0; }

        .comments-section { margin-top: 3rem; }
        .comments-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #1a1a1a; }
        .comment-form textarea { width: 100%; padding: 1rem; border: 2px solid #e9ecef; border-radius: 12px; resize: vertical; font-family: inherit; font-size: 0.95rem; }
        .comment-form textarea:focus { outline: none; border-color: var(--primary); }
        .submit-comment-btn { margin-top: 1rem; background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .submit-comment-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(68,0,255,0.3); }
        .comment-item { display: flex; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e9ecef; }
        .comment-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
        .comment-name { font-weight: 700; color: #1a1a1a; }
        .comment-date { font-size: 0.75rem; color: #6c757d; }
        .comment-text { color: #4a5568; margin-bottom: 0.5rem; line-height: 1.5; font-size: 0.95rem; }
        .comment-action-btn { background: none; border: none; color: #6c757d; font-size: 0.85rem; cursor: pointer; transition: color 0.3s ease; margin-right: 1rem; }
        .comment-action-btn:hover { color: var(--primary); }

        .sidebar { position: sticky; top: 100px; }
        .sidebar-card { background: #fff; border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); }
        .sidebar-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary); display: inline-block; }
        .related-post-item { display: flex; gap: 1rem; margin-bottom: 1rem; text-decoration: none; transition: transform 0.3s ease; }
        .related-post-item:hover { transform: translateX(5px); }
        .related-post-image { width: 80px; height: 60px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }
        .related-post-title { font-size: 0.9rem; font-weight: 600; color: #1a1a1a; margin-bottom: 0.25rem; line-height: 1.3; }
        .related-post-link { font-size: 0.8rem; color: var(--primary); }

        .newsletter-card { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; }
        .newsletter-input { width: 100%; padding: 0.75rem; border: none; border-radius: 50px; margin-bottom: 0.75rem; }
        .newsletter-input:focus { outline: none; }
        .newsletter-btn { width: 100%; background: var(--secondary); color: #1a1a1a; border: none; padding: 0.75rem; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .newsletter-btn:hover { transform: translateY(-2px); }

        .blog-navigation-section {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          background: #f8f9fa;
          padding: 2rem !important;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        .blog-navigation-container { max-width: 1200px; margin: 0 auto; }
        .nav-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 50px; font-weight: 500; transition: all 0.3s ease; cursor: pointer; text-decoration: none; }
        .nav-btn-primary { background: transparent; border: 2px solid var(--primary); color: var(--primary); }
        .nav-btn-primary:hover { background: var(--primary); color: white; }

        @media (max-width: 768px) {
          .blog-detail-hero { height: 350px; }
          .blog-detail-title { font-size: 1.5rem; }
          .sidebar { position: relative; top: 0; margin-top: 2rem; }
        }
        @media (max-width: 576px) {
          .blog-detail-meta { flex-direction: column; gap: 0.5rem; }
          .comment-item { flex-direction: column; }
        }
      `}</style>

      {/* Hero */}
      <div className="blog-detail-hero">
        <img src={getImageUrl(post.image)} alt={post.title} className="blog-detail-hero-image"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/1200x600?text=No+Image'; }} />
        <div className="blog-detail-hero-overlay"></div>
        <div className="blog-detail-hero-content">
          <div className="blog-detail-hero-container">
            <span className="blog-detail-category-badge">
              {post.status_label || 'Published'}
            </span>
            <h1 className="blog-detail-title">{post.title}</h1>
            <div className="blog-detail-meta">
              <span><i className="bi bi-person-circle"></i> {post.author}</span>
              <span><i className="bi bi-calendar"></i> {formatDate(post.created_on)}</span>
              <span><i className="bi bi-clock-history"></i> Updated {formatDate(post.updated_on)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="blog-detail-main">
        <div className="blog-detail-main-container">
          <div className="row g-5">

            {/* Article */}
            <div className="col-lg-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button className={`action-btn ${liked ? 'liked' : 'unliked'}`} onClick={() => setLiked(!liked)}>
                    <i className={`bi ${liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'}`}></i>
                    {liked ? 'Liked' : 'Like'}
                  </button>
                  <button className={`action-btn ${saved ? 'saved' : 'unsaved'}`} onClick={() => setSaved(!saved)}>
                    <i className={`bi ${saved ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <div className="share-dropdown">
                    <button className="share-btn"><i className="bi bi-share"></i> Share</button>
                    <div className="share-menu">
                      {['facebook', 'twitter', 'linkedin', 'whatsapp'].map((p) => (
                        <button key={p} className="share-item" onClick={() => handleShare(p)}>
                          <i className={`bi bi-${p} text-${p === 'twitter' ? 'info' : p === 'whatsapp' ? 'success' : 'primary'}`}></i>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Article body — renders HTML from Django */}
                <div className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />

                {/* Author Bio */}
                <div className="author-bio-card mt-4">
                  <div className="d-flex gap-3 align-items-start">
                    <img src="https://via.placeholder.com/80" alt={post.author} className="author-avatar" />
                    <div>
                      <h6 className="author-name">About {post.author}</h6>
                      <p className="author-bio-text">Author and contributor at PAS24/7.</p>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div className="comments-section">
                  <h5 className="comments-title">Comments ({comments.length})</h5>
                  <form onSubmit={handleCommentSubmit} className="comment-form">
                    <textarea rows="3" placeholder="Leave a comment..." value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
                    <button type="submit" className="submit-comment-btn">Post Comment <i className="bi bi-send ms-2"></i></button>
                  </form>
                  <div className="mt-4">
                    {comments.map((c) => (
                      <div key={c.id} className="comment-item">
                        <img src={c.avatar} alt={c.name} className="comment-avatar" />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between mb-1">
                            <span className="comment-name">{c.name}</span>
                            <span className="comment-date">{c.date}</span>
                          </div>
                          <p className="comment-text">{c.comment}</p>
                          <div>
                            <button className="comment-action-btn"><i className="bi bi-hand-thumbs-up me-1"></i>{c.likes}</button>
                            <button className="comment-action-btn">Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="sidebar">

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <div className="sidebar-card">
                    <h5 className="sidebar-title">Related Articles</h5>
                    {relatedPosts.map((related) => (
                      <Link to={`/blog/${related.slug || related.id}`} key={related.id} className="related-post-item">
                        <img src={getImageUrl(related.image)} alt={related.title} className="related-post-image"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/80x60'; }} />
                        <div>
                          <div className="related-post-title">{related.title}</div>
                          <div className="related-post-link">Read more →</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Newsletter */}
                <div className="sidebar-card newsletter-card">
                  <h5 className="sidebar-title text-white">Newsletter</h5>
                  <p className="small text-white-50 mb-3">Get the latest interview tips delivered to your inbox.</p>
                  <input type="email" className="newsletter-input" placeholder="Your email" />
                  <button className="newsletter-btn">Subscribe</button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="blog-navigation-section">
        <div className="blog-navigation-container">
          <button className="nav-btn nav-btn-primary" onClick={() => navigate('/blog')}>
            <i className="bi bi-arrow-left"></i> Back to Blog
          </button>
        </div>
      </div>
    </>
  );
};

export default BlogDetail;
