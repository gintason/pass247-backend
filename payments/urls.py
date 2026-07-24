# payments/urls.py (keep for HTML templates)
from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Main payment pages (HTML)
    path('', views.payment_page, name='payment_page'),
    path('pay/', views.initialize_payment, name='pay'),
    path('verify/', views.verify_payment, name='verify_payment'),
    path('success/', views.payment_success, name='payment_success'),
    path('cancelled/', views.payment_cancelled, name='cancelled'),
    
    # Webhook
    path("webhook/paystack/", views.paystack_webhook, name="paystack_webhook"),
    
    # Subscription management (HTML)
    path('history/', views.payment_history, name='payment_history'),
    path('cancel-subscription/', views.cancel_subscription, name='cancel_subscription'),
]