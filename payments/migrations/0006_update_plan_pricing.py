"""
Apply the new subscription pricing tiers to existing plans.

Monthly ₦3,500 / Quarterly ₦8,500 / Yearly ₦40,000.

Idempotent and safe to re-run:
  * every plan whose name is a known alias of a tier is re-priced and gets its
    plan_type normalised (no rename -> no unique-constraint collisions, no
    deletions -> no broken Payment / UserPlanSubscription FKs);
  * a canonical row (name = "Monthly"/"Quarterly"/"Yearly") is guaranteed to
    exist afterwards.

Prices come from payments.pricing.PLAN_PRICING (the single source of truth).
"""
from django.db import migrations

from payments.pricing import PLAN_PRICING


def apply_new_pricing(apps, schema_editor):
    SubscriptionPlan = apps.get_model("payments", "SubscriptionPlan")

    for plan_type, tier in PLAN_PRICING.items():
        # 1) Re-price every existing row that matches a known alias.
        for alias in tier['aliases']:
            SubscriptionPlan.objects.filter(name__iexact=alias).update(
                price=tier['price'],
                duration_days=tier['duration_days'],
                plan_type=plan_type,
            )

        # 2) Ensure the canonical row exists and is correctly priced.
        obj, created = SubscriptionPlan.objects.get_or_create(
            name=tier['canonical_name'],
            defaults={
                'price': tier['price'],
                'duration_days': tier['duration_days'],
                'plan_type': plan_type,
            },
        )
        if not created:
            obj.price = tier['price']
            obj.duration_days = tier['duration_days']
            obj.plan_type = plan_type
            obj.save(update_fields=['price', 'duration_days', 'plan_type'])


def noop_reverse(apps, schema_editor):
    # Pricing is data, not schema; nothing to reverse.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0005_subscriptionplan_quiz_interview_scope"),
    ]

    operations = [
        migrations.RunPython(apply_new_pricing, noop_reverse),
    ]
