import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { motion } from 'framer-motion';
import FreeTrialBanner from './FreeTrialBanner';
import UpgradePrompt from './UpgradePrompt';
import slider1 from '../../assets/slider1.png';

const Exams = () => {
  const navigate = useNavigate();
  const [trialStatus, setTrialStatus] = useState({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeData, setUpgradeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    fetchTrialStatus();
    fetchSubjects();
    window.scrollTo(0, 0);
  }, []);

  const fetchTrialStatus = async () => {
    try {
      const response = await api.get('/api/exams/trial/status/');
      const statusMap = {};
      response.data.forEach(item => {
        statusMap[item.subject] = item;
      });
      setTrialStatus(statusMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trial status:', error);
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/api/exams/subjects/');
      setSubjects(response.data.results || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleStartPracticing = async (examType, subjectName) => {
    if (creatingSession) return;
    try {
      setCreatingSession(true);
      const examCategory = examCategories.find(cat => cat.id === examType);
      if (!examCategory) { navigate('/payment-plans'); return; }
      const trialInfo = trialStatus[subjectName];
      const hasFreeTrials = trialInfo && trialInfo.remaining > 0;
      if (!trialInfo || hasFreeTrials) {
        navigate(`/practice/${examType}/${encodeURIComponent(subjectName)}?trial=true`);
        return;
      }
      if (trialInfo && trialInfo.questions_answered >= 5) {
        setUpgradeData({ message: `You've completed all 5 free questions for ${subjectName}. Upgrade to access the full question bank!`, subject: subjectName });
        setShowUpgrade(true);
        return;
      }
      navigate(`/practice/${examType}/${encodeURIComponent(subjectName)}`);
    } catch (error) {
      if (error.response?.status === 401) navigate('/login');
      else navigate(`/practice/${examType}/${encodeURIComponent(subjectName)}?trial=true`);
    } finally { setCreatingSession(false); }
  };

  const handleExamCardStart = async (examType) => {
    if (creatingSession) return;
    const examCategory = examCategories.find(cat => cat.id === examType);
    if (examCategory && examCategory.subjects.length > 0) {
      await handleStartPracticing(examType, examCategory.subjects[0]);
    } else {
      navigate(`/practice/${examType}?trial=true`);
    }
  };

  const examCategories = [
    { id: 'jssce', title: 'JSSCE', fullTitle: 'Junior School Certificate Examination', description: 'Prepare for your Junior WAEC with comprehensive practice tests across all subjects.', subjects: ['Mathematics', 'English', 'Basic Science', 'Social Studies'], gradient: 'linear-gradient(135deg, #28a745, #20c997)', color: '#28a745' },
    { id: 'waec', title: 'WAEC', fullTitle: 'West African Examinations Council', description: 'Master your WAEC/NECO exams with subject-specific practice and past questions.', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'], gradient: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#667eea' },
    { id: 'jamb', title: 'UTME', fullTitle: 'Unified Tertiary Matriculation Examination', description: 'Get ready for JAMB with CBT-style practice tests and comprehensive subject coverage.', subjects: ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics'], gradient: 'linear-gradient(135deg, #ffc107, #fd7e14)', color: '#ffc107' },
    { id: 'post-utme', title: 'POST-UTME', fullTitle: 'Post-UTME Screening', description: 'Practice with university-specific Post-UTME questions from top Nigerian institutions.', subjects: ['General Paper', 'Subject Combinations', 'Aptitude Tests'], gradient: 'linear-gradient(135deg, #17a2b8, #6f42c1)', color: '#17a2b8' },
    { id: 'aptitude', title: 'Aptitude', fullTitle: 'Career Aptitude Test Preparation', description: 'Master verbal, numerical and abstract reasoning with comprehensive practice tests.', subjects: ['Verbal Reasoning', 'Numerical Reasoning', 'Abstract Reasoning', 'Time Management'], gradient: 'linear-gradient(135deg, #4400ff, #6a4cff)', color: '#4400ff' },
    { id: 'promotion', title: 'Promotion', fullTitle: 'Career Promotion Examination', description: 'Prepare for public and private sector promotion examinations with targeted study modules.', subjects: ['Leadership Assessment', 'Management Skills', 'Strategic Thinking', 'Case Studies'], gradient: 'linear-gradient(135deg, #14532d, #28a745)', color: '#28a745' },
    { id: 'civil', title: 'Civil Service', fullTitle: 'Civil Service Examination', description: 'Comprehensive preparation for federal and state civil service examinations.', subjects: ['General Paper', 'Public Administration', 'Quantitative Aptitude', 'English Language'], gradient: 'linear-gradient(135deg, #0d3b66, #17a2b8)', color: '#17a2b8' }
  ];

  const getSubjectTrialStatus = (subjectName) => trialStatus[subjectName];

  const renderTrialBadge = (subject) => {
    const trial = getSubjectTrialStatus(subject);
    if (trial) {
      if (trial.remaining > 0) return <span className="trial-badge free"><i className="fas fa-gift"></i> {trial.remaining}/5 free</span>;
      if (trial.questions_answered >= 5) return <span className="trial-badge upgrade"><i className="fas fa-lock"></i> Upgrade</span>;
    }
    return <span className="trial-badge free"><i className="fas fa-gift"></i> 5 free</span>;
  };

  return (
    <>
      <style>{`
        *:focus, *:focus-visible, *:active, button:focus, button:focus-visible,
        a:focus, a:focus-visible { outline: none !important; box-shadow: none !important; }

        :root {
          --primary: #4400ff; --primary-dark: #3300cc; --primary-light: #6a4cff;
          --secondary: #ffc100; --secondary-dark: #e6ae00; --secondary-light: #ffd700;
          --dark: #1a1a1a; --gray: #6c757d; --light: #f8f9fa; --white: #ffffff;
          --shadow-sm: 0 4px 6px rgba(0,0,0,0.05); --shadow-md: 0 10px 25px rgba(68,0,255,0.1);
          --shadow-lg: 0 20px 40px rgba(68,0,255,0.15); --shadow-hover: 0 30px 50px rgba(68,0,255,0.25);
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
        .btn-hero-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-hero-secondary {
          display: inline-flex !important; align-items: center !important; gap: 0.5rem !important;
          padding: 1rem 2rem !important; background: transparent !important; color: #fff !important;
          border: 2px solid rgba(255,255,255,0.3) !important; border-radius: 50px !important;
          font-weight: 600 !important; font-size: 1rem !important; cursor: pointer !important; transition: var(--transition) !important;
        }
        .btn-hero-secondary:hover { border-color: var(--secondary) !important; color: var(--secondary) !important; transform: translateY(-3px) !important; }

        .exams-categories-section {
          width: 100vw !important; margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .levels-container { max-width: 1200px !important; margin: 0 auto !important; }
        .section-header { text-align: center !important; margin-bottom: 3rem !important; }
        .section-title { font-size: 2.5rem !important; font-weight: 800 !important; color: #1a1a1a !important; margin-bottom: 1rem !important; position: relative !important; display: inline-block !important; }
        .section-title::after { content: '' !important; position: absolute !important; bottom: -10px !important; left: 50% !important; transform: translateX(-50%) !important; width: 80px !important; height: 4px !important; background: linear-gradient(90deg, #4400ff, #ffcc00) !important; border-radius: 2px !important; }
        .section-subtitle { font-size: 1.2rem !important; color: #6c757d !important; max-width: 700px !important; margin: 1rem auto 0 !important; }

        .exams-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)) !important; gap: 2rem !important; }

        .exam-card {
          background: #ffffff !important; border-radius: 24px !important; overflow: hidden !important;
          transition: var(--transition) !important; box-shadow: var(--shadow-md) !important;
          height: 100% !important; display: flex !important; flex-direction: column !important;
        }
        .exam-card:hover { transform: translateY(-8px) !important; box-shadow: var(--shadow-hover) !important; }

        .exam-card-header {
          padding: 1.75rem !important; background: linear-gradient(135deg, #f8f9fa, #ffffff) !important;
          border-bottom: 1px solid rgba(0,0,0,0.05) !important;
        }

        .exam-icon-letter {
          width: 65px; height: 65px; border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; font-weight: 800; color: #ffffff; flex-shrink: 0;
        }

        .exam-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.25rem; color: #1a1a1a; }
        .exam-subtitle { font-size: 0.85rem; color: #6c757d; }

        .exam-card-body { padding: 1.5rem !important; flex: 1; display: flex; flex-direction: column; }
        .exam-description { color: #6c757d; margin-bottom: 1.5rem; line-height: 1.6; font-size: 0.95rem; }

        .subjects-grid { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-bottom: 1.5rem; }

        .subject-btn {
          padding: 0.55rem 1.1rem; background: #f8f9fa; border: 2px solid #e9ecef;
          border-radius: 50px; font-size: 0.85rem; font-weight: 500; color: #495057;
          transition: var(--transition); cursor: pointer; display: inline-flex; align-items: center;
        }
        .subject-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .subject-btn:hover:not(:disabled) { border-color: #4400ff; color: #4400ff; transform: translateY(-2px); }

        .trial-badge {
          display: inline-flex; align-items: center; gap: 0.3rem;
          padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.65rem; font-weight: 600; margin-left: 0.4rem;
        }
        .trial-badge.free { background: #fff3cd; color: #856404; }
        .trial-badge.upgrade { background: #e9ecef; color: #6c757d; }

        .btn-start {
          display: inline-flex; align-items: center; gap: 0.75rem; padding: 0.85rem 2rem;
          background: linear-gradient(135deg, #4400ff, #6a4cff); border: none; border-radius: 50px;
          font-weight: 700; color: #fff; transition: var(--transition); cursor: pointer;
          width: 100%; justify-content: center; margin-top: auto;
        }
        .btn-start:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-start:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(68,0,255,0.3); gap: 1rem; }

        .btn-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 0.6s linear infinite; margin-right: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .cta-section {
          width: 100vw !important; margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #4400ff 0%, #ffcc00 100%) !important;
          padding: 5rem 2rem !important; overflow: hidden !important; position: relative !important;
        }
        .cta-container { max-width: 1200px !important; margin: 0 auto !important; position: relative !important; z-index: 1 !important; }
        .cta-content { text-align: center !important; }
        .cta-title { font-size: 2.5rem !important; font-weight: 800 !important; color: #fff !important; margin-bottom: 1rem !important; }
        .cta-subtitle { font-size: 1.2rem !important; color: rgba(255,255,255,0.95) !important; margin-bottom: 2rem !important; max-width: 600px !important; margin-left: auto !important; margin-right: auto !important; }
        .btn-cta {
          background: #fff !important; color: #4400ff !important; border: none !important;
          padding: 1rem 2.5rem !important; border-radius: 50px !important; font-size: 1.1rem !important;
          font-weight: 700 !important; cursor: pointer !important; transition: var(--transition) !important;
          display: inline-flex !important; align-items: center !important; gap: 0.75rem !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
        }
        .btn-cta:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cta:hover:not(:disabled) { transform: translateY(-3px) !important; box-shadow: 0 15px 40px rgba(0,0,0,0.3) !important; gap: 1rem !important; }

        @media (max-width: 991px) {
          .hero-text-content { max-width: 100% !important; text-align: center !important; }
          .hero-buttons-container { justify-content: center !important; }
          .section-title { font-size: 2rem !important; }
          .exams-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .hero-content { padding: 0 1.5rem !important; }
          .exams-categories-section, .cta-section { padding: 3rem 1rem !important; }
          .section-title { font-size: 1.75rem !important; }
        }
      `}</style>

    

      {/* Exam Categories Section */}
      <section className="exams-categories-section">
        <div className="levels-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="section-title">Choose Your Exam</h2>
            <p className="section-subtitle">
              Select the examination you're preparing for and start practicing
              <span className="d-block mt-2 text-warning"><i className="fas fa-gift me-2"></i>Try 5 questions per subject for free!</span>
            </p>
            <div className="text-center mt-3">
              <button
                className="btn btn-warning btn-lg fw-bold"
                onClick={() => navigate('/payment-plans')}
              >
                <i className="fas fa-crown me-2"></i>
                Upgrade / Subscribe to unlock all questions
              </button>
              <div className="small text-muted mt-2">
                You can subscribe any time — you don't need to finish the free questions first.
              </div>
            </div>
          </motion.div>

          <div className="exams-grid">
            {examCategories.map((exam) => (
              <div key={exam.id} className="exam-card">
                <div className="exam-card-header">
                  <div className="d-flex align-items-start gap-3">
                    <div className="exam-icon-letter" style={{ background: exam.gradient }}>{exam.title.charAt(0)}</div>
                    <div>
                      <h3 className="exam-title">{exam.title}</h3>
                      <p className="exam-subtitle">{exam.fullTitle}</p>
                    </div>
                  </div>
                </div>
                <div className="exam-card-body">
                  <p className="exam-description">{exam.description}</p>
                  <div className="subjects-grid">
                    {exam.subjects.map((subject, idx) => (
                      <button key={idx} className="subject-btn" onClick={() => handleStartPracticing(exam.id, subject)} disabled={creatingSession}>
                        {creatingSession ? <><span className="btn-spinner"></span> Loading...</> : <>{subject}{renderTrialBadge(subject)}</>}
                      </button>
                    ))}
                  </div>
                  <button className="btn-start" onClick={() => handleExamCardStart(exam.id)} disabled={creatingSession}>
                    {creatingSession ? <><span className="btn-spinner"></span> Loading...</> : <>Start <i className="fas fa-arrow-right"></i></>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <motion.div className="cta-content" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="cta-title">Ready to Ace Your Exams?</h2>
            <p className="cta-subtitle">Start with 5 free questions per subject today!</p>
            <button className="btn-cta" onClick={() => { const firstExam = examCategories[0]; handleStartPracticing(firstExam.id, firstExam.subjects[0]); }} disabled={creatingSession}>
              {creatingSession ? <><span className="btn-spinner"></span> Loading...</> : <>Try Free Now <i className="fas fa-gift"></i></>}
            </button>
          </motion.div>
        </div>
      </section>

      {showUpgrade && <UpgradePrompt data={upgradeData} onClose={() => setShowUpgrade(false)} />}
    </>
  );
};

export default Exams;