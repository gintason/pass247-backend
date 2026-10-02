import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchPlans, startCheckout, describeCheckoutError, chargedPrice, formatNaira,
} from '../../api/payments';

/**
 * "Unlock Main Exam Mode" prompt with one-click Paystack checkout.
 *
 * Shown inside / after a Practice session and in the Practice Portal.
 * `plans` may be passed in (the 402 upgrade_required response already
 * includes them); otherwise they are loaded from /api/payments/plans/.
 *
 * variant: 'card' (full panel with plan buttons) | 'banner' (one line)
 */
const UpgradeCTA = ({
  variant = 'card',
  title = 'Unlock Main Exam Mode',
  message = 'Practice is free. Upgrade to sit timed, exam-standard papers by year, '
    + 'with full results and performance tracking.',
  plans: plansProp,
  onClose,
}) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(plansProp || []);
  const [loadingPlans, setLoadingPlans] = useState(!plansProp && variant === 'card');
  const [payingId, setPayingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (plansProp || variant !== 'card') return undefined;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchPlans();
        if (!cancelled) setPlans(list);
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    })();
    return () => { cancelled = true; };
  }, [plansProp, variant]);

  const pay = async (plan) => {
    if (payingId) return;
    setPayingId(plan.id);
    setError(null);
    try {
      await startCheckout(plan.id); // redirects to Paystack
    } catch (err) {
      const { message: msg, action } = describeCheckoutError(err);
      if (action === 'login') {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
        navigate('/login');
        return;
      }
      setError(msg);
      setPayingId(null);
    }
  };

  if (variant === 'banner') {
    return (
      <div className="upgrade-cta-banner d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <i className="fas fa-crown me-2"></i>
          <strong>{title}</strong>
          <span className="ms-2 opacity-75 d-none d-md-inline">Timed papers by year · full results</span>
        </div>
        <button type="button" className="btn btn-sm btn-warning fw-bold"
          onClick={() => navigate('/payment-plans')}>
          Upgrade Plan <i className="fas fa-arrow-right ms-1"></i>
        </button>
        <style>{UPGRADE_STYLES}</style>
      </div>
    );
  }

  return (
    <div className="upgrade-cta-card" role="region" aria-label={title}>
      {onClose && (
        <button type="button" className="btn-close btn-close-white upgrade-cta-close"
          aria-label="Close" onClick={onClose}></button>
      )}
      <div className="upgrade-cta-eyebrow"><i className="fas fa-crown me-2"></i>Main Exam Mode</div>
      <h4 className="upgrade-cta-title">{title}</h4>
      <p className="upgrade-cta-text">{message}</p>

      {loadingPlans ? (
        <div className="text-center py-2"><span className="spinner-border spinner-border-sm"></span></div>
      ) : plans.length > 0 ? (
        <div className="upgrade-cta-plans">
          {plans.map((plan) => (
            <button key={plan.id} type="button"
              className={`upgrade-cta-plan ${plan.is_popular ? 'popular' : ''}`}
              disabled={!!payingId}
              onClick={() => pay(plan)}>
              <span className="name">{plan.name}{plan.is_popular && <span className="badge ms-2">Popular</span>}</span>
              <span className="price">{formatNaira(chargedPrice(plan))}</span>
              <span className="period">{plan.duration_days} days</span>
              <span className="cta">
                {payingId === plan.id
                  ? <><span className="spinner-border spinner-border-sm me-1"></span>Opening Paystack…</>
                  : <>Pay with Paystack <i className="fas fa-lock ms-1"></i></>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="btn btn-warning fw-bold" onClick={() => navigate('/payment-plans')}>
          See plans <i className="fas fa-arrow-right ms-1"></i>
        </button>
      )}

      {error && <div className="alert alert-light text-danger mt-3 mb-0 py-2 small">{error}</div>}
      <div className="upgrade-cta-foot">
        <i className="fas fa-shield-alt me-1"></i> Secure payment by Paystack · instant access
      </div>
      <style>{UPGRADE_STYLES}</style>
    </div>
  );
};

const UPGRADE_STYLES = `
  .upgrade-cta-card {
    position: relative; border-radius: 20px; padding: 1.5rem;
    background: linear-gradient(135deg, #2b00a3 0%, #4400ff 55%, #7c3aed 100%);
    color: #fff; box-shadow: 0 16px 36px rgba(43, 0, 163, 0.25);
  }
  .upgrade-cta-close { position: absolute; top: 14px; right: 14px; }
  .upgrade-cta-eyebrow { font-size: .75rem; font-weight: 800; letter-spacing: .14em;
    text-transform: uppercase; color: #ffc100; margin-bottom: .4rem; }
  .upgrade-cta-title { font-weight: 800; margin: 0 0 .35rem; color: #fff; }
  .upgrade-cta-text { opacity: .9; margin-bottom: 1rem; max-width: 60ch; }
  .upgrade-cta-plans { display: grid; gap: .75rem;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
  .upgrade-cta-plan { display: flex; flex-direction: column; align-items: flex-start; gap: .15rem;
    text-align: left; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25);
    border-radius: 14px; padding: .85rem 1rem; color: #fff; transition: transform .15s, background .15s; }
  .upgrade-cta-plan:hover:not(:disabled) { background: rgba(255,255,255,.18); transform: translateY(-2px); }
  .upgrade-cta-plan:disabled { opacity: .7; }
  .upgrade-cta-plan.popular { border-color: #ffc100; background: rgba(255,193,0,.14); }
  .upgrade-cta-plan .name { font-weight: 700; }
  .upgrade-cta-plan .badge { background: #ffc100; color: #12101a; font-size: .65rem; }
  .upgrade-cta-plan .price { font-size: 1.35rem; font-weight: 800; }
  .upgrade-cta-plan .period { font-size: .8rem; opacity: .8; }
  .upgrade-cta-plan .cta { margin-top: .4rem; font-size: .85rem; font-weight: 700; color: #ffc100; }
  .upgrade-cta-foot { margin-top: .9rem; font-size: .8rem; opacity: .8; }
  .upgrade-cta-banner { border-radius: 14px; padding: .75rem 1rem; color: #fff;
    background: linear-gradient(120deg, #2b00a3, #4400ff); }
`;

export default UpgradeCTA;
