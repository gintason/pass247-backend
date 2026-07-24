import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const RemoteJobs = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true
    });
  }, []);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);

  const jobCategories = [
    { id: 'all', name: 'All Jobs', icon: 'bi-briefcase' },
    { id: 'tech', name: 'Technology', icon: 'bi-laptop' },
    { id: 'design', name: 'Design & Creative', icon: 'bi-palette' },
    { id: 'marketing', name: 'Marketing', icon: 'bi-megaphone' },
    { id: 'sales', name: 'Sales', icon: 'bi-graph-up' },
    { id: 'customer', name: 'Customer Support', icon: 'bi-headset' },
    { id: 'writing', name: 'Writing & Content', icon: 'bi-pencil' },
    { id: 'finance', name: 'Finance & Admin', icon: 'bi-calculator' }
  ];

  const remoteJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp Inc.',
      logo: 'https://via.placeholder.com/60',
      category: 'tech',
      location: 'Remote (Anywhere)',
      salary: '$80k - $120k/year',
      type: 'Full-time',
      experience: '5+ years',
      posted: '2 days ago',
      description: 'We are looking for an experienced Frontend Developer proficient in React, TypeScript, and modern CSS frameworks.',
      requirements: [
        '5+ years of frontend development experience',
        'Expert knowledge of React and TypeScript',
        'Experience with state management (Redux, Context API)',
        'Strong understanding of responsive design',
        'Excellent communication skills'
      ],
      benefits: [
        '100% remote work',
        'Flexible hours',
        'Health insurance',
        '401(k) matching',
        'Home office stipend'
      ],
      applyLink: 'https://example.com/apply/1',
      companySize: '50-200 employees',
      featured: true
    },
    {
      id: 2,
      title: 'UX/UI Designer',
      company: 'DesignStudio',
      logo: 'https://via.placeholder.com/60',
      category: 'design',
      location: 'Remote (US Timezone)',
      salary: '$70k - $95k/year',
      type: 'Full-time',
      experience: '3+ years',
      posted: '1 day ago',
      description: 'Join our creative team to design beautiful and intuitive user interfaces for web and mobile applications.',
      requirements: [
        '3+ years of UX/UI design experience',
        'Proficiency in Figma and Adobe XD',
        'Portfolio demonstrating strong design skills',
        'Experience with user research and testing',
        'Knowledge of design systems'
      ],
      benefits: [
        'Remote-first culture',
        'Quarterly retreats',
        'Design conference budget',
        'MacBook Pro provided',
        'Wellness allowance'
      ],
      applyLink: 'https://example.com/apply/2',
      companySize: '20-50 employees',
      featured: true
    },
    {
      id: 3,
      title: 'Digital Marketing Manager',
      company: 'GrowthHub',
      logo: 'https://via.placeholder.com/60',
      category: 'marketing',
      location: 'Remote (Europe)',
      salary: '$60k - $85k/year',
      type: 'Full-time',
      experience: '4+ years',
      posted: '3 days ago',
      description: 'Lead our digital marketing efforts across SEO, SEM, and social media channels.',
      requirements: [
        '4+ years of digital marketing experience',
        'Proven track record in SEO/SEM',
        'Experience with Google Analytics and Ads',
        'Strong content creation skills',
        'Data-driven decision making'
      ],
      benefits: [
        'Fully remote',
        'Unlimited PTO',
        'Learning stipend',
        'Annual bonus',
        'Home internet reimbursement'
      ],
      applyLink: 'https://example.com/apply/3',
      companySize: '100-500 employees',
      featured: false
    },
    {
      id: 4,
      title: 'Customer Success Manager',
      company: 'SupportFirst',
      logo: 'https://via.placeholder.com/60',
      category: 'customer',
      location: 'Remote (Global)',
      salary: '$50k - $70k/year',
      type: 'Full-time',
      experience: '2+ years',
      posted: '5 days ago',
      description: 'Help our customers succeed by providing exceptional support and building strong relationships.',
      requirements: [
        '2+ years in customer success or support',
        'Excellent communication skills',
        'Problem-solving mindset',
        'Experience with CRM software',
        'Empathy and patience'
      ],
      benefits: [
        'Work from anywhere',
        'Flexible schedule',
        'Health benefits',
        'Professional development',
        'Team offsites'
      ],
      applyLink: 'https://example.com/apply/4',
      companySize: '10-50 employees',
      featured: false
    },
    {
      id: 5,
      title: 'Technical Writer',
      company: 'DocuMint',
      logo: 'https://via.placeholder.com/60',
      category: 'writing',
      location: 'Remote (Anywhere)',
      salary: '$55k - $75k/year',
      type: 'Contract',
      experience: '3+ years',
      posted: '1 week ago',
      description: 'Create clear and concise documentation for developer tools and APIs.',
      requirements: [
        '3+ years of technical writing experience',
        'Experience with API documentation',
        'Familiarity with Markdown and Git',
        'Ability to explain complex concepts',
        'Portfolio of writing samples'
      ],
      benefits: [
        'Remote work',
        'Flexible hours',
        'Equipment allowance',
        'Paid time off',
        'Contract-to-hire opportunity'
      ],
      applyLink: 'https://example.com/apply/5',
      companySize: '10-20 employees',
      featured: true
    },
    {
      id: 6,
      title: 'Sales Development Representative',
      company: 'SalesForcee',
      logo: 'https://via.placeholder.com/60',
      category: 'sales',
      location: 'Remote (Americas)',
      salary: '$45k + commission',
      type: 'Full-time',
      experience: 'Entry level',
      posted: '4 days ago',
      description: 'Generate leads and qualify prospects for our B2B SaaS platform.',
      requirements: [
        'Excellent communication skills',
        'Self-motivated and goal-oriented',
        'Experience with CRM tools',
        'Resilience and persistence',
        'Team player'
      ],
      benefits: [
        'Remote position',
        'Uncapped commission',
        'Career growth',
        'Training program',
        'Health benefits'
      ],
      applyLink: 'https://example.com/apply/6',
      companySize: '200-500 employees',
      featured: false
    },
    {
      id: 7,
      title: 'Financial Analyst',
      company: 'RemoteFinance',
      logo: 'https://via.placeholder.com/60',
      category: 'finance',
      location: 'Remote (UK)',
      salary: '£45k - £60k/year',
      type: 'Full-time',
      experience: '3+ years',
      posted: '2 weeks ago',
      description: 'Analyze financial data and prepare reports for our international clients.',
      requirements: [
        '3+ years of financial analysis',
        'CPA or CFA certification preferred',
        'Advanced Excel skills',
        'Experience with financial modeling',
        'Attention to detail'
      ],
      benefits: [
        'Work from home',
        'Pension scheme',
        'Private healthcare',
        'Annual bonus',
        'Professional development'
      ],
      applyLink: 'https://example.com/apply/7',
      companySize: '50-100 employees',
      featured: false
    },
    {
      id: 8,
      title: 'Backend Engineer (Python)',
      company: 'CodeStack',
      logo: 'https://via.placeholder.com/60',
      category: 'tech',
      location: 'Remote (Global)',
      salary: '$90k - $130k/year',
      type: 'Full-time',
      experience: '4+ years',
      posted: 'Just now',
      description: 'Build scalable backend services using Python and Django for our growing platform.',
      requirements: [
        '4+ years of Python development',
        'Experience with Django/Flask',
        'Database design (PostgreSQL, MongoDB)',
        'API development',
        'Cloud services (AWS/GCP)'
      ],
      benefits: [
        '100% remote',
        'Equity options',
        'Home office setup',
        'Learning budget',
        'Annual retreat'
      ],
      applyLink: 'https://example.com/apply/8',
      companySize: '100-200 employees',
      featured: true
    }
  ];

  const featuredCompanies = [
    { name: 'TechCorp', logo: 'https://via.placeholder.com/80', positions: 12 },
    { name: 'DesignStudio', logo: 'https://via.placeholder.com/80', positions: 8 },
    { name: 'GrowthHub', logo: 'https://via.placeholder.com/80', positions: 15 },
    { name: 'RemoteFirst', logo: 'https://via.placeholder.com/80', positions: 6 },
    { name: 'DevStack', logo: 'https://via.placeholder.com/80', positions: 10 },
    { name: 'CloudNine', logo: 'https://via.placeholder.com/80', positions: 4 }
  ];

  const resources = [
    { title: 'Remote Work Guide', type: 'PDF', size: '2.5 MB' },
    { title: 'Interview Tips', type: 'Video', size: '15 min' },
    { title: 'Salary Calculator', type: 'Tool', size: 'Interactive' },
    { title: 'Remote Contract Template', type: 'DOC', size: '1.2 MB' }
  ];

  const filteredJobs = remoteJobs.filter(job => {
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const saveJob = (jobId) => {
    if (savedJobs.includes(jobId)) {
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      setSavedJobs([...savedJobs, jobId]);
    }
  };

  return (
    <div className="remote-jobs-page">
      {/* Hero Section */}
      <section className="hero-section py-5" style={{ 
        background: 'linear-gradient(135deg, #4400ff 0%, #ff6b6b 100%)',
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
                Remote <span style={{ color: '#ffc100' }}>Jobs</span>
              </motion.h1>
              <motion.p 
                className="lead mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Find your dream remote job from thousands of opportunities worldwide. 
                Work from anywhere, live life on your terms.
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
                    placeholder="Search remote jobs by title, company, or keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-primary px-4">
                    Search Jobs
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-4 bg-light">
        <div className="container">
          <div className="row g-3">
            {[
              { value: '1,500+', label: 'Remote Jobs' },
              { value: '500+', label: 'Companies' },
              { value: '50+', label: 'Countries' },
              { value: '10k+', label: 'Placements' }
            ].map((stat, index) => (
              <div className="col-md-3 col-6" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="text-center">
                  <h4 className="fw-bold text-primary mb-0">{stat.value}</h4>
                  <small className="text-muted">{stat.label}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="jobs-section py-5">
        <div className="container">
          <div className="row">
            {/* Sidebar */}
            <div className="col-lg-3 mb-4">
              {/* Categories */}
              <div className="card border-0 shadow-sm mb-4" data-aos="fade-right">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Categories</h5>
                  <div className="list-group list-group-flush">
                    {jobCategories.map(category => (
                      <button
                        key={category.id}
                        className={`list-group-item list-group-item-action d-flex align-items-center ${
                          selectedCategory === category.id ? 'active' : ''
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <i className={`bi ${category.icon} me-3`}></i>
                        {category.name}
                        <span className="badge bg-primary ms-auto">
                          {remoteJobs.filter(j => category.id === 'all' || j.category === category.id).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Featured Companies */}
              <div className="card border-0 shadow-sm mb-4" data-aos="fade-right" data-aos-delay="100">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Featured Companies</h5>
                  {featuredCompanies.map((company, index) => (
                    <div key={index} className="d-flex align-items-center mb-3">
                      <img 
                        src={company.logo} 
                        alt={company.name}
                        className="rounded-3 me-3"
                        width="40"
                        height="40"
                      />
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-0">{company.name}</h6>
                        <small className="text-muted">{company.positions} open positions</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div className="card border-0 shadow-sm" data-aos="fade-right" data-aos-delay="200">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Free Resources</h5>
                  {resources.map((resource, index) => (
                    <div key={index} className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <i className="bi bi-file-earmark-text text-primary me-2"></i>
                        <small className="fw-bold">{resource.title}</small>
                      </div>
                      <span className="badge bg-light text-dark">{resource.size}</span>
                    </div>
                  ))}
                  <hr />
                  <Link to="/resources" className="btn btn-outline-primary w-100">
                    View All Resources
                  </Link>
                </div>
              </div>
            </div>

            {/* Job Listings */}
            <div className="col-lg-9">
              {/* Filters */}
              <div className="d-flex justify-content-between align-items-center mb-4" data-aos="fade-up">
                <h5 className="fw-bold mb-0">
                  {filteredJobs.length} Jobs Found
                </h5>
                <div className="btn-group">
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-sort-down me-1"></i> Latest
                  </button>
                  <button className="btn btn-outline-primary btn-sm">
                    <i className="bi bi-sort-up me-1"></i> Oldest
                  </button>
                </div>
              </div>

              {/* Job Cards */}
              <AnimatePresence>
                {filteredJobs.map((job, index) => (
                  <motion.div 
                    key={job.id}
                    className="card border-0 shadow-sm mb-4 hover-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    data-aos="fade-up"
                    data-aos-delay={index * 50}
                  >
                    <div className="card-body p-4">
                      <div className="row">
                        <div className="col-md-9">
                          <div className="d-flex">
                            <img 
                              src={job.logo} 
                              alt={job.company}
                              className="rounded-3 me-3"
                              width="60"
                              height="60"
                            />
                            <div>
                              <div className="d-flex align-items-center mb-2">
                                <h5 className="fw-bold mb-0 me-3">{job.title}</h5>
                                {job.featured && (
                                  <span className="badge bg-warning text-dark">Featured</span>
                                )}
                              </div>
                              <h6 className="text-primary mb-2">{job.company}</h6>
                              <div className="d-flex flex-wrap gap-3 mb-2">
                                <span className="text-muted small">
                                  <i className="bi bi-geo-alt me-1"></i> {job.location}
                                </span>
                                <span className="text-muted small">
                                  <i className="bi bi-cash-stack me-1"></i> {job.salary}
                                </span>
                                <span className="text-muted small">
                                  <i className="bi bi-briefcase me-1"></i> {job.type}
                                </span>
                                <span className="text-muted small">
                                  <i className="bi bi-clock me-1"></i> {job.posted}
                                </span>
                              </div>
                              <p className="text-muted small mb-2">{job.description}</p>
                              <div className="d-flex flex-wrap gap-2">
                                <span className="badge bg-light text-dark">
                                  <i className="bi bi-briefcase me-1"></i> Exp: {job.experience}
                                </span>
                                <span className="badge bg-light text-dark">
                                  <i className="bi bi-people me-1"></i> {job.companySize}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 text-md-end mt-3 mt-md-0">
                          <button 
                            className="btn btn-primary w-100 mb-2"
                            onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                          >
                            {selectedJob === job.id ? 'Show Less' : 'View Details'}
                          </button>
                          <button 
                            className={`btn w-100 ${savedJobs.includes(job.id) ? 'btn-warning' : 'btn-outline-secondary'}`}
                            onClick={() => saveJob(job.id)}
                          >
                            <i className={`bi ${savedJobs.includes(job.id) ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                            {savedJobs.includes(job.id) ? ' Saved' : ' Save Job'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {selectedJob === job.id && (
                          <motion.div 
                            className="mt-4 pt-4 border-top"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className="row">
                              <div className="col-md-6">
                                <h6 className="fw-bold mb-3">Requirements:</h6>
                                <ul className="list-unstyled">
                                  {job.requirements.map((req, idx) => (
                                    <li key={idx} className="mb-2">
                                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="col-md-6">
                                <h6 className="fw-bold mb-3">Benefits:</h6>
                                <ul className="list-unstyled">
                                  {job.benefits.map((benefit, idx) => (
                                    <li key={idx} className="mb-2">
                                      <i className="bi bi-gift-fill text-primary me-2"></i>
                                      {benefit}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="text-center mt-3">
                              <a 
                                href={job.applyLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-success btn-lg px-5"
                              >
                                <i className="bi bi-send me-2"></i>
                                Apply Now
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Load More */}
              {filteredJobs.length > 0 && (
                <div className="text-center mt-4">
                  <button className="btn btn-outline-primary btn-lg px-5">
                    Load More Jobs
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="tips-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Remote Job Tips</h2>
            <p className="lead text-muted">Expert advice to land your dream remote job</p>
          </div>

          <div className="row g-4">
            {[
              {
                icon: 'bi-file-earmark-text',
                title: 'Optimize Your Resume',
                tips: [
                  'Highlight remote work experience',
                  'Show self-management skills',
                  'Include relevant tools and software',
                  'Quantify your achievements'
                ]
              },
              {
                icon: 'bi-camera-video',
                title: 'Ace the Video Interview',
                tips: [
                  'Test your tech beforehand',
                  'Choose a professional background',
                  'Maintain eye contact',
                  'Prepare talking points'
                ]
              },
              {
                icon: 'bi-clock',
                title: 'Manage Time Zones',
                tips: [
                  'Be flexible with meeting times',
                  'Use time zone converters',
                  'Set clear availability hours',
                  'Communicate expectations'
                ]
              },
              {
                icon: 'bi-house-door',
                title: 'Setup Home Office',
                tips: [
                  'Invest in ergonomic furniture',
                  'Ensure reliable internet',
                  'Create a distraction-free zone',
                  'Use noise-canceling headphones'
                ]
              }
            ].map((tip, index) => (
              <div className="col-md-3" key={index} data-aos="zoom-in" data-aos-delay={index * 100}>
                <div className="card h-100 border-0 shadow-sm text-center p-4">
                  <div className="tip-icon mb-3">
                    <i className={`bi ${tip.icon}`} style={{ fontSize: '2.5rem', color: '#4400ff' }}></i>
                  </div>
                  <h5 className="fw-bold mb-3">{tip.title}</h5>
                  <ul className="list-unstyled text-start">
                    {tip.tips.map((item, idx) => (
                      <li key={idx} className="mb-2 small">
                        <i className="bi bi-check-circle text-success me-2"></i>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies Carousel */}
      <section className="companies-section py-5">
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Top Remote Companies</h2>
            <p className="lead text-muted">Join thousands of companies hiring remotely</p>
          </div>

          <div className="row g-4">
            {featuredCompanies.map((company, index) => (
              <div className="col-md-2 col-4" key={index} data-aos="zoom-in" data-aos-delay={index * 50}>
                <div className="card border-0 shadow-sm text-center p-3">
                  <img 
                    src={company.logo} 
                    alt={company.name}
                    className="img-fluid mx-auto mb-2"
                    style={{ maxHeight: '40px' }}
                  />
                  <small className="fw-bold">{company.name}</small>
                  <small className="text-muted">{company.positions} jobs</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section py-5" style={{ background: 'linear-gradient(135deg, #4400ff 0%, #ff6b6b 100%)' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 text-center text-white">
              <h3 className="fw-bold mb-3">Get Remote Jobs in Your Inbox</h3>
              <p className="mb-4">Subscribe to receive new remote job opportunities matching your skills</p>
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
            <h2 className="display-6 fw-bold" style={{ color: '#4400ff' }}>Remote Work FAQ</h2>
            <p className="lead text-muted">Common questions about remote jobs</p>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                {[
                  {
                    q: 'How do I find legitimate remote jobs?',
                    a: 'Use trusted platforms like this one, research companies, check reviews on Glassdoor, and be wary of jobs asking for payment upfront.'
                  },
                  {
                    q: 'What equipment do I need for remote work?',
                    a: 'Reliable internet connection, computer/laptop, noise-canceling headphones, and a quiet workspace. Some companies provide equipment stipends.'
                  },
                  {
                    q: 'How do I stay productive working from home?',
                    a: 'Create a routine, set clear boundaries, take regular breaks, use productivity tools, and have a dedicated workspace.'
                  },
                  {
                    q: 'Are remote jobs paid less?',
                    a: 'Not necessarily. Many companies pay based on skills and experience, not location. Some adjust pay based on cost of living.'
                  },
                  {
                    q: 'How do I handle taxes for remote work?',
                    a: 'Consult with a tax professional. Requirements vary by country and whether you work as an employee or contractor.'
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
          <h2 className="display-6 fw-bold text-white mb-3">Ready to Start Your Remote Career?</h2>
          <p className="lead text-white mb-4">Join thousands of professionals working from anywhere</p>
          <Link to="/profile" className="btn btn-warning btn-lg px-5 py-3 fw-bold">
            Create Your Profile <i className="bi bi-arrow-right ms-2"></i>
          </Link>
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
          .list-group-item.active {
            background-color: #4400ff;
            border-color: #4400ff;
          }
          .list-group-item.active i {
            color: white !important;
          }
          .tip-icon {
            transition: transform 0.3s ease;
          }
          .tip-icon:hover {
            transform: scale(1.2) rotate(5deg);
          }
          .search-box {
            max-width: 600px;
            margin: 0 auto;
          }
        `}
      </style>
    </div>
  );
};

export default RemoteJobs;