from paswebsite.celery import app 
from paswebsite.celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from .models import Payment
from datetime import timedelta

@shared_task
def send_expiry_notifications():
    """Send an email reminder 5 days before subscription expires."""
    soon_expiring_payments = Payment.objects.filter(expiry_date__lte=timezone.now() + timedelta(days=5))

    for payment in soon_expiring_payments:
        send_mail(
            "Your Subscription is Expiring Soon!",
            "Hello, your PAS subscription will expire in 5 days. Renew now to maintain access!",
            "admin@pass247.net",
            [payment.email],
            fail_silently=True,
        )
    return "Expiry notifications sent successfully!"
