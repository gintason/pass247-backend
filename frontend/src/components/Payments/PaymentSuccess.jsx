import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    fetchPaymentDetails();
    
    // Auto redirect countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchPaymentDetails = async () => {
    // Paystack redirects back here with ?reference=xxx (and sometimes &trxref=xxx)
    const reference = searchParams.get('reference') || searchParams.get('trxref');

    if (!reference) {
      setError('No payment reference found. If you just paid, check your dashboard for your updated subscription.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get('/api/payments/verify/', {
        params: { reference },
        withCredentials: true
      });

      if (response.data.verified && response.data.payment) {
        setPayment(response.data.payment);
        toast.success('Payment verified successfully!');
      } else {
        setError(response.data.message || 'Payment could not be verified yet. It may still be processing.');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error verifying payment:', err);
      setError(err.response?.data?.error || 'Unable to verify payment right now.');
      setLoading(false);
    }
  };

  const handleManualRedirect = () => {
    navigate('/dashboard');
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
    <div className="payment-success-container py-5">
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
                {/* Success Animation */}
                <motion.div 
                  className="mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center" 
                       style={{ width: '120px', height: '120px' }}>
                    <i className="bi bi-check-lg display-1"></i>
                  </div>
                </motion.div>
                
                {/* Success Message */}
                <motion.h2 
                  className="display-5 fw-bold text-success mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Payment Successful!
                </motion.h2>
                
                <motion.p 
                  className="lead mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {payment
                    ? 'Thank you for your subscription. Your account has been upgraded to Premium!'
                    : (error || 'Thank you for your subscription.')}
                </motion.p>
                
                {/* Payment Details */}
                {payment && (
                  <motion.div 
                    className="bg-light p-4 rounded-3 mb-4 text-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h5 className="fw-bold mb-3 text-center">Payment Details</h5>
                    <div className="row">
                      <div className="col-6">
                        <p className="mb-2 text-muted">Amount:</p>
                        <p className="mb-2 text-muted">Plan:</p>
                        <p className="mb-2 text-muted">Reference:</p>
                        <p className="mb-2 text-muted">Date:</p>
                        <p className="mb-2 text-muted">Expires:</p>
                      </div>
                      <div className="col-6 text-end">
                        <p className="mb-2 fw-bold">₦{Number(payment.amount || 0).toLocaleString()}</p>
                        <p className="mb-2 fw-bold">{payment.plan?.name || 'Premium Plan'}</p>
                        <p className="mb-2 fw-bold small">{payment.reference}</p>
                        <p className="mb-2 fw-bold">
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : '—'}
                        </p>
                        <p className="mb-2 fw-bold">
                          {payment.expiry_date ? new Date(payment.expiry_date).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Benefits List */}
                <motion.div 
                  className="mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <h6 className="fw-bold mb-3">What's included in your Premium access:</h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <p className="mb-1">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        All Questions
                      </p>
                    </div>
                    <div className="col-6">
                      <p className="mb-1">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        Detailed Explanations
                      </p>
                    </div>
                    <div className="col-6">
                      <p className="mb-1">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        Progress Tracking
                      </p>
                    </div>
                    <div className="col-6">
                      <p className="mb-1">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>
                        Mock Exams
                      </p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Action Buttons */}
                <motion.div 
                  className="d-flex gap-3 justify-content-center flex-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Link to="/dashboard" className="btn btn-primary btn-lg px-4">
                    <i className="bi bi-house-door me-2"></i>
                    Go to Dashboard
                  </Link>
                  <Link to="/exams" className="btn btn-outline-primary btn-lg px-4">
                    <i className="bi bi-play-circle me-2"></i>
                    Start Practicing
                  </Link>
                </motion.div>

                {/* Auto-redirect message */}
                <p className="text-muted small mt-4 mb-0">
                  Redirecting to dashboard in {countdown} seconds...
                  <button 
                    onClick={handleManualRedirect}
                    className="btn btn-link btn-sm p-0 ms-2"
                  >
                    Go now
                  </button>
                </p>
              </div>
            </motion.div>

            {/* Share Success */}
            <motion.div 
              className="text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p className="text-muted mb-2">Share your success:</p>
              <div className="d-flex justify-content-center gap-3">
                <a href="#" className="text-primary fs-4">
                  <i className="bi bi-facebook"></i>
                </a>
                <a href="#" className="text-info fs-4">
                  <i className="bi bi-twitter"></i>
                </a>
                <a href="#" className="text-success fs-4">
                  <i className="bi bi-whatsapp"></i>
                </a>
                <a href="#" className="text-primary fs-4">
                  <i className="bi bi-linkedin"></i>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .payment-success-container {
          min-height: 80vh;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;