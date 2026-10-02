"""Duplicate plans ("One Month", "Three Months") merge into the real ones."""
from importlib import import_module

from django.apps import apps as django_apps
from django.test import TestCase
from django.utils import timezone

from payments.models import Payment, SubscriptionPlan, UserPlanSubscription
from utils.factories import make_user

merge_duplicates = import_module('payments.migrations.0007_merge_duplicate_plans').merge_duplicates


class MergeDuplicatePlansTests(TestCase):
    def test_duplicates_removed_and_subscriptions_kept(self):
        one_month = SubscriptionPlan.objects.create(name='One Month', price=3500, duration_days=30)
        three = SubscriptionPlan.objects.create(name='Three Months', price=8500, duration_days=90)
        user = make_user(email='sub@example.com')
        payment = Payment.objects.create(user=user, amount=3500, reference='DUP-1', email=user.email,
                                         plan=one_month, status='success', verified=True,
                                         expiry_date=timezone.now() + timezone.timedelta(days=30))
        sub = UserPlanSubscription.objects.get(payment=payment)

        merge_duplicates(django_apps, None)

        names = sorted(SubscriptionPlan.objects.values_list('name', flat=True))
        self.assertEqual(names, ['Monthly', 'Quarterly', 'Yearly'])
        self.assertFalse(SubscriptionPlan.objects.filter(pk=three.pk).exists())
        sub.refresh_from_db()
        payment.refresh_from_db()
        self.assertEqual(sub.plan.name, 'Monthly')
        self.assertEqual(payment.plan.name, 'Monthly')
        self.assertTrue(sub.is_active)

    def test_plans_api_lists_three(self):
        SubscriptionPlan.objects.create(name='One Month', price=3500, duration_days=30)
        merge_duplicates(django_apps, None)
        res = self.client.get('/api/payments/plans/')
        self.assertEqual([p['name'] for p in res.json()['plans']], ['Monthly', 'Quarterly', 'Yearly'])
