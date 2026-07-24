# payments/urls_api.py
from django.urls import path
from . import views_api

app_name = 'payments_api'

urlpatterns = [
    # API endpoints for React
    path('status/', views_api.api_subscription_status, name='api-subscription-status'),
    path('plans/', views_api.api_get_plans, name='api-plans'),
    path('initialize/', views_api.api_initialize_payment, name='api-initialize'),
    path('verify/', views_api.api_verify_payment, name='api-verify'),
    path('history/', views_api.api_payment_history, name='api-payment-history'),
    path('cancel/', views_api.api_cancel_subscription, name='api-cancel'),
    path('recommended/', views_api.api_get_recommended_subjects, name='api-recommended'),

     # NEW - Trial endpoints
    path('trial-status/', views_api.api_trial_status, name='api-trial-status'),
    path('check-access/', views_api.api_check_access, name='api-check-access'),

    # Paystack server-to-server webhook. This handler already existed and is
    # correct (verifies the X-Paystack-Signature HMAC, idempotent on re-delivery,
    # and its Payment.save() fires the signal that activates premium), but it was
    # never routed - so callbacks 404'd and payment confirmation relied entirely
    # on the user's browser completing the redirect to /payment/success. A user
    # who paid and then closed the tab or lost connectivity was charged but never
    # upgraded. Configure this path as the webhook URL in the Paystack dashboard.
    path('webhook/', views_api.api_paystack_webhook, name='api-paystack-webhook'),
]