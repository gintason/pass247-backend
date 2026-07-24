from django.core.management.base import BaseCommand
from django.utils.timezone import now
from django.core.mail import send_mail
from payments.models import Payment
from datetime import timedelta

class Command(BaseCommand):
    help = "Send email notifications for soon-to-expire subscriptions"

    def handle(self, *args, **kwargs):
        soon_expiring_payments = Payment.objects.filter(expiry_date__lte=now() + timedelta(days=5))

        for payment in soon_expiring_payments:
            send_mail(
                "Your Subscription is Expiring Soon!",
                "Hello, your PAS subscription will expire in 5 days. Renew now to maintain access!",
                "admin@pass247.net",
                [payment.email],
                fail_silently=True,
            )

        self.stdout.write(self.style.SUCCESS("Successfully sent expiry notifications!"))