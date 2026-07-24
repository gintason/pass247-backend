import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import slider1 from '../../assets/slider1.png';

const Skills = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [typingStats, setTypingStats] = useState({ wpm: 42, accuracy: 92, lessonsDone: 3 });
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [lessonText, setLessonText] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonProgress, setLessonProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([1, 2, 3]);
  const inputRef = useRef(null);

  const lessons = [
    { id: 1, title: 'Home Row Keys (ASDF JKL;)', text: 'asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl;', wpm: 45, status: 'done' },
    { id: 2, title: 'Top Row Keys (QWERTY)', text: 'qwerty qwerty qwerty qwerty qwerty qwerty qwerty', wpm: 38, status: 'done' },
    { id: 3, title: 'Bottom Row Keys (ZXCV)', text: 'zxcv zxcv zxcv zxcv zxcv zxcv zxcv zxcv', wpm: 35, status: 'done' },
    { id: 4, title: 'Number Row (1-0)', text: '1234567890 1234567890 1234567890 1234567890', wpm: 0, status: 'start' },
    { id: 5, title: 'Capital Letters & Shift Key', text: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz', wpm: 0, status: 'start' },
    { id: 6, title: 'Common Words Practice', text: 'the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog', wpm: 0, status: 'start' },
    { id: 7, title: 'Sentence Typing — Beginner', text: 'This is a simple sentence to practice typing. Try to type it as fast as you can.', wpm: 0, status: 'start' },
    { id: 8, title: 'Sentence Typing — Intermediate', text: 'The quick brown fox jumps over the lazy dog near the riverbank on a sunny afternoon.', wpm: 0, status: 'start' },
    { id: 9, title: 'Paragraph Typing', text: 'Typing is an essential skill in the modern workplace. With practice, anyone can improve their speed and accuracy. Start with home row keys and gradually work your way up to more complex sentences.', wpm: 0, status: 'start' },
    { id: 10, title: 'Speed Test — 1 Minute', text: 'Practice makes perfect when it comes to typing. The more you type, the faster you become. Focus on accuracy first, then speed will follow naturally.', wpm: 0, status: 'start' },
  ];

  useEffect(() => { if (isTypingActive && inputRef.current) inputRef.current.focus(); }, [isTypingActive]);

  const startLesson = (lesson) => {
    setLessonText(lesson.text); setLessonTitle(lesson.title);
    setIsTypingActive(true); setUserInput(''); setStartTime(null); setLessonProgress(0);
  };

  const handleTypingChange = (e) => {
    const value = e.target.value; setUserInput(value);
    if (!startTime && value.length > 0) setStartTime(Date.now());
    setLessonProgress(Math.min((value.length / lessonText.length) * 100, 100));
    if (value.length >= lessonText.length && lessonText.length > 0) completeLesson();
  };

  const completeLesson = () => {
    const timeTaken = (Date.now() - startTime) / 1000 / 60;
    const wordsTyped = userInput.trim().split(/\s+/).length;
    const wpm = Math.round(wordsTyped / timeTaken);
    const accuracy = calculateAccuracy();
    setCompletedLessons([...completedLessons, currentLesson]);
    setTypingStats({ wpm: Math.max(typingStats.wpm, wpm), accuracy, lessonsDone: completedLessons.length + 1 });
    toast.success(`Lesson completed! WPM: ${wpm}, Accuracy: ${accuracy}%`);
    setIsTypingActive(false);
  };

  const calculateAccuracy = () => {
    let correct = 0;
    for (let i = 0; i < userInput.length; i++) if (userInput[i] === lessonText[i]) correct++;
    return Math.round((correct / lessonText.length) * 100);
  };

  const skillFeatures = [
    { icon: 'fas fa-keyboard', title: 'Typing Tutor', desc: 'Improve your typing speed and accuracy with 10 progressive lessons and real-time feedback.' },
    { icon: 'fas fa-file-pdf', title: 'Resume Builder', desc: 'Create professional ATS-friendly resumes with smart templates and AI suggestions.' },
    { icon: 'fas fa-user-plus', title: 'Referral Network', desc: 'Access exclusive job referral links and networking resources for top companies.' },
    { icon: 'fas fa-tablet-alt', title: 'Practice Anywhere', desc: 'Access all skill-building tools from any device, anytime, anywhere.' }
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="skills-page">
      <style>{`
        *:focus, *:focus-visible, *:active, button:focus, button:focus-visible,
        a:focus, a:focus-visible { outline: none !important; box-shadow: none !important; }

        :root {
          --primary: #4400ff; --primary-dark: #3300cc; --primary-light: #6a4cff;
          --secondary: #ffc100; --secondary-dark: #e6ae00; --secondary-light: #ffd700;
          --dark: #1a1a1a; --gray: #6c757d; --light: #f8f9fa; --white: #ffffff;
          --gradient-primary: linear-gradient(135deg, #4400ff 0%, #6a4cff 100%);
          --gradient-secondary: linear-gradient(135deg, #ffc100 0%, #ffd700 100%);
          --shadow-sm: 0 4px 6px rgba(0,0,0,0.05);
          --shadow-md: 0 10px 25px rgba(68,0,255,0.1);
          --shadow-lg: 0 20px 40px rgba(68,0,255,0.15);
          --shadow-hover: 0 30px 50px rgba(68,0,255,0.25);
          --transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }

        .hero-section-full {
          position: relative !important; width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important; margin-right: calc(-50vw + 50%) !important;
          min-height: 90vh !important; overflow: hidden !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
        }

        .hero-bg-image {
          position: absolute !important; top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover !important; z-index: 0 !important;
          mask-image: linear-gradient(to right, transparent 0%, black 40%, black 100%) !important;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 40%, black 100%) !important;
        }

        .hero-gradient-overlay {
          position: absolute !important; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(68,0,255,0.6) 50%, rgba(0,0,0,0.4) 100%) !important;
          z-index: 1 !important;
        }

        .hero-content { position: relative !important; z-index: 2 !important; width: 100% !important; max-width: 1200px !important; margin: 0 auto !important; padding: 0 2rem !important; }
        .hero-text-content { max-width: 55% !important; }

        .hero-main-title { font-size: clamp(2.5rem, 5vw, 4rem) !important; font-weight: 800 !important; margin-bottom: 1.5rem !important; line-height: 1.2 !important; color: #fff !important; }
        .hero-main-title span { color: var(--secondary) !important; }
        .hero-description { font-size: clamp(1rem, 1.5vw, 1.2rem) !important; margin-bottom: 2rem !important; line-height: 1.6 !important; color: rgba(255,255,255,0.95) !important; }
        .hero-buttons-container { display: flex !important; gap: 1rem !important; flex-wrap: wrap !important; }

        .btn-hero-primary {
          display: inline-flex !important; align-items: center !important; gap: 0.5rem !important;
          padding: 1rem 2rem !important; background: var(--secondary) !important;
          color: var(--dark) !important; border: none !important; border-radius: 50px !important;
          font-weight: 600 !important; font-size: 1rem !important; cursor: pointer !important; transition: var(--transition) !important;
        }
        .btn-hero-primary:hover { transform: translateY(-3px) !important; box-shadow: 0 10px 25px rgba(255,193,0,0.3) !important; }

        .btn-hero-secondary {
          display: inline-flex !important; align-items: center !important; gap: 0.5rem !important;
          padding: 1rem 2rem !important; background: transparent !important; color: #fff !important;
          border: 2px solid rgba(255,255,255,0.3) !important; border-radius: 50px !important;
          font-weight: 600 !important; font-size: 1rem !important; cursor: pointer !important; transition: var(--transition) !important;
        }
        .btn-hero-secondary:hover { border-color: var(--secondary) !important; color: var(--secondary) !important; transform: translateY(-3px) !important; }

        .stats-section { width: 100vw !important; margin-left: calc(-50vw + 50%) !important; margin-right: calc(-50vw + 50%) !important; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 5rem 2rem !important; }
        .stats-container { max-width: 1200px !important; margin: 0 auto !important; }
        .stats-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; gap: 2rem !important; }
        .stat-card { background: #fff !important; border-radius: 20px !important; padding: 2.5rem !important; text-align: center !important; transition: var(--transition) !important; box-shadow: var(--shadow-md) !important; position: relative !important; overflow: hidden !important; }
        .stat-card::before { content: '' !important; position: absolute !important; top: 0; left: 0; right: 0; height: 4px !important; background: linear-gradient(90deg, #4400ff, #ffcc00) !important; transform: scaleX(0) !important; transition: transform 0.3s ease !important; }
        .stat-card:hover::before { transform: scaleX(1) !important; }
        .stat-card:hover { transform: translateY(-8px) !important; box-shadow: var(--shadow-hover) !important; }
        .stat-icon-wrapper { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, rgba(68,0,255,0.1), rgba(255,204,0,0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .stat-card:hover .stat-icon-wrapper { transform: scale(1.1); }
        .stat-icon { font-size: 2.5rem; color: #4400ff; }
        .stat-number { font-size: 2.5rem; font-weight: 800; color: #1a1a1a; margin-bottom: 0.5rem; }
        .stat-label { font-size: 1rem; color: #6c757d; font-weight: 500; }

        .skills-levels-section { width: 100vw !important; margin-left: calc(-50vw + 50%) !important; margin-right: calc(-50vw + 50%) !important; background: #ffffff; padding: 5rem 2rem !important; }
        .levels-container { max-width: 1200px !important; margin: 0 auto !important; }
        .section-header { text-align: center !important; margin-bottom: 3rem !important; }
        .section-title { font-size: 2.5rem !important; font-weight: 800 !important; color: #1a1a1a !important; margin-bottom: 1rem !important; position: relative !important; display: inline-block !important; }
        .section-title::after { content: '' !important; position: absolute !important; bottom: -10px !important; left: 50% !important; transform: translateX(-50%) !important; width: 80px !important; height: 4px !important; background: linear-gradient(90deg, #4400ff, #ffcc00) !important; border-radius: 2px !important; }
        .section-subtitle { font-size: 1.2rem !important; color: #6c757d !important; max-width: 700px !important; margin: 1rem auto 0 !important; }

        .lessons-grid { display: grid !important; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; gap: 1.5rem !important; }
        .lesson-card { background: #fff; border-radius: 18px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; transition: var(--transition); box-shadow: var(--shadow-md); border: 1px solid rgba(0,0,0,0.04); }
        .lesson-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-hover); }
        .lesson-card.completed { border-left: 4px solid #28a745; background: linear-gradient(135deg, #f0fdf4, #fff); }
        .lesson-number { width: 50px; height: 50px; background: linear-gradient(135deg, #4400ff, #6a4cff); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; }
        .lesson-content { flex: 1; }
        .lesson-content h4 { font-size: 0.95rem; font-weight: 700; margin-bottom: 0.4rem; color: #1a1a1a; }
        .lesson-stats { display: flex; gap: 1rem; margin-bottom: 0.5rem; font-size: 0.75rem; color: #28a745; }
        .lesson-btn { padding: 0.4rem 1rem; border: none; border-radius: 50px; font-weight: 600; font-size: 0.8rem; cursor: pointer; background: linear-gradient(135deg, #4400ff, #6a4cff); color: #fff; transition: var(--transition); white-space: nowrap; }
        .lesson-btn.done { background: #28a745; }
        .lesson-btn:hover { transform: translateX(3px); filter: brightness(1.1); }
        .lesson-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .features-section { width: 100vw !important; margin-left: calc(-50vw + 50%) !important; margin-right: calc(-50vw + 50%) !important; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 5rem 2rem !important; }
        .features-container { max-width: 1200px !important; margin: 0 auto !important; }
        .features-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important; gap: 2rem !important; }
        .feature-card { text-align: center !important; padding: 2rem !important; background: #fff !important; border-radius: 20px !important; transition: var(--transition) !important; box-shadow: var(--shadow-md) !important; }
        .feature-card:hover { transform: translateY(-5px) !important; box-shadow: var(--shadow-hover) !important; }
        .feature-icon-wrapper { width: 80px; height: 80px; margin: 0 auto 1.5rem; background: linear-gradient(135deg, rgba(68,0,255,0.1), rgba(255,204,0,0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .feature-icon { font-size: 2rem; color: #4400ff; }
        .feature-title { font-size: 1.25rem; font-weight: 700; color: #1a1a1a; margin-bottom: 1rem; }
        .feature-description { font-size: 0.95rem; color: #6c757d; line-height: 1.6; }

        .cta-section { width: 100vw !important; margin-left: calc(-50vw + 50%) !important; margin-right: calc(-50vw + 50%) !important; background: linear-gradient(135deg, #4400ff 0%, #ffcc00 100%) !important; padding: 5rem 2rem !important; overflow: hidden !important; position: relative !important; }
        .cta-container { max-width: 1200px !important; margin: 0 auto !important; position: relative !important; z-index: 1 !important; }
        .cta-content { text-align: center !important; }
        .cta-title { font-size: 2.5rem !important; font-weight: 800 !important; color: #fff !important; margin-bottom: 1rem !important; }
        .cta-subtitle { font-size: 1.2rem !important; color: rgba(255,255,255,0.95) !important; margin-bottom: 2rem !important; max-width: 600px !important; margin-left: auto !important; margin-right: auto !important; }
        .btn-cta { background: #fff !important; color: #4400ff !important; border: none !important; padding: 1rem 2.5rem !important; border-radius: 50px !important; font-size: 1.1rem !important; font-weight: 700 !important; cursor: pointer !important; transition: var(--transition) !important; display: inline-flex !important; align-items: center !important; gap: 0.75rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important; }
        .btn-cta:hover { transform: translateY(-3px) !important; box-shadow: 0 15px 40px rgba(0,0,0,0.3) !important; gap: 1rem !important; }

        .typing-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; backdrop-filter: blur(8px); }
        .typing-modal-content { background: #fff; border-radius: 24px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
        .modal-header-custom { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-header-custom h3 { font-size: 1.3rem; font-weight: 700; color: #1a1a1a; margin: 0; }
        .close-btn { background: #f0f0f0; border: none; font-size: 1.2rem; cursor: pointer; padding: 0.5rem 0.75rem; border-radius: 50%; transition: all 0.3s ease; color: #6c757d; }
        .close-btn:hover { background: #dc3545; color: #fff; }
        .progress-section { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .progress-bar-container { flex: 1; background: #e9ecef; border-radius: 10px; height: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #4400ff, #ffc100); border-radius: 10px; transition: width 0.3s ease; }
        .progress-text { font-size: 0.85rem; font-weight: 700; color: #4400ff; min-width: 45px; text-align: right; }
        .reference-text { background: #f8f9fa; padding: 1.25rem; border-radius: 14px; font-family: 'Courier New', monospace; font-size: 1rem; line-height: 1.8; margin-bottom: 1rem; max-height: 150px; overflow-y: auto; border: 1px solid #e9ecef; }
        .reference-char { display: inline-block; }
        .reference-char.correct { color: #28a745; background: #d4edda; border-radius: 2px; }
        .reference-char.incorrect { color: #dc3545; background: #f8d7da; text-decoration: underline; border-radius: 2px; }
        .typing-input { width: 100%; padding: 1rem; border: 2px solid #e9ecef; border-radius: 14px; font-family: 'Courier New', monospace; font-size: 1rem; resize: vertical; margin-bottom: 1rem; transition: border-color 0.3s ease; }
        .typing-input:focus { border-color: #4400ff; }
        .typing-stats { display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid #e9ecef; font-size: 0.85rem; color: #6c757d; }

        @media (max-width: 991px) {
          .hero-text-content { max-width: 100% !important; text-align: center !important; }
          .hero-buttons-container { justify-content: center !important; }
          .section-title { font-size: 2rem !important; }
        }
        @media (max-width: 768px) {
          .hero-content { padding: 0 1.5rem !important; }
          .stats-section, .skills-levels-section, .features-section, .cta-section { padding: 3rem 1rem !important; }
          .section-title { font-size: 1.75rem !important; }
        }
      `}</style>



      {/* Typing Lessons Section */}
      <section className="skills-levels-section">
        <div className="levels-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="section-title">Typing Lessons</h2>
            <p className="section-subtitle">Progress through 10 lessons to master your keyboard skills</p>
          </motion.div>
          <div className="lessons-grid">
            {lessons.map((lesson) => (
              <motion.div key={lesson.id} className={`lesson-card ${lesson.status === 'done' ? 'completed' : ''}`} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: lesson.id * 0.03 }}>
                <div className="lesson-number">{lesson.id}</div>
                <div className="lesson-content">
                  <h4>{lesson.title}</h4>
                  {lesson.status === 'done' && (
                    <div className="lesson-stats"><span><i className="fas fa-keyboard"></i> {lesson.wpm} WPM</span></div>
                  )}
                  <button className={`lesson-btn ${lesson.status === 'done' ? 'done' : ''}`} onClick={() => startLesson(lesson)} disabled={isTypingActive}>
                    {lesson.status === 'done' ? <><i className="fas fa-check-circle me-1"></i> Done</> : <><i className="fas fa-play me-1"></i> Start</>}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="section-title">All Your Career Skills</h2>
            <p className="section-subtitle">Everything you need to build a successful career toolkit</p>
          </motion.div>
          <div className="features-grid">
            {skillFeatures.map((feature, i) => (
              <motion.div key={i} className="feature-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="feature-icon-wrapper"><i className={`${feature.icon} feature-icon`}></i></div>
                <h5 className="feature-title">{feature.title}</h5>
                <p className="feature-description">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Typing Modal */}
      {isTypingActive && (
        <div className="typing-modal" onClick={() => setIsTypingActive(false)}>
          <div className="typing-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <h3>{lessonTitle}</h3>
              <button className="close-btn" onClick={() => setIsTypingActive(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="progress-section">
              <div className="progress-bar-container"><div className="progress-fill" style={{ width: `${lessonProgress}%` }}></div></div>
              <span className="progress-text">{Math.round(lessonProgress)}%</span>
            </div>
            <div className="reference-text">
              {lessonText.split('').map((char, index) => (
                <span key={index} className={`reference-char ${userInput[index] === char ? 'correct' : userInput[index] ? 'incorrect' : ''}`}>{char}</span>
              ))}
            </div>
            <textarea ref={inputRef} className="typing-input" value={userInput} onChange={handleTypingChange} placeholder="Start typing here..." rows={4} />
            <div className="typing-stats">
              <span><i className="fas fa-keyboard"></i> Progress: {Math.round(lessonProgress)}%</span>
              <span><i className="fas fa-pencil-alt"></i> {userInput.length} / {lessonText.length} chars</span>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="cta-section">
          <div className="cta-container">
            <motion.div className="cta-content" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="cta-title">Ready to Build Your Skills?</h2>
              <p className="cta-subtitle">Join thousands improving their career skills daily</p>
              <button className="btn-cta" onClick={() => navigate('/register')}>
                Create Free Account <i className="fas fa-rocket"></i>
              </button>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Skills;