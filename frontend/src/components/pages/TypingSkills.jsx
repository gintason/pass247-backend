import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const TypingSkills = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const [activeTab, setActiveTab] = useState('mavis');
  const [typingTest, setTypingTest] = useState({
    text: "The quick brown fox jumps over the lazy dog. Practice typing this sentence to improve your speed and accuracy.",
    userInput: '',
    startTime: null,
    endTime: null,
    wpm: 0,
    accuracy: 0
  });

  const handleTypingTest = (e) => {
    const input = e.target.value;
    setTypingTest(prev => ({ ...prev, userInput: input }));
    
    if (!typingTest.startTime && input.length === 1) {
      setTypingTest(prev => ({ ...prev, startTime: new Date() }));
    }
  };

  const calculateResults = () => {
    if (!typingTest.startTime) return;
    
    const endTime = new Date();
    const timeInMinutes = (endTime - typingTest.startTime) / 60000;
    const words = typingTest.userInput.split(' ').length;
    const wpm = Math.round(words / timeInMinutes);
    
    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < typingTest.userInput.length; i++) {
      if (typingTest.userInput[i] === typingTest.text[i]) correct++;
    }
    const accuracy = Math.round((correct / typingTest.text.length) * 100);
    
    setTypingTest(prev => ({ 
      ...prev, 
      endTime, 
      wpm, 
      accuracy,
      startTime: null 
    }));
  };

  const resetTest = () => {
    setTypingTest({
      text: "The quick brown fox jumps over the lazy dog. Practice typing this sentence to improve your speed and accuracy.",
      userInput: '',
      startTime: null,
      endTime: null,
      wpm: 0,
      accuracy: 0
    });
  };

  const mavisBeaconGuides = [
    {
      step: 1,
      title: "Getting Started with Mavis Beacon",
      description: "Download and install Mavis Beacon Teaches Typing from the official website or use the CD-ROM.",
      image: "https://via.placeholder.com/400x250",
      tips: [
        "Choose your skill level (Beginner, Intermediate, or Advanced)",
        "Set daily practice goals (15-30 minutes recommended)",
        "Use headphones for better focus on audio instructions"
      ]
    },
    {
      step: 2,
      title: "Proper Hand Positioning",
      description: "Learn the correct finger placement on the home row keys (ASDF for left hand, JKL; for right hand).",
      image: "https://via.placeholder.com/400x250",
      tips: [
        "Left hand: A,S,D,F - Right hand: J,K,L,;",
        "Thumbs should rest on the spacebar",
        "Keep wrists straight and elevated"
      ]
    },
    {
      step: 3,
      title: "Follow Mavis Beacon Lessons",
      description: "Progress through structured lessons that gradually introduce new keys and increase speed.",
      image: "https://via.placeholder.com/400x250",
      tips: [
        "Start with Lesson 1: Home Row",
        "Don't look at your keyboard while typing",
        "Focus on accuracy before speed"
      ]
    },
    {
      step: 4,
      title: "Practice Games & Exercises",
      description: "Use the fun typing games in Mavis Beacon to make practice enjoyable and engaging.",
      image: "https://via.placeholder.com/400x250",
      tips: [
        "Play 'Letter Invaders' for speed building",
        "Try 'Driving Lessons' for rhythm practice",
        "Use 'Word Factory' for vocabulary building"
      ]
    }
  ];

  const typingTips = [
    {
      icon: 'bi-hand-index',
      title: 'Proper Posture',
      tips: [
        'Sit up straight with feet flat on floor',
        'Elbows at 90-degree angle',
        'Wrists straight, not bent',
        'Screen at eye level'
      ]
    },
    {
      icon: 'bi-eye',
      title: 'Look Away',
      tips: [
        'Don\'t look at your keyboard',
        'Focus on the screen',
        'Use peripheral vision',
        'Cover your hands with a cloth to practice'
      ]
    },
    {
      icon: 'bi-speedometer2',
      title: 'Build Speed Gradually',
      tips: [
        'Start slow, focus on accuracy',
        'Practice 15-20 minutes daily',
        'Take regular breaks',
        'Track your WPM progress'
      ]
    },
    {
      icon: 'bi-arrow-repeat',
      title: 'Practice Regularly',
      tips: [
        'Consistency is key',
        'Use typing tests weekly',
        'Practice with real content',
        'Join typing challenges'
      ]
    }
  ];

  const typingResources = [
    {
      name: 'Mavis Beacon Official',
      url: 'https://www.mavisbeacon.com',
      description: 'Official website with downloads and tutorials',
      type: 'Software'
    },
    {
      name: 'Typing.com',
      url: 'https://www.typing.com',
      description: 'Free online typing lessons and tests',
      type: 'Website'
    },
    {
      name: 'Keybr.com',
      url: 'https://www.keybr.com',
      description: 'Adaptive typing practice',
      type: 'Website'
    },
    {
      name: '10FastFingers',
      url: 'https://10fastfingers.com',
      description: 'Typing speed tests and competitions',
      type: 'Website'
    }
  ];

  const commonMistakes = [
    {
      mistake: 'Looking at keyboard',
      solution: 'Use a cloth to cover your hands or practice touch-typing exercises'
    },
    {
      mistake: 'Using wrong fingers',
      solution: 'Always return to home row position after each key press'
    },
    {
      mistake: 'Rushing too fast',
      solution: 'Focus on accuracy first; speed will come naturally with practice'
    },
    {
      mistake: 'Poor posture',
      solution: 'Set up an ergonomic workspace with proper chair height'
    }
  ];

  return (
    <div className="typing-skills-page">
      {/* Hero Section */}
      <section className="hero-section py-5" style={{ 
        background: 'linear-gradient(135deg, #4400ff 0%, #00cc99 100%)',
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
                Typing <span style={{ color: '#ffc100' }}>Skills</span>
              </motion.h1>
              <motion.p 
                className="lead mb-4"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Master the art of typing with Mavis Beacon. From beginner to expert, 
                learn proper techniques, improve your speed, and boost your productivity.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <a href="#typing-test" className="btn btn-warning btn-lg px-5 py-3 me-3">
                  Take Typing Test <i className="bi bi-arrow-right ms-2"></i>
                </a>
                <a href="#mavis-guide" className="btn btn-outline-light btn-lg px-5 py-3">
                  Learn Mavis Beacon
                </a>
              </motion.div>
            </div>
            <div className="col-lg-6 mt-4 mt-lg-0" data-aos="fade-left">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Typing Skills" 
                className="img-fluid rounded-4 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats-section py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            {[
              { value: '40+', label: 'Years of Mavis Beacon' },
              { value: '20M+', label: 'Users Worldwide' },
              { value: '80WPM', label: 'Average Graduate Speed' },
              { value: '95%', label: 'Accuracy Improvement' }
            ].map((stat, index) => (
              <div className="col-md-3 col-6" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="text-center">
                  <h3 className="display-5 fw-bold text-primary">{stat.value}</h3>
                  <p className="text-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Typing Test Section */}
      <section id="typing-test" className="typing-test-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Test Your Typing Speed</h2>
            <p className="lead text-muted">Try this quick typing test to measure your current WPM</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-lg" data-aos="fade-up">
                <div className="card-body p-4">
                  {/* Sample Text */}
                  <div className="sample-text bg-light p-4 rounded-3 mb-4">
                    <p className="mb-0 fw-bold" style={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>
                      {typingTest.text}
                    </p>
                  </div>

                  {/* Typing Area */}
                  <textarea
                    className="form-control form-control-lg mb-3"
                    rows="4"
                    placeholder="Start typing here..."
                    value={typingTest.userInput}
                    onChange={handleTypingTest}
                    style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}
                  ></textarea>

                  {/* Results */}
                  {(typingTest.wpm > 0 || typingTest.accuracy > 0) && (
                    <motion.div 
                      className="results bg-primary text-white p-4 rounded-3 mb-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="row text-center">
                        <div className="col-6">
                          <h3 className="display-6 fw-bold mb-0">{typingTest.wpm}</h3>
                          <p className="mb-0">Words Per Minute</p>
                        </div>
                        <div className="col-6">
                          <h3 className="display-6 fw-bold mb-0">{typingTest.accuracy}%</h3>
                          <p className="mb-0">Accuracy</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Buttons */}
                  <div className="d-flex gap-3">
                    <button 
                      className="btn btn-primary flex-grow-1 py-2"
                      onClick={calculateResults}
                      disabled={!typingTest.userInput}
                    >
                      Calculate Results
                    </button>
                    <button 
                      className="btn btn-outline-secondary px-4"
                      onClick={resetTest}
                    >
                      <i className="bi bi-arrow-repeat"></i>
                    </button>
                  </div>

                  {/* WPM Guide */}
                  <div className="mt-4">
                    <h6 className="fw-bold mb-3">What your score means:</h6>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-secondary me-2">0-20</span>
                          <small>Beginner</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-info me-2">21-40</span>
                          <small>Average</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-success me-2">41-60</span>
                          <small>Good</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-warning me-2">61-80</span>
                          <small>Excellent</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-danger me-2">80+</span>
                          <small>Professional</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mavis Beacon Guide Tabs */}
      <section id="mavis-guide" className="mavis-guide-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Master Mavis Beacon</h2>
            <p className="lead text-muted">Your complete guide to learning typing with Mavis Beacon</p>
          </div>

          {/* Tab Navigation */}
          <div className="row justify-content-center mb-4">
            <div className="col-lg-8">
              <div className="btn-group w-100" role="group">
                <button 
                  className={`btn ${activeTab === 'mavis' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('mavis')}
                >
                  Mavis Beacon Guide
                </button>
                <button 
                  className={`btn ${activeTab === 'tips' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('tips')}
                >
                  Typing Tips
                </button>
                <button 
                  className={`btn ${activeTab === 'resources' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setActiveTab('resources')}
                >
                  Resources
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Mavis Beacon Guide */}
            {activeTab === 'mavis' && (
              <div className="row g-4">
                {mavisBeaconGuides.map((guide, index) => (
                  <div className="col-lg-6" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                    <div className="card h-100 border-0 shadow-lg hover-card">
                      <div className="row g-0">
                        <div className="col-md-5">
                          <img 
                            src={guide.image} 
                            className="img-fluid rounded-start h-100" 
                            alt={guide.title}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                        <div className="col-md-7">
                          <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                              <span className="badge bg-primary me-2">Step {guide.step}</span>
                              <h5 className="card-title fw-bold mb-0">{guide.title}</h5>
                            </div>
                            <p className="card-text text-muted small mb-3">{guide.description}</p>
                            <h6 className="fw-bold small mb-2">Pro Tips:</h6>
                            <ul className="list-unstyled">
                              {guide.tips.map((tip, idx) => (
                                <li key={idx} className="mb-1 small">
                                  <i className="bi bi-check-circle-fill text-success me-2"></i>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Typing Tips */}
            {activeTab === 'tips' && (
              <div className="row g-4">
                {typingTips.map((tip, index) => (
                  <div className="col-md-6" key={index} data-aos="fade-up" data-aos-delay={index * 100}>
                    <div className="card h-100 border-0 shadow-lg hover-card">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="tip-icon me-3">
                            <i className={`bi ${tip.icon}`} style={{ fontSize: '2rem', color: '#4400ff' }}></i>
                          </div>
                          <h5 className="fw-bold mb-0">{tip.title}</h5>
                        </div>
                        <ul className="list-unstyled">
                          {tip.tips.map((item, idx) => (
                            <li key={idx} className="mb-2">
                              <i className="bi bi-arrow-right-circle-fill text-primary me-2"></i>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Common Mistakes */}
                <div className="col-12" data-aos="fade-up">
                  <div className="card border-0 shadow-lg">
                    <div className="card-body p-4">
                      <h5 className="fw-bold mb-4">Common Mistakes & Solutions</h5>
                      <div className="row g-3">
                        {commonMistakes.map((item, index) => (
                          <div className="col-md-6" key={index}>
                            <div className="d-flex">
                              <div className="mistake-icon me-3">
                                <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                              </div>
                              <div>
                                <h6 className="fw-bold mb-1">{item.mistake}</h6>
                                <p className="text-muted small mb-0">{item.solution}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources */}
            {activeTab === 'resources' && (
              <div className="row g-4">
                <div className="col-md-8 mx-auto">
                  <div className="card border-0 shadow-lg">
                    <div className="card-body p-4">
                      <h5 className="fw-bold mb-4">Recommended Typing Resources</h5>
                      <div className="list-group">
                        {typingResources.map((resource, index) => (
                          <a 
                            key={index}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <h6 className="fw-bold mb-1">{resource.name}</h6>
                              <p className="text-muted small mb-0">{resource.description}</p>
                            </div>
                            <div>
                              <span className="badge bg-primary me-2">{resource.type}</span>
                              <i className="bi bi-box-arrow-up-right"></i>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Mavis Beacon */}
                <div className="col-md-8 mx-auto">
                  <div className="card border-0 shadow-lg bg-primary text-white">
                    <div className="card-body p-4 text-center">
                      <i className="bi bi-download display-3 mb-3"></i>
                      <h4 className="fw-bold mb-3">Get Mavis Beacon</h4>
                      <p className="mb-4">
                        Download the latest version of Mavis Beacon Teaches Typing and start your typing journey today.
                      </p>
                      <a 
                        href="https://www.mavisbeacon.com/download" 
                        className="btn btn-warning btn-lg"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download Now <i className="bi bi-arrow-right ms-2"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Typing Games Section */}
      <section className="games-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Fun Typing Games</h2>
            <p className="lead text-muted">Make practice fun with these engaging games</p>
          </div>

          <div className="row g-4">
            {[
              { name: 'Letter Invaders', desc: 'Shoot down letters before they reach Earth', difficulty: 'Beginner' },
              { name: 'Driving Lessons', desc: 'Type words to drive your car faster', difficulty: 'Intermediate' },
              { name: 'Word Factory', desc: 'Build words quickly to keep the factory running', difficulty: 'Advanced' },
              { name: 'Typing Tides', desc: 'Save the beach by typing words correctly', difficulty: 'All Levels' }
            ].map((game, index) => (
              <div className="col-md-3" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="card border-0 shadow-lg text-center hover-card">
                  <div className="card-body p-4">
                    <div className="game-icon mb-3">
                      <i className="bi bi-controller" style={{ fontSize: '3rem', color: '#4400ff' }}></i>
                    </div>
                    <h5 className="fw-bold mb-2">{game.name}</h5>
                    <p className="text-muted small mb-2">{game.desc}</p>
                    <span className="badge bg-warning text-dark">{game.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Progress Tracking */}
      <section className="progress-section py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6" data-aos="fade-right">
              <h2 className="display-6 fw-bold mb-4" style={{ color: '#4400ff' }}>Track Your Progress</h2>
              <p className="lead mb-4">
                Mavis Beacon includes comprehensive progress tracking to help you see your improvement over time.
              </p>
              <ul className="list-unstyled">
                <li className="mb-3">
                  <i className="bi bi-graph-up-arrow text-success me-3"></i>
                  <strong>WPM Charts:</strong> See your speed improvement week by week
                </li>
                <li className="mb-3">
                  <i className="bi bi-pie-chart text-success me-3"></i>
                  <strong>Accuracy Reports:</strong> Track which keys need more practice
                </li>
                <li className="mb-3">
                  <i className="bi bi-trophy text-success me-3"></i>
                  <strong>Achievements:</strong> Earn badges as you reach milestones
                </li>
                <li className="mb-3">
                  <i className="bi bi-calendar-check text-success me-3"></i>
                  <strong>Practice Log:</strong> See your practice history and streaks
                </li>
              </ul>
            </div>
            <div className="col-lg-6" data-aos="fade-left">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Progress Tracking" 
                className="img-fluid rounded-4 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Frequently Asked Questions</h2>
            <p className="lead text-muted">Common questions about typing and Mavis Beacon</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                {[
                  {
                    q: 'How long does it take to learn touch typing?',
                    a: "With consistent practice (15-30 minutes daily), most people can learn touch typing in 4-6 weeks. Mavis Beacon's structured lessons make this process efficient and enjoyable."
                  },
                  {
                    q: 'Is Mavis Beacon suitable for children?',
                    a: 'Yes! Mavis Beacon has different skill levels and fun games that make it perfect for learners of all ages, including children as young as 7.'
                  },
                  {
                    q: 'What is a good typing speed?',
                    a: 'Average typing speed is 40 WPM. 60-80 WPM is considered good, while professional typists often reach 80-100+ WPM.'
                  },
                  {
                    q: 'Can I learn typing online for free?',
                    a: 'Yes, there are many free resources like Typing.com and Keybr.com. However, Mavis Beacon offers a comprehensive, structured program that many find more effective.'
                  },
                  {
                    q: 'How often should I practice?',
                    a: 'Daily practice of 15-30 minutes is ideal. Consistency is more important than long, infrequent sessions.'
                  },
                  {
                    q: 'Will typing practice help with coding?',
                    a: 'Absolutely! Efficient typing is essential for programming. Many developers use Mavis Beacon to improve their coding speed.'
                  }
                ].map((faq, index) => (
                  <div className="accordion-item mb-3 border-0 shadow-sm" key={index} data-aos="fade-up" data-aos-delay={index * 50}>
                    <h2 className="accordion-header">
                      <button 
                        className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`} 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target={`#faq${index}`}
                      >
                        <strong>{faq.q}</strong>
                      </button>
                    </h2>
                    <div id={`faq${index}`} className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`} data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5" style={{ background: 'linear-gradient(135deg, #4400ff 0%, #00cc99 100%)' }}>
        <div className="container text-center">
          <h2 className="display-6 fw-bold text-white mb-4">Start Your Typing Journey Today</h2>
          <p className="lead text-white mb-4">Join millions of users who improved their typing with Mavis Beacon</p>
          <a 
            href="https://www.mavisbeacon.com/download" 
            className="btn btn-warning btn-lg px-5 py-3 fw-bold"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Mavis Beacon <i className="bi bi-arrow-right ms-2"></i>
          </a>
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
          .sample-text {
            background: #f8f9fa;
            border-left: 4px solid #4400ff;
          }
          textarea:focus {
            border-color: #ffc100;
            box-shadow: 0 0 0 0.2rem rgba(255, 193, 0, 0.25);
          }
          .game-icon {
            transition: transform 0.3s ease;
          }
          .game-icon:hover {
            transform: scale(1.2);
          }
          .tip-icon {
            transition: transform 0.3s ease;
          }
          .tip-icon:hover {
            transform: rotate(10deg);
          }
        `}
      </style>
    </div>
  );
};

export default TypingSkills;