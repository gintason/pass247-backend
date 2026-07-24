import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    toast.info('Payment was cancelled. No charges were made.');
  }, []);

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    // Here you would send the support message to your backend
    toast.success('Support request sent! We\'ll get back to you soon.');
    setShowSupport(false);
    setSupportMessage('');
  };

  const reasons = [
    'Changed my mind',
    'Payment method issue',
    'Too expensive',
    'Technical problem',
    'Want to try free trial first',
    'Other'
  ];

  return (
    <div className="payment-cancelled-container py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <motion.div 
              className="card border-0 shadow-lg text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="card-body p-5">
                {/* Cancelled Icon */}
                <motion.div 
                  className="mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className="bg-warning text-dark rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '120px', height: '120px' }}>
                    <i className="bi bi-exclamation-triangle display-1"></i>
                  </div>
                </motion.div>
                
                {/* Message */}
                <motion.h2 
                  className="display-5 fw-bold text-warning mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Payment Cancelled
                </motion.h2>
                
                <motion.p 
                  className="lead mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Your payment was cancelled. No charges were made to your account.
                </motion.p>
                
                {/* Information Box */}
                <motion.div 
                  className="bg-light p-4 rounded-3 mb-4 text-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-info-circle-fill text-primary me-2"></i>
                    What happened?
                  </h6>
                  <p className="mb-2">Your payment was cancelled可能是因为:</p>
                  <ul className="mb-3">
                    <li>You closed the payment window</li>
                    <li>You clicked "Cancel" on the payment page</li>
                    <li>The payment process was interrupted</li>
                    <li>Your bank declined the transaction</li>
                  </ul>
                  <p className="mb-0 text-muted small">
                    Don't worry - your account is still active with free access.
                  </p>
                </motion.div>

                {/* Quick Reasons */}
                {!showSupport && (
                  <motion.div 
                    className="mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-muted mb-2">Quick help:</p>
                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                      {reasons.slice(0, 3).map((reason, index) => (
                        <button
                          key={index}
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setShowSupport(true);
                            setSupportMessage(`I cancelled because: ${reason}`);
                          }}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {/* Action Buttons */}
                <motion.div 
                  className="d-flex gap-3 justify-content-center flex-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link to="/payment-plans" className="btn btn-primary btn-lg px-4">
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Try Again
                  </Link>
                  <Link to="/exams" className="btn btn-outline-primary btn-lg px-4">
                    <i className="bi bi-play-circle me-2"></i>
                    Continue with Free
                  </Link>
                </motion.div>

                {/* Alternative Options */}
                <motion.div 
                  className="mt-4 pt-4 border-top"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-muted mb-3">
                    <i className="bi bi-star-fill text-warning me-2"></i>
                    You can still access free questions
                  </p>
                  <div className="row g-2">
                    <div className="col-6">
                      <Link to="/exams" className="btn btn-outline-success w-100">
                        <i className="bi bi-book me-2"></i>
                        Free Trials
                      </Link>
                    </div>
                    <div className="col-6">
                      <button 
                        className="btn btn-outline-info w-100"
                        onClick={() => setShowSupport(!showSupport)}
                      >
                        <i className="bi bi-envelope me-2"></i>
                        Contact Support
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Support Form */}
                {showSupport && (
                  <motion.div 
                    className="mt-4 p-4 bg-light rounded-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <h6 className="fw-bold mb-3">Tell us what happened:</h6>
                    <form onSubmit={handleSupportSubmit}>
                      <select 
                        className="form-select mb-3"
                        value={supportMessage}
                        onChange={(e) => setSupportMessage(e.target.value)}
                        required
                      >
                        <option value="">Select a reason...</option>
                        {reasons.map((reason, index) => (
                          <option key={index} value={`I cancelled because: ${reason}`}>
                            {reason}
                          </option>
                        ))}
                      </select>
                      <textarea
                        className="form-control mb-3"
                        rows="3"
                        placeholder="Additional details (optional)"
                        value={supportMessage.split(': ')[1] || ''}
                        onChange={(e) => setSupportMessage(`Other: ${e.target.value}`)}
                      ></textarea>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary">
                          Send Feedback
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={() => setShowSupport(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Help Links */}
            <motion.div 
              className="text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <div className="d-flex justify-content-center gap-4">
                <Link to="/how-it-works" className="text-decoration-none text-muted">
                  <i className="bi bi-question-circle me-1"></i>
                  How it Works
                </Link>
                <Link to="/contact" className="text-decoration-none text-muted">
                  <i className="bi bi-headset me-1"></i>
                  Support
                </Link>
                <Link to="/faq" className="text-decoration-none text-muted">
                  <i className="bi bi-question-lg me-1"></i>
                  FAQ
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .payment-cancelled-container {
          min-height: 80vh;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default PaymentCancelled;