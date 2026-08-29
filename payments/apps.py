from django.apps import AppConfig
from django.db.utils import OperationalError, ProgrammingError


class PaymentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "payments"

    def ready(self):
        # Seed the canonical plans on a fresh database. Prices come from the
        # single source of truth in payments/pricing.py. Existing rows are
        # corrected by migration 0006_update_plan_pricing; get_or_create here
        # only creates missing plans and never clobbers admin-edited prices.
        from .models import SubscriptionPlan
        from .pricing import get_expected_pricing

        try:
            for tier in get_expected_pricing():
                SubscriptionPlan.objects.get_or_create(
                    name=tier["canonical_name"],
                    defaults={
                        "duration_days": tier["duration_days"],
                        "price": tier["price"],
                    },
                )
        except (OperationalError, ProgrammingError):
            # Table may not exist yet during the initial `migrate`.
            pass
