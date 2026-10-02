"""
Keep only the three real plans: Monthly, Quarterly and Yearly.

Admin-created duplicates such as "One Month" and "Three Months" (any alias
listed in payments.pricing.PLAN_PRICING) are merged into their canonical plan:

  1. their Payments and UserPlanSubscriptions are moved to the canonical plan
     (UserPlanSubscription.plan is on_delete=CASCADE, so deleting first would
     have deleted paying students' subscriptions);
  2. then the duplicate plan row is deleted.

The canonical plan's own scope (exam categories, subjects, ...) is left as is.
"""
from django.db import migrations

from payments.pricing import PLAN_PRICING


def merge_duplicates(apps, schema_editor):
    SubscriptionPlan = apps.get_model('payments', 'SubscriptionPlan')
    Payment = apps.get_model('payments', 'Payment')
    UserPlanSubscription = apps.get_model('payments', 'UserPlanSubscription')

    for plan_type, tier in PLAN_PRICING.items():
        canonical, _ = SubscriptionPlan.objects.get_or_create(
            name=tier['canonical_name'],
            defaults={'price': tier['price'], 'duration_days': tier['duration_days'],
                      'plan_type': plan_type},
        )
        aliases = {a.lower() for a in tier['aliases']} - {canonical.name.lower()}
        duplicates = [p for p in SubscriptionPlan.objects.exclude(pk=canonical.pk)
                      if p.name.strip().lower() in aliases]
        for dup in duplicates:
            Payment.objects.filter(plan=dup).update(plan=canonical)
            UserPlanSubscription.objects.filter(plan=dup).update(plan=canonical)
            if dup.is_popular and not canonical.is_popular:
                canonical.is_popular = True
                canonical.save(update_fields=['is_popular'])
            dup.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0006_update_plan_pricing'),
    ]

    operations = [
        migrations.RunPython(merge_duplicates, migrations.RunPython.noop),
    ]
