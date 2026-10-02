import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchPlans as fetchPlanList, startCheckout, describeCheckoutError, chargedPrice,
} from '../../api/payments';

const PaymentPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [plansError, setPlansError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  const fetchPlans = async () => {
    await Promise.resolve();
    try {
      // Real plans only: their ids are what /api/payments/initialize/ needs.
      setPlans(await fetchPlanList());
      setPlansError(null);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
      setPlansError('Could not load plans. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    await Promise.resolve();
    if (!user) return; // status endpoint needs a login
    try {
      const response = await api.get('/api/payments/status/');
      if (response.data.has_active_subscription) {
        setActiveSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    // Async loaders: every setState inside them runs after an await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlans();
    checkSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || paying) return;
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', '/payment-plans');
      navigate('/login');
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      await startCheckout(selectedPlan.id); // redirects to Paystack
    } catch (error) {
      console.error('Error initializing payment:', error);
      const { message, action } = describeCheckoutError(error);
      if (action === 'login') {
        sessionStorage.setItem('redirectAfterLogin', '/payment-plans');
        navigate('/login');
        return;
      }
      if (action === 'dashboard') checkSubscription();
      setPayError(message);
      setPaying(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Only real plans from the API are shown: made-up fallback plans had ids
  // that did not exist, so paying for them always failed with HTTP 400.
  const displayPlans = plans;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (activeSubscription) {
    return (
      <>
        <style>{`
          .active-subscription-wrapper {
            width: 100vw !important;
            margin-left: calc(-50vw + 50%) !important;
            margin-right: calc(-50vw + 50%) !important;
            min-height: 100vh;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .subscription-card {
            max-width: 600px;
            width: 100%;
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .subscription-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
            text-align: center;
            color: white;
          }
        `}</style>
        
        <div className="active-subscription-wrapper">
          <div className="subscription-card">
            <div className="subscription-header">
              <div className="display-1 mb-3">🎉</div>
              <h2 className="fw-bold mb-2">You're Already a Premium Member!</h2>
              <p className="mb-0">You have an active {activeSubscription.plan_name} plan</p>
            </div>
            <div className="p-4">
              <div className="bg-light p-4 rounded mb-4">
                <div className="row text-center">
                  <div className="col-6">
                    <small className="text-muted">Valid Until</small>
                    <h5 className="mb-0">{new Date(activeSubscription.end_date).toLocaleDateString()}</h5>
                  </div>
                  <div className="col-6">
                    <small className="text-muted">Days Remaining</small>
                    <h5 className="mb-0 text-primary">{activeSubscription.days_remaining} days</h5>
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-primary btn-lg w-100"
                onClick={() => navigate('/exams')}
              >
                Start Practicing <i className="fas fa-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        /* ===== FULL WIDTH STYLES ===== */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden !important;
          width: 100% !important;
        }

        .payment-plans-full {
          width: 100vw !important;
          margin-left: calc(-50vw + 50%) !important;
          margin-right: calc(-50vw + 50%) !important;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          padding: 5rem 2rem !important;
        }

        .payment-plans-container {
          max-width: 1200px !important;
          margin: 0 auto !important;
        }

        /* Header Section */
        .plans-header {
          text-align: center !important;
          margin-bottom: 3rem !important;
        }

        .plans-title {
          font-size: 2.5rem !important;
          font-weight: 800 !important;
          color: #1a1a1a !important;
          margin-bottom: 1rem !important;
          position: relative !important;
          display: inline-block !important;
        }

        .plans-title::after {
          content: '' !important;
          position: absolute !important;
          bottom: -10px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 80px !important;
          height: 4px !important;
          background: linear-gradient(90deg, #667eea, #764ba2) !important;
          border-radius: 2px !important;
        }

        .plans-subtitle {
          font-size: 1.2rem !important;
          color: #6c757d !important;
          max-width: 700px !important;
          margin: 1rem auto 0 !important;
        }

        /* Plans Grid */
        .plans-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)) !important;
          gap: 2rem !important;
          margin-bottom: 3rem !important;
        }

        .plan-card {
          background: #ffffff !important;
          border-radius: 24px !important;
          overflow: hidden !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
          position: relative !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }

        .plan-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
        }

        .plan-card.popular {
          border: 2px solid #ffc107 !important;
          transform: scale(1.02);
        }

        .plan-card.popular:hover {
          transform: scale(1.03);
        }

        .popular-badge {
          position: absolute !important;
          top: 20px !important;
          right: 20px !important;
          background: linear-gradient(135deg, #ffc107, #ff9800) !important;
          color: #1a1a1a !important;
          padding: 0.5rem 1rem !important;
          border-radius: 50px !important;
          font-size: 0.75rem !important;
          font-weight: 700 !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        }

        .plan-header {
          padding: 2rem !important;
          text-align: center !important;
          background: linear-gradient(135deg, #f8f9fa, #ffffff) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
        }

        .plan-name {
          font-size: 1.5rem !important;
          font-weight: 800 !important;
          margin-bottom: 1rem !important;
          color: #1a1a1a !important;
        }

        .plan-price {
          font-size: 2.5rem !important;
          font-weight: 800 !important;
          color: #667eea !important;
          margin-bottom: 0.5rem !important;
        }

        .plan-price small {
          font-size: 1rem !important;
          font-weight: 400 !important;
          color: #6c757d !important;
        }

        .plan-period {
          font-size: 0.85rem !important;
          color: #6c757d !important;
        }

        .plan-body {
          padding: 2rem !important;
        }

        .features-list {
          list-style: none !important;
          padding: 0 !important;
          margin: 0 0 2rem 0 !important;
        }

        .feature-item {
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          padding: 0.5rem 0 !important;
          color: #495057 !important;
          font-size: 0.95rem !important;
        }

        .feature-item i {
          color: #28a745 !important;
          font-size: 0.9rem !important;
        }

        .plan-button {
          width: 100% !important;
          padding: 0.875rem !important;
          border-radius: 50px !important;
          font-weight: 700 !important;
          font-size: 1rem !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
        }

        .plan-button.selected {
          background: linear-gradient(135deg, #667eea, #764ba2) !important;
          color: #ffffff !important;
          border: none !important;
        }

        .plan-button.unselected {
          background: transparent !important;
          border: 2px solid #667eea !important;
          color: #667eea !important;
        }

        .plan-button.unselected:hover {
          background: linear-gradient(135deg, #667eea, #764ba2) !important;
          color: #ffffff !important;
          transform: translateY(-2px) !important;
        }

        /* Summary Section */
        .summary-section {
          max-width: 800px !important;
          margin: 0 auto !important;
        }

        .summary-card {
          background: linear-gradient(135deg, #667eea, #764ba2) !important;
          border-radius: 20px !important;
          padding: 2rem !important;
          color: #ffffff !important;
        }

        .summary-content {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          flex-wrap: wrap !important;
          gap: 1rem !important;
        }

        .summary-text h4 {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          margin-bottom: 0.5rem !important;
        }

        .summary-text p {
          margin-bottom: 0 !important;
          opacity: 0.9 !important;
        }

        .summary-button {
          background: #ffc107 !important;
          color: #1a1a1a !important;
          border: none !important;
          padding: 0.875rem 2rem !important;
          border-radius: 50px !important;
          font-weight: 700 !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
        }

        .summary-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
        }

        /* Guarantee Badge */
        .guarantee-badge {
          text-align: center !important;
          margin-top: 3rem !important;
        }

        .guarantee-content {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          background: #ffffff !important;
          padding: 0.75rem 1.5rem !important;
          border-radius: 50px !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05) !important;
          color: #28a745 !important;
          font-size: 0.9rem !important;
          font-weight: 500 !important;
        }

        /* Responsive */
        @media (max-width: 991px) {
          .payment-plans-full {
            padding: 3rem 1.5rem !important;
          }
          .plans-title {
            font-size: 2rem !important;
          }
          .plan-card.popular {
            transform: scale(1);
          }
          .plan-card.popular:hover {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 768px) {
          .payment-plans-full {
            padding: 2rem 1rem !important;
          }
          .plans-title {
            font-size: 1.75rem !important;
          }
          .plans-subtitle {
            font-size: 1rem !important;
          }
          .plans-grid {
            grid-template-columns: 1fr !important;
          }
          .summary-content {
            flex-direction: column !important;
            text-align: center !important;
          }
        }
      `}</style>

      <div className="payment-plans-full">
        <div className="payment-plans-container">
          {/* Header */}
          <div className="plans-header">
            <h1 className="plans-title">Choose Your Plan</h1>
            <p className="plans-subtitle">
              Unlock full access to all questions, detailed explanations, and progress tracking
            </p>
          </div>

          {(plansError || (!loading && displayPlans.length === 0)) && (
            <div className="alert alert-warning text-center">
              {plansError || 'No plans are available right now. Please check back soon.'}
            </div>
          )}

          {/* Plans Grid */}
          <div className="plans-grid">
            {displayPlans.map(plan => (
              <div key={plan.id} className={`plan-card ${plan.is_popular ? 'popular' : ''}`}>
                {plan.is_popular && (
                  <div className="popular-badge">
                    <i className="fas fa-crown"></i>
                    Most Popular
                  </div>
                )}
                
                <div className="plan-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price">
                    {formatPrice(chargedPrice(plan))}
                    {plan.discount_percentage > 0 && (
                      <s className="ms-2 fs-6 text-muted">{formatPrice(plan.price)}</s>
                    )}
                    <small>/{plan.plan_type?.toLowerCase() || 'month'}</small>
                  </div>
                  <p className="plan-period">Billed {plan.plan_type?.toLowerCase() || 'monthly'}</p>
                </div>

                <div className="plan-body">
                  <ul className="features-list">
                    {plan.features && plan.features.map((feature, index) => (
                      <li key={index} className="feature-item">
                        <i className="fas fa-check-circle"></i>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`plan-button ${
                      selectedPlan?.id === plan.id ? 'selected' : 'unselected'
                    }`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {selectedPlan?.id === plan.id ? (
                      <>
                        <i className="fas fa-check-circle me-2"></i>
                        Selected
                      </>
                    ) : (
                      'Select Plan'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="summary-section">
              <div className="summary-card">
                <div className="summary-content">
                  <div className="summary-text">
                    <h4>Ready to upgrade?</h4>
                    <p>You've selected the <strong>{selectedPlan.name}</strong> plan</p>
                  </div>
                  <button 
                    className="summary-button"
                    onClick={handleSubscribe}
                    disabled={paying}
                  >
                    {paying ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Opening Paystack…</>
                    ) : (
                      <>Pay {formatPrice(chargedPrice(selectedPlan))} with Paystack <i className="fas fa-arrow-right ms-2"></i></>
                    )}
                  </button>
                </div>
                {payError && (
                  <div className="alert alert-light text-danger mt-3 mb-0" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>{payError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Money-back Guarantee */}
          <div className="guarantee-badge">
            <div className="guarantee-content">
              <i className="fas fa-shield-alt"></i>
              <span>7-day money-back guarantee • Secure payment • Instant access</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPlans;