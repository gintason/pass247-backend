import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const IndustryQuestions = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const [selectedIndustry, setSelectedIndustry] = useState('technology');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);

  const industries = [
    { id: 'technology', name: 'Technology & IT', icon: 'bi-laptop', count: 245 },
    { id: 'finance', name: 'Banking & Finance', icon: 'bi-bank', count: 189 },
    { id: 'healthcare', name: 'Healthcare & Medical', icon: 'bi-heart-pulse', count: 156 },
    { id: 'education', name: 'Education & Academia', icon: 'bi-book', count: 134 },
    { id: 'manufacturing', name: 'Manufacturing', icon: 'bi-gear', count: 98 },
    { id: 'retail', name: 'Retail & E-commerce', icon: 'bi-cart', count: 112 },
    { id: 'hospitality', name: 'Hospitality & Tourism', icon: 'bi-building', count: 87 },
    { id: 'construction', name: 'Construction & Engineering', icon: 'bi-tools', count: 76 },
    { id: 'legal', name: 'Legal & Law', icon: 'bi-briefcase', count: 65 },
    { id: 'marketing', name: 'Marketing & Advertising', icon: 'bi-megaphone', count: 143 }
  ];

  const experienceLevels = [
    { id: 'all', name: 'All Levels' },
    { id: 'entry', name: 'Entry Level' },
    { id: 'mid', name: 'Mid Level' },
    { id: 'senior', name: 'Senior Level' },
    { id: 'executive', name: 'Executive' }
  ];

  const industryQuestions = {
    technology: [
      {
        id: 1,
        question: "What programming languages are you proficient in?",
        answer: "I'm proficient in multiple languages including Python for backend development, JavaScript/TypeScript for frontend work, and Java for Android development. I also have experience with SQL for database management. My strongest language is Python, which I've used for 5 years in various projects including web applications, data analysis, and automation scripts.",
        level: "entry",
        category: "General",
        tips: ["Highlight your strongest language first", "Mention projects you've built", "Show willingness to learn new technologies"],
        companies: ["Google", "Microsoft", "Amazon"],
        frequency: "High"
      },
      {
        id: 2,
        question: "Explain the difference between REST and SOAP APIs",
        answer: "REST (Representational State Transfer) is an architectural style that uses HTTP methods and is stateless, lightweight, and ideal for web services. SOAP (Simple Object Access Protocol) is a protocol with strict standards, uses XML, and has built-in error handling and security. REST is more flexible and faster, while SOAP is more secure and reliable for enterprise applications.",
        level: "mid",
        category: "Web Development",
        tips: ["Use real-world examples", "Explain when to use each", "Mention RESTful principles"],
        companies: ["Netflix", "Twitter", "Salesforce"],
        frequency: "High"
      },
      {
        id: 3,
        question: "How do you handle a project with tight deadlines?",
        answer: "I prioritize tasks using the MoSCoW method (Must have, Should have, Could have, Won't have). I communicate early with stakeholders about expectations, break down the project into smaller sprints, and focus on delivering MVP first. I also ensure to maintain code quality even under pressure by using automated testing and code reviews.",
        level: "mid",
        category: "Project Management",
        tips: ["Show your prioritization skills", "Mention communication strategies", "Discuss quality assurance"],
        companies: ["Startups", "Agencies", "Product companies"],
        frequency: "Medium"
      },
      {
        id: 4,
        question: "What is your experience with cloud platforms?",
        answer: "I have extensive experience with AWS, including EC2, S3, Lambda, and RDS. I've also worked with Google Cloud Platform for data analytics projects. I'm certified in AWS Solutions Architect and have deployed multiple production applications using containerization with Docker and orchestration with Kubernetes.",
        level: "senior",
        category: "Cloud Computing",
        tips: ["Mention specific services", "Include certifications", "Discuss real projects"],
        companies: ["AWS", "Google Cloud", "Azure"],
        frequency: "High"
      },
      {
        id: 5,
        question: "How do you stay updated with the latest technology trends?",
        answer: "I follow tech blogs like Hacker News and Medium, participate in GitHub discussions, and attend local tech meetups and conferences. I also contribute to open-source projects and take online courses on platforms like Coursera and Udemy to learn new technologies. Currently, I'm exploring AI/ML through hands-on projects.",
        level: "entry",
        category: "Professional Development",
        tips: ["Show genuine interest", "Mention specific resources", "Discuss learning projects"],
        companies: ["All tech companies"],
        frequency: "Medium"
      }
    ],
    finance: [
      {
        id: 101,
        question: "How do you assess a company's financial health?",
        answer: "I analyze key financial ratios including liquidity ratios (current ratio, quick ratio), profitability ratios (ROE, ROA), and leverage ratios (debt-to-equity). I also review cash flow statements, income statements, and balance sheets over multiple periods to identify trends. Additionally, I consider industry benchmarks and economic factors.",
        level: "mid",
        category: "Financial Analysis",
        tips: ["Mention specific ratios", "Discuss trend analysis", "Include industry context"],
        companies: ["Goldman Sachs", "JP Morgan", "PwC"],
        frequency: "High"
      },
      {
        id: 102,
        question: "Explain the time value of money concept",
        answer: "The time value of money principle states that a dollar today is worth more than a dollar tomorrow due to its potential earning capacity. This core financial concept underlies discounted cash flow analysis, net present value calculations, and investment decisions. For example, receiving $100 today can be invested to earn interest, making it worth more than $100 received in the future.",
        level: "entry",
        category: "Fundamentals",
        tips: ["Use simple examples", "Connect to real applications", "Explain NPV and IRR"],
        companies: ["Investment Banks", "Asset Management"],
        frequency: "High"
      },
      {
        id: 103,
        question: "How do you manage risk in an investment portfolio?",
        answer: "I use diversification across asset classes, sectors, and geographies to manage risk. I implement modern portfolio theory to optimize risk-return tradeoffs and use hedging strategies when appropriate. Regular rebalancing and stress testing help maintain desired risk levels. I also consider clients' risk tolerance and investment horizon.",
        level: "senior",
        category: "Portfolio Management",
        tips: ["Discuss diversification", "Mention modern portfolio theory", "Address client needs"],
        companies: ["Hedge Funds", "Wealth Management"],
        frequency: "High"
      }
    ],
    healthcare: [
      {
        id: 201,
        question: "How do you handle stressful situations in patient care?",
        answer: "I remain calm and focused by following established protocols and prioritizing patient needs. I communicate clearly with the team, delegate tasks appropriately, and ensure I have all necessary information before making decisions. After critical incidents, I participate in debriefings to learn and improve.",
        level: "mid",
        category: "Patient Care",
        tips: ["Show composure", "Mention teamwork", "Discuss learning from experience"],
        companies: ["Hospitals", "Clinics"],
        frequency: "High"
      },
      {
        id: 202,
        question: "Describe your experience with electronic health records",
        answer: "I'm proficient with major EHR systems including Epic and Cerner. I use them daily for documentation, order entry, and reviewing patient histories. I also train new staff on EHR best practices and have participated in EHR implementation projects, ensuring data accuracy and HIPAA compliance.",
        level: "mid",
        category: "Healthcare Technology",
        tips: ["Name specific systems", "Discuss efficiency", "Mention compliance"],
        companies: ["Hospitals", "Health Tech"],
        frequency: "Medium"
      }
    ],
    education: [
      {
        id: 301,
        question: "How do you engage different types of learners?",
        answer: "I use varied teaching methods including visual aids for visual learners, discussions for auditory learners, and hands-on activities for kinesthetic learners. I incorporate technology, group work, and real-world examples. I regularly assess understanding and adjust my approach based on student feedback and performance.",
        level: "mid",
        category: "Teaching Methods",
        tips: ["Discuss learning styles", "Mention assessment", "Show adaptability"],
        companies: ["Schools", "Universities"],
        frequency: "High"
      },
      {
        id: 302,
        question: "How do you handle classroom management?",
        answer: "I establish clear expectations and consequences from day one. I build positive relationships with students, use proactive rather than reactive strategies, and address issues privately when possible. I also involve parents and administrators when needed and consistently apply fair consequences.",
        level: "entry",
        category: "Classroom Management",
        tips: ["Show consistency", "Discuss relationship building", "Mention communication"],
        companies: ["K-12 Schools"],
        frequency: "High"
      }
    ],
    manufacturing: [
      {
        id: 401,
        question: "How do you ensure quality control in production?",
        answer: "I implement statistical process control (SPC) to monitor production quality in real-time. I establish clear quality standards at each production stage, conduct regular inspections, and use root cause analysis when defects occur. I also train team members on quality procedures and encourage a culture of continuous improvement.",
        level: "mid",
        category: "Quality Control",
        tips: ["Mention SPC", "Discuss root cause analysis", "Show continuous improvement"],
        companies: ["Automotive", "Electronics"],
        frequency: "High"
      }
    ],
    retail: [
      {
        id: 501,
        question: "How do you handle difficult customers?",
        answer: "I listen actively to understand their concerns, empathize with their situation, and remain calm and professional. I focus on finding solutions rather than placing blame, and I'm empowered to make reasonable accommodations. If I can't resolve the issue, I escalate to management while keeping the customer informed.",
        level: "entry",
        category: "Customer Service",
        tips: ["Show empathy", "Focus on solutions", "Mention escalation process"],
        companies: ["Retail Chains", "E-commerce"],
        frequency: "High"
      }
    ]
  };

  const industryExperts = [
    { name: "Dr. Sarah Chen", role: "Tech Lead at Google", industry: "technology", image: "https://via.placeholder.com/100" },
    { name: "Michael Adebayo", role: "Investment Director", industry: "finance", image: "https://via.placeholder.com/100" },
    { name: "Dr. James Wilson", role: "Chief of Surgery", industry: "healthcare", image: "https://via.placeholder.com/100" },
    { name: "Prof. Emily Okonkwo", role: "Dean of Education", industry: "education", image: "https://via.placeholder.com/100" }
  ];

  const preparationGuides = [
    { title: "Tech Interview Mastery", type: "E-book", pages: 150, level: "All Levels" },
    { title: "Finance Case Studies", type: "Video Course", duration: "10 hours", level: "Mid-Senior" },
    { title: "Healthcare Scenarios", type: "Practice Tests", questions: 200, level: "All Levels" },
    { title: "Behavioral Questions", type: "Guide", pages: 80, level: "Entry Level" }
  ];

  const getCurrentQuestions = () => {
    return industryQuestions[selectedIndustry] || [];
  };

  const filteredQuestions = getCurrentQuestions().filter(q => {
    const matchesLevel = selectedLevel === 'all' || q.level === selectedLevel;
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const bookmarkQuestion = (questionId) => {
    if (bookmarkedQuestions.includes(questionId)) {
      setBookmarkedQuestions(bookmarkedQuestions.filter(id => id !== questionId));
    } else {
      setBookmarkedQuestions([...bookmarkedQuestions, questionId]);
    }
  };

  const getLevelBadge = (level) => {
    const badges = {
      entry: { bg: '#d4edda', text: '#155724', label: 'Entry Level' },
      mid: { bg: '#fff3cd', text: '#856404', label: 'Mid Level' },
      senior: { bg: '#f8d7da', text: '#721c24', label: 'Senior Level' },
      executive: { bg: '#cce5ff', text: '#004085', label: 'Executive' }
    };
    return badges[level] || badges.entry;
  };

  return (
    <div className="industry-questions-page">
      {/* Hero Section */}
      <section className="hero-section py-5" style={{ 
        background: 'linear-gradient(135deg, #4400ff 0%, #00cc99 100%)',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="container py-4">
          <div className="row align-items-center">
            <div className="col-lg-8 mx-auto text-center text-white" data-aos="fade-up">
              <motion.h1 
                className="display-3 fw-bold mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Industry <span style={{ color: '#ffc100' }}>Questions</span>
              </motion.h1>
              <motion.p 
                className="lead mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Prepare for your next interview with industry-specific questions and expert answers. 
                Practice with questions tailored to your field.
              </motion.p>
              <motion.div 
                className="search-box bg-white p-2 rounded-4 shadow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0">
                    <i className="bi bi-search text-primary"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-0"
                    placeholder="Search questions by keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Categories */}
      <section className="industries-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Browse by Industry</h2>
            <p className="lead text-muted">Select your industry to see relevant interview questions</p>
          </div>

          <div className="row g-3">
            {industries.map((industry, index) => (
              <div className="col-lg-3 col-md-4 col-6" key={industry.id} data-aos="zoom-in" data-aos-delay={index * 50}>
                <motion.div 
                  className={`card border-0 shadow-sm text-center p-3 hover-card ${selectedIndustry === industry.id ? 'border border-primary border-2' : ''}`}
                  onClick={() => setSelectedIndustry(industry.id)}
                  whileHover={{ scale: 1.05 }}
                >
                  <i className={`bi ${industry.icon}`} style={{ fontSize: '2rem', color: selectedIndustry === industry.id ? '#4400ff' : '#6c757d' }}></i>
                  <h6 className="fw-bold mt-2 mb-1">{industry.name}</h6>
                  <small className="text-muted">{industry.count} questions</small>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="questions-section py-5">
        <div className="container">
          <div className="row">
            {/* Sidebar */}
            <div className="col-lg-3 mb-4">
              {/* Experience Level Filter */}
              <div className="card border-0 shadow-sm mb-4" data-aos="fade-right">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Experience Level</h5>
                  {experienceLevels.map(level => (
                    <div key={level.id} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="level"
                        id={level.id}
                        checked={selectedLevel === level.id}
                        onChange={() => setSelectedLevel(level.id)}
                      />
                      <label className="form-check-label" htmlFor={level.id}>
                        {level.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Industry Stats */}
              <div className="card border-0 shadow-sm mb-4" data-aos="fade-right" data-aos-delay="100">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Industry Stats</h5>
                  <div className="mb-3">
                    <small className="text-muted">Total Questions</small>
                    <h4>{getCurrentQuestions().length}</h4>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">By Level:</small>
                    <div className="mt-2">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Entry</span>
                        <span className="fw-bold">{getCurrentQuestions().filter(q => q.level === 'entry').length}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>Mid</span>
                        <span className="fw-bold">{getCurrentQuestions().filter(q => q.level === 'mid').length}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>Senior</span>
                        <span className="fw-bold">{getCurrentQuestions().filter(q => q.level === 'senior').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preparation Guides */}
              <div className="card border-0 shadow-sm" data-aos="fade-right" data-aos-delay="200">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Prep Guides</h5>
                  {preparationGuides.map((guide, index) => (
                    <div key={index} className="d-flex align-items-center mb-3">
                      <i className="bi bi-file-earmark-text text-primary fs-4 me-3"></i>
                      <div>
                        <h6 className="fw-bold mb-0">{guide.title}</h6>
                        <small className="text-muted">
                          {guide.pages ? `${guide.pages} pages` : guide.duration || `${guide.questions} questions`}
                        </small>
                      </div>
                    </div>
                  ))}
                  <Link to="/resources" className="btn btn-outline-primary w-100 mt-2">
                    View All Resources
                  </Link>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="col-lg-9">
              {/* Industry Header */}
              <div className="d-flex justify-content-between align-items-center mb-4" data-aos="fade-up">
                <h4 className="fw-bold">
                  {industries.find(i => i.id === selectedIndustry)?.name} Questions
                  <span className="badge bg-primary ms-3">{filteredQuestions.length}</span>
                </h4>
                <div className="btn-group">
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-sort-down me-1"></i> Most Asked
                  </button>
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-sort-up me-1"></i> Recent
                  </button>
                </div>
              </div>

              {/* Questions */}
              <AnimatePresence>
                {filteredQuestions.map((q, index) => {
                  const levelBadge = getLevelBadge(q.level);
                  return (
                    <motion.div 
                      key={q.id}
                      className="card border-0 shadow-sm mb-4 hover-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.05 }}
                      data-aos="fade-up"
                      data-aos-delay={index * 50}
                    >
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between mb-3">
                          <div>
                            <span 
                              className="badge me-2" 
                              style={{ backgroundColor: levelBadge.bg, color: levelBadge.text }}
                            >
                              {levelBadge.label}
                            </span>
                            <span className="badge bg-light text-dark">{q.category}</span>
                            {q.frequency === 'High' && (
                              <span className="badge bg-warning text-dark ms-2">
                                <i className="bi bi-star-fill me-1"></i> Frequently Asked
                              </span>
                            )}
                          </div>
                          <button 
                            className={`btn btn-sm ${bookmarkedQuestions.includes(q.id) ? 'btn-warning' : 'btn-outline-secondary'}`}
                            onClick={() => bookmarkQuestion(q.id)}
                          >
                            <i className={`bi ${bookmarkedQuestions.includes(q.id) ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                          </button>
                        </div>

                        <h5 className="fw-bold mb-3">{q.question}</h5>
                        
                        <AnimatePresence>
                          {expandedQuestion === q.id ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <div className="bg-light p-4 rounded-3 mb-3">
                                <h6 className="fw-bold mb-2">Answer:</h6>
                                <p className="text-muted mb-3">{q.answer}</p>
                                
                                <h6 className="fw-bold mb-2">Tips:</h6>
                                <ul className="mb-3">
                                  {q.tips.map((tip, idx) => (
                                    <li key={idx} className="mb-1">
                                      <i className="bi bi-lightbulb text-warning me-2"></i>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>

                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <small className="text-muted me-3">
                                      <i className="bi bi-building me-1"></i>
                                      Asked by: {q.companies.join(', ')}
                                    </small>
                                  </div>
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => setExpandedQuestion(null)}
                                  >
                                    Show Less
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <button 
                              className="btn btn-link text-primary p-0"
                              onClick={() => setExpandedQuestion(q.id)}
                            >
                              View Answer <i className="bi bi-arrow-right ms-2"></i>
                            </button>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredQuestions.length === 0 && (
                <div className="text-center py-5">
                  <i className="bi bi-search display-1 text-muted mb-3"></i>
                  <h5>No questions found</h5>
                  <p className="text-muted">Try adjusting your filters or search term</p>
                </div>
              )}

              {/* Load More */}
              {filteredQuestions.length > 0 && (
                <div className="text-center mt-4">
                  <button className="btn btn-outline-primary btn-lg px-5">
                    Load More Questions
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Industry Experts */}
      <section className="experts-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Industry Experts</h2>
            <p className="lead text-muted">Learn from professionals who've been there</p>
          </div>

          <div className="row g-4">
            {industryExperts.map((expert, index) => (
              <div className="col-md-3" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="card border-0 shadow-sm text-center p-4">
                  <img 
                    src={expert.image} 
                    alt={expert.name}
                    className="rounded-circle mx-auto mb-3"
                    width="100"
                    height="100"
                  />
                  <h6 className="fw-bold mb-1">{expert.name}</h6>
                  <p className="text-muted small mb-2">{expert.role}</p>
                  <span className="badge bg-primary">{industries.find(i => i.id === expert.industry)?.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Practice Tools */}
      <section className="tools-section py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6" data-aos="fade-right">
              <h2 className="display-6 fw-bold mb-4" style={{ color: '#4400ff' }}>Practice Tools</h2>
              <p className="lead mb-4">Enhance your preparation with our interactive tools</p>
              <div className="row g-3">
                <div className="col-6">
                  <div className="card border-0 shadow-sm text-center p-3">
                    <i className="bi bi-clock-history display-4 text-primary mb-2"></i>
                    <h6 className="fw-bold">Mock Interviews</h6>
                    <small className="text-muted">Practice with timed sessions</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm text-center p-3">
                    <i className="bi bi-graph-up display-4 text-primary mb-2"></i>
                    <h6 className="fw-bold">Progress Tracking</h6>
                    <small className="text-muted">Monitor your improvement</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm text-center p-3">
                    <i className="bi bi-card-checklist display-4 text-primary mb-2"></i>
                    <h6 className="fw-bold">Flashcards</h6>
                    <small className="text-muted">Quick review mode</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm text-center p-3">
                    <i className="bi bi-journal-text display-4 text-primary mb-2"></i>
                    <h6 className="fw-bold">Study Notes</h6>
                    <small className="text-muted">Save your notes</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mt-4 mt-lg-0" data-aos="fade-left">
              <img 
                src="https://via.placeholder.com/600x400" 
                alt="Practice Tools" 
                className="img-fluid rounded-4 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section py-5" style={{ background: 'linear-gradient(135deg, #4400ff 0%, #00cc99 100%)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center text-white">
              <h3 className="fw-bold mb-3">Get Industry-Specific Questions</h3>
              <p className="mb-4">Subscribe to receive new questions and interview tips for your industry</p>
              <div className="input-group mb-3">
                <input 
                  type="email" 
                  className="form-control form-control-lg" 
                  placeholder="Enter your email address"
                />
                <button className="btn btn-warning btn-lg px-5">
                  Subscribe
                </button>
              </div>
              <small className="text-white-50">
                We respect your privacy. Unsubscribe at any time.
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Industry Interview FAQ</h2>
            <p className="lead text-muted">Common questions about industry-specific interviews</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                {[
                  {
                    q: "How do I prepare for industry-specific interviews?",
                    a: "Research the industry trends, understand key terminology, practice common questions, and stay updated with news in your field. Our industry-specific questions are a great starting point."
                  },
                  {
                    q: "Are questions different for each industry?",
                    a: "Yes, each industry has unique requirements and expectations. Technology focuses on technical skills, finance on analytical abilities, healthcare on patient care, etc."
                  },
                  {
                    q: "How often are new questions added?",
                    a: "We update our question bank monthly based on recent interviews and industry trends. Subscribe to our newsletter to get notified of new additions."
                  },
                  {
                    q: "Can I practice with mock interviews?",
                    a: "Yes, we offer mock interview tools that simulate real interview conditions. You can practice with timed sessions and get feedback on your answers."
                  },
                  {
                    q: "How do I know which level I should prepare for?",
                    a: "Consider your years of experience and the roles you're targeting. Entry-level is for 0-2 years, mid-level for 3-5 years, senior for 5-8 years, and executive for 8+ years."
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
      <section className="cta-section py-5 bg-primary">
        <div className="container text-center">
          <h2 className="display-6 fw-bold text-white mb-3">Ready to Ace Your Interview?</h2>
          <p className="lead text-white mb-4">Start practicing with industry-specific questions today</p>
          <Link to="/profile" className="btn btn-warning btn-lg px-5 py-3 fw-bold">
            Create Free Account <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>

      {/* Custom Styles */}
      <style>
        {`
          .hover-card {
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .hover-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(68, 0, 255, 0.1) !important;
          }
          .search-box {
            max-width: 500px;
            margin: 0 auto;
          }
          .industry-card {
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .industry-card:hover {
            transform: scale(1.05);
            border-color: #4400ff;
          }
        `}
      </style>
    </div>
  );
};

export default IndustryQuestions;