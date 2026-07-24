"""
Tests for payment verification and access control.

Covers the Phase 0 IDOR fix, the Phase 2A LOGIN_URL fix, the Paystack
webhook routing, and the Phase 2B tier-scoping / live-subscription work.
All findings that were previously encoded as expected failures (H-1/H-2/H-3,
webhook routing) now have real, passing assertions.
"""

from datetime import timedelta

from django.test import TestCase, Client, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from payments.models import Payment, UserPlanSubscription
from payments.utils import check_user_access
from utils.factories import (
    make_user, make_admin, make_plan, make_exam_category, make_subject,
    make_question_bank, make_active_subscription, make_expired_subscription,
    set_stale_premium_flag,
)


class PaymentOwnershipTests(TestCase):
    """
    Phase 0 fix: api_verify_payment used update_or_create keyed only on
    `reference`, so any logged-in user could claim someone else's payment by
    passing their reference.

    NOTE: api_verify_payment is a plain Django view (@login_required,
    JsonResponse), not a DRF view. DRF's force_authenticate() has no effect on
    it, so these tests use django.test.Client with force_login().
    """

    def setUp(self):
        self.client = Client()
        self.owner = make_user(username='owner')
        self.attacker = make_user(username='attacker')
        self.plan = make_plan()
        self.payment = Payment.objects.create(
            user=self.owner,
            amount=self.plan.price,
            reference='PAS-VICTIM-REFERENCE',
            email='owner@example.com',
            verified=True,
            status='success',
            plan=self.plan,
        )

    def test_other_user_cannot_claim_existing_payment(self):
        self.client.force_login(self.attacker)
        response = self.client.get(
            '/api/payments/verify/', {'reference': 'PAS-VICTIM-REFERENCE'}
        )
        self.assertIn(
            response.status_code, (400, 403, 404),
            f'attacker got {response.status_code} claiming another user payment'
        )
        self.payment.refresh_from_db()
        self.assertEqual(
            self.payment.user_id, self.owner.pk,
            'payment was reassigned to the attacker'
        )

    def test_owner_can_verify_own_payment(self):
        self.client.force_login(self.owner)
        response = self.client.get(
            '/api/payments/verify/', {'reference': 'PAS-VICTIM-REFERENCE'}
        )
        self.assertLess(response.status_code, 500, response.content)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.user_id, self.owner.pk)


class LoginRedirectConfigTests(TestCase):
    """
    Regression tests for the LOGIN_URL misconfiguration found by this suite.

    settings.LOGIN_URL was "login", but the only URL named 'login' lives in
    users/urls.py, which is never include()d in paswebsite/urls.py. Django's
    @login_required reverses LOGIN_URL to build its redirect, so with no such
    name registered it raised NoReverseMatch - meaning an unauthenticated
    request to any plain-Django @login_required view returned HTTP 500
    instead of a redirect.

    12 live endpoints were affected, including every payment endpoint:
    api_subscription_status, api_get_plans, api_initialize_payment,
    api_verify_payment, api_payment_history, api_cancel_subscription,
    api_get_recommended_subjects, api_trial_status, api_check_access,
    api_user_stats, api_get_profile, api_update_profile.

    Fixed by setting LOGIN_URL to the literal path '/login', which is the
    React route that serves the login page.
    """

    def setUp(self):
        self.client = Client()

    def test_login_url_setting_is_resolvable(self):
        from django.conf import settings
        from django.urls import reverse, NoReverseMatch

        login_url = settings.LOGIN_URL
        if login_url.startswith('/'):
            return  # a literal path needs no reversing

        try:
            reverse(login_url)
        except NoReverseMatch:
            self.fail(
                f"settings.LOGIN_URL = {login_url!r} cannot be reversed; "
                "@login_required will raise NoReverseMatch (HTTP 500) for "
                "unauthenticated requests instead of redirecting"
            )

    def test_unauthenticated_payment_request_does_not_500(self):
        response = self.client.get(
            '/api/payments/verify/', {'reference': 'anything'}
        )
        self.assertLess(
            response.status_code, 500,
            f'unauthenticated payment request returned {response.status_code}'
        )


class AccessControlTests(TestCase):
    """Baseline behaviour of check_user_access() that must not regress."""

    def setUp(self):
        self.category = make_exam_category()
        self.subject = make_subject(categories=[self.category])
        self.bank = make_question_bank(
            self.subject, self.category, is_free=False, has_free_trial=False
        )

    def test_anonymous_is_denied(self):
        from django.contrib.auth.models import AnonymousUser
        has_access, _msg, _data = check_user_access(AnonymousUser(), self.bank)
        self.assertFalse(has_access)

    def test_user_without_subscription_is_denied(self):
        user = make_user()
        has_access, _msg, _data = check_user_access(user, self.bank)
        self.assertFalse(has_access, 'non-paying user was granted access')

    def test_active_subscriber_is_allowed(self):
        user = make_user(username='subscriber')
        make_active_subscription(user)
        has_access, _msg, _data = check_user_access(user, self.bank)
        self.assertTrue(has_access, 'paying subscriber was denied access')

    def test_admin_is_allowed_without_paying(self):
        admin = make_admin()
        has_access, _msg, data = check_user_access(admin, self.bank)
        self.assertTrue(has_access, 'admin was blocked by the paywall')
        self.assertTrue(data.get('is_admin'))

    def test_free_bank_is_open(self):
        free_bank = make_question_bank(
            self.subject, self.category, name='Free Bank', is_free=True
        )
        has_access, _msg, _data = check_user_access(make_user(), free_bank)
        self.assertTrue(has_access)

    def test_expired_subscriber_is_denied_for_exams(self):
        """
        exams re-queries end_date live, so this should already pass. It is the
        control case for the quiz/interview equivalents below.
        """
        user = make_user(username='lapsed')
        make_expired_subscription(user)
        has_access, _msg, _data = check_user_access(user, self.bank)
        self.assertFalse(has_access, 'expired subscriber still has exam access')


class SubscriptionExpiryTests(TestCase):
    """Model-level expiry behaviour."""

    def test_expired_subscription_is_not_valid(self):
        user = make_user()
        _payment, subscription = make_expired_subscription(user)
        self.assertIsNotNone(subscription, 'expected the payment signal to create a subscription')
        self.assertFalse(subscription.is_valid())

    def test_active_subscription_is_valid(self):
        user = make_user()
        _payment, subscription = make_active_subscription(user)
        self.assertIsNotNone(subscription)
        self.assertTrue(subscription.is_valid())

    def test_successful_payment_creates_subscription(self):
        user = make_user()
        payment, subscription = make_active_subscription(user)
        self.assertTrue(
            UserPlanSubscription.objects.filter(user=user, payment=payment).exists(),
            'payment post_save signal did not create a subscription'
        )


# ---------------------------------------------------------------------------
# KNOWN GAPS - these encode audit findings that are not yet fixed.
# Expected to FAIL until the tier-enforcement work lands.
# ---------------------------------------------------------------------------

class TierScopingTests(TestCase):
    """
    Finding H-1: SubscriptionPlan.exam_categories / .subjects exist and are
    editable in the admin, but check_user_access() never consults them. Any
    active plan currently unlocks all content.
    """

    def setUp(self):
        self.maths_cat = make_exam_category(name='WASSCE', display_name='WAEC/NECO')
        self.aptitude_cat = make_exam_category(name='APTITUDE', display_name='Aptitude Tests')

        self.maths = make_subject(name='Mathematics', code='MTH',
                                  categories=[self.maths_cat])
        self.verbal = make_subject(name='Verbal Reasoning', code='VRB',
                                   categories=[self.aptitude_cat])

        # A plan that should only unlock Mathematics.
        self.maths_only_plan = make_plan(
            name='Maths Only', subjects=[self.maths],
            exam_categories=[self.maths_cat],
        )

        self.maths_bank = make_question_bank(
            self.maths, self.maths_cat, name='Maths Bank',
            is_free=False, has_free_trial=False,
        )
        self.verbal_bank = make_question_bank(
            self.verbal, self.aptitude_cat, name='Verbal Bank',
            is_free=False, has_free_trial=False,
        )

        self.user = make_user(username='mathsonly')
        make_active_subscription(self.user, plan=self.maths_only_plan)

    def test_scoped_plan_grants_its_own_subject(self):
        """This should pass both before and after the fix."""
        has_access, _msg, _data = check_user_access(
            self.user, self.maths_bank, subject=self.maths
        )
        self.assertTrue(has_access, 'plan did not grant access to its own subject')

    def test_scoped_plan_does_not_grant_other_subjects(self):
        """
        Fixed (H-1): a Mathematics-only plan must NOT unlock Verbal Reasoning.
        check_user_access now verifies the plan's scope covers the requested
        subject rather than merely that some active subscription exists.
        """
        has_access, _msg, _data = check_user_access(
            self.user, self.verbal_bank, subject=self.verbal
        )
        self.assertFalse(
            has_access,
            'a subject-scoped plan granted access to a subject outside its scope'
        )


class StalePremiumFlagTests(TestCase):
    """
    Findings H-2 / H-3: quiz and interview content is gated on the cached
    profile.is_premium boolean, with no expiry check and no periodic job to
    reset it. Once set, access effectively never lapses.
    """

    def setUp(self):
        self.client = APIClient()
        from quiz.models import Category, Question
        self.category = Category.objects.create(category_name='General Knowledge')
        for i in range(30):
            Question.objects.create(
                category=self.category,
                question=f'Question {i}?',
                correct_answers='answer',
            )
        self.user = make_user(username='lapsed')
        make_expired_subscription(self.user)
        # Simulate the flag being left set after the plan lapsed.
        set_stale_premium_flag(self.user, expiry=timezone.now() - timedelta(days=5))

    def test_lapsed_user_is_denied_quiz_access(self):
        """
        Fixed (H-2/H-3). check_quiz_access evaluates live subscription state
        and only honours profile.is_premium when premium_expiry is still
        valid. A user whose plan lapsed - even with the stale is_premium flag
        left True - must be denied.
        """
        from payments.utils import check_quiz_access
        has_access, _msg, _data = check_quiz_access(self.user)
        self.assertFalse(
            has_access,
            'lapsed subscriber with a stale is_premium flag still had quiz access'
        )

    def test_active_subscriber_has_quiz_access(self):
        """Control: a genuinely active subscriber is allowed."""
        from payments.utils import check_quiz_access
        active_user = make_user(username='activequiz')
        make_active_subscription(active_user)
        has_access, _msg, _data = check_quiz_access(active_user)
        self.assertTrue(has_access, 'active subscriber was denied quiz access')

    def test_quiz_and_interview_helpers_exist(self):
        """Both apps now have a shared helper for live subscription state."""
        from payments.utils import check_quiz_access, check_interview_access  # noqa: F401


class PaystackWebhookRoutingTests(TestCase):
    """
    The Paystack webhook is now routed at /api/payments/webhook/.

    Previously api_paystack_webhook existed in views_api.py but was not in
    urls_api.py (the only payments module mounted), so callbacks 404'd and
    payment confirmation relied entirely on the browser redirect to
    /payment/success. A user who paid then closed the tab was charged but
    never upgraded.
    """

    def setUp(self):
        self.client = APIClient()

    def test_webhook_endpoint_is_routed(self):
        """Not 404. A signature-less POST is rejected (400), not missing."""
        response = self.client.post(
            '/api/payments/webhook/',
            data={'event': 'charge.success', 'data': {}},
            format='json',
        )
        self.assertNotEqual(
            response.status_code, 404,
            'Paystack webhook is not routed - payment confirmation is '
            'redirect-dependent and will silently drop payments'
        )


@override_settings(PAYSTACK_LIVE_SECRET_KEY='sk_test_dummy_secret_for_tests')
class PaystackWebhookBehaviourTests(TestCase):
    """
    End-to-end behaviour of the webhook: signature enforcement, idempotency,
    and that a verified charge.success actually activates premium via the
    Payment post_save signal.
    """

    def setUp(self):
        self.client = Client()
        self.user = make_user(username='webhookbuyer')
        self.plan = make_plan()
        # A pending, unverified payment - the state right after initialize,
        # before the user has been confirmed as paid.
        self.payment = Payment.objects.create(
            user=self.user,
            amount=self.plan.price,
            reference='PAS-WEBHOOK-TEST',
            email=self.user.email,
            verified=False,
            status='pending',
            plan=self.plan,
            expiry_date=timezone.now() + timedelta(days=30),
        )

    def _sign(self, raw_body: bytes) -> str:
        import hashlib
        import hmac
        return hmac.new(
            b'sk_test_dummy_secret_for_tests', raw_body, hashlib.sha512
        ).hexdigest()

    def _post(self, payload: dict, signed: bool = True):
        import json as _json
        raw = _json.dumps(payload).encode('utf-8')
        headers = {}
        if signed:
            headers['HTTP_X_PAYSTACK_SIGNATURE'] = self._sign(raw)
        return self.client.post(
            '/api/payments/webhook/',
            data=raw,
            content_type='application/json',
            **headers,
        )

    def _charge_success(self):
        return {'event': 'charge.success', 'data': {'reference': 'PAS-WEBHOOK-TEST'}}

    def test_missing_signature_is_rejected(self):
        response = self._post(self._charge_success(), signed=False)
        self.assertEqual(response.status_code, 400)
        self.payment.refresh_from_db()
        self.assertFalse(self.payment.verified, 'payment verified without a signature')

    def test_invalid_signature_is_rejected(self):
        import json as _json
        raw = _json.dumps(self._charge_success()).encode('utf-8')
        response = self.client.post(
            '/api/payments/webhook/',
            data=raw,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE='deadbeef',
        )
        self.assertEqual(response.status_code, 400)
        self.payment.refresh_from_db()
        self.assertFalse(self.payment.verified, 'payment verified with a bad signature')

    def test_valid_charge_success_verifies_and_activates_premium(self):
        response = self._post(self._charge_success())
        self.assertEqual(response.status_code, 200, response.content)

        self.payment.refresh_from_db()
        self.assertTrue(self.payment.verified)
        self.assertEqual(self.payment.status, 'success')

        # The post_save signal should have activated premium + subscription,
        # with no browser redirect involved.
        self.user.profile.refresh_from_db()
        self.assertTrue(
            self.user.profile.is_premium,
            'charge.success webhook did not activate premium'
        )
        self.assertTrue(
            UserPlanSubscription.objects.filter(
                user=self.user, payment=self.payment, is_active=True
            ).exists(),
            'charge.success webhook did not create an active subscription'
        )

    def test_webhook_is_idempotent_on_redelivery(self):
        """Paystack retries webhooks; a second delivery must not error."""
        first = self._post(self._charge_success())
        self.assertEqual(first.status_code, 200, first.content)
        second = self._post(self._charge_success())
        self.assertEqual(second.status_code, 200, second.content)

    def test_unknown_reference_reported_not_found(self):
        payload = {'event': 'charge.success', 'data': {'reference': 'DOES-NOT-EXIST'}}
        response = self._post(payload)
        self.assertEqual(response.status_code, 404)


class PlanScopeHelperTests(TestCase):
    """
    Direct tests of the scoping helpers, including the backward-compatibility
    rule that an empty scope M2M means 'unrestricted'.
    """

    def setUp(self):
        self.maths_cat = make_exam_category(name='WASSCE', display_name='WAEC/NECO')
        self.apt_cat = make_exam_category(name='APTITUDE', display_name='Aptitude Tests')
        self.maths = make_subject(name='Mathematics', code='MTH', categories=[self.maths_cat])
        self.verbal = make_subject(name='Verbal Reasoning', code='VRB', categories=[self.apt_cat])

    def test_empty_scope_plan_is_unrestricted(self):
        """A plan with no subjects/categories set grants everything (legacy)."""
        from payments.utils import has_covering_subscription
        user = make_user(username='legacy')
        make_active_subscription(user, plan=make_plan(name='All Access'))
        self.assertTrue(has_covering_subscription(user, subject=self.maths))
        self.assertTrue(has_covering_subscription(user, subject=self.verbal))

    def test_scoped_plan_covers_only_its_scope(self):
        from payments.utils import has_covering_subscription
        user = make_user(username='scoped')
        plan = make_plan(name='Maths Only', subjects=[self.maths],
                         exam_categories=[self.maths_cat])
        make_active_subscription(user, plan=plan)
        self.assertTrue(has_covering_subscription(user, subject=self.maths))
        self.assertFalse(has_covering_subscription(user, subject=self.verbal))

    def test_no_subscription_covers_nothing(self):
        from payments.utils import has_covering_subscription
        user = make_user(username='freeloader')
        self.assertFalse(has_covering_subscription(user, subject=self.maths))

    def test_expired_subscription_does_not_cover(self):
        from payments.utils import has_covering_subscription
        user = make_user(username='expired')
        make_expired_subscription(user, plan=make_plan(name='Lapsed'))
        self.assertFalse(has_covering_subscription(user, subject=self.maths))

    def test_interview_scope_is_independent_of_exam_scope(self):
        """A plan scoped to exam subjects shouldn't leak into interview access
        UNLESS its interview scope is empty (unrestricted)."""
        from payments.utils import has_covering_subscription
        from pasApp.models import Category as PasCategory, Product
        pas_cat = PasCategory.objects.create(name='Banking')
        product = Product.objects.create(
            name='Bank Interview', description='x', category=pas_cat
        )
        user = make_user(username='mixedscope')
        # Plan lists a subject (so exam scope is restricted) but no interview
        # products (so interview scope is unrestricted / empty).
        plan = make_plan(name='Maths + all interviews', subjects=[self.maths])
        make_active_subscription(user, plan=plan)
        # exam: restricted to maths
        self.assertTrue(has_covering_subscription(user, subject=self.maths))
        self.assertFalse(has_covering_subscription(user, subject=self.verbal))
        # interview: empty scope -> unrestricted
        self.assertTrue(has_covering_subscription(user, interview_product=product))
