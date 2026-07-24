import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const RESEND_COOLDOWN_SECONDS = 45;

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerification } = useAuth();
  const inputRef = useRef(null);

  // The email arrives via router state from Register or Login. Without it
  // there is nothing to verify against.
  const email = location.state?.email || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((n) => n - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCodeChange = (e) => {
    // Digits only, capped at six — mirrors what the API will accept.
    const next = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }

    setLoading(true);
    const result = await verifyEmail(email, code);
    setLoading(false);

    if (result.success) {
      toast.success('Email verified. Welcome to Pass24/7.');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
      setCode('');
      inputRef.current?.focus();
    }
  };

  const handleResend = async () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    const result = await resendVerification(email);
    if (result.success) {
      toast.info('If that account is awaiting verification, a new code is on its way.');
    } else {
      toast.error(result.error);
    }
  };

  if (!email) {
    return (
      <div className="auth-shell">
        <main className="auth-main">
          <div className="auth-card">
            <h1 className="auth-title">Nothing to verify</h1>
            <p className="auth-subtitle">
              Start by creating an account, or sign in if you already have one.
            </p>
            <Link className="btn btn-primary auth-submit" to="/register">Create an account</Link>
            <p className="auth-alt">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" className="auth-aside-brand">Pass24/7</Link>
        <div>
          <h2 className="auth-aside-title">One code and you&apos;re in.</h2>
          <p className="auth-aside-copy">
            We verify your email so results, receipts and reset links reach
            you — and so nobody else can sign up using your address.
          </p>
        </div>
        <span aria-hidden="true" />
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <p className="auth-eyebrow">Step 2 of 2</p>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a 6-digit code to <span className="otp-sent-to">{email}</span>.
            It expires in 10 minutes.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-3">
              <label htmlFor="otp" className="form-label">Verification code</label>
              <input
                id="otp"
                ref={inputRef}
                className="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                aria-describedby="otp-help"
              />
              <small id="otp-help" className="auth-hint">
                Enter the six digits from the email.
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Verifying…' : 'Verify email'}
            </button>
          </form>

          <div className="auth-alt">
            Didn&apos;t get it? Check spam, then{' '}
            <button
              type="button"
              className="otp-resend"
              onClick={handleResend}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `resend in ${cooldown}s` : 'send a new code'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
