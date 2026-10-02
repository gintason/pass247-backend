import api from './client';

/**
 * Paystack checkout helpers shared by the pricing page and every
 * "Upgrade Plan" button in the Practice Portal.
 */

// /api/payments/plans/ returns { success, plans: [...] }.
export async function fetchPlans() {
  const { data } = await api.get('/api/payments/plans/');
  if (Array.isArray(data?.plans)) return data.plans;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data)) return data;
  return [];
}

export const chargedPrice = (plan) =>
  Math.round(Number(plan?.discounted_price ?? plan?.price ?? 0));

export const formatNaira = (amount) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);

/**
 * Start a Paystack checkout and redirect the browser to the secure Paystack
 * page. Sends JSON ({ plan_id }) - the backend previously rejected the
 * FormData body with "Invalid request data" (HTTP 400).
 */
export async function startCheckout(planId) {
  const { data } = await api.post('/api/payments/initialize/', {
    plan_id: Number(planId),
    // Paystack returns the student here; the backend only accepts our own
    // origins and falls back to FRONTEND_URL/payment/success otherwise.
    callback_url: `${window.location.origin}/payment/success`,
  });
  if (!data?.authorization_url) {
    throw new Error(data?.error || 'Could not start the payment. Please try again.');
  }
  window.location.assign(data.authorization_url);
  return data;
}

/** Human message + what to do next, from an initialize() failure. */
export function describeCheckoutError(err) {
  const status = err?.response?.status;
  const body = err?.response?.data || {};
  if (status === 401 || body.code === 'login_required') {
    return { message: 'Please log in to upgrade your plan.', action: 'login' };
  }
  if (status === 409 || body.code === 'already_subscribed') {
    return { message: body.error || 'You already have an active plan.', action: 'dashboard' };
  }
  if (status === 403) {
    return { message: 'Your session expired. Refresh the page and try again.', action: 'retry' };
  }
  return {
    message: body.error || err?.message || 'Payment could not be started. Please try again.',
    action: 'retry',
  };
}
