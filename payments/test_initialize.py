"""/api/payments/initialize/ - payload handling, kobo conversion, Paystack redirect."""
from unittest import mock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from payments.models import Payment
from utils.factories import make_active_subscription, make_plan, make_user


def paystack_ok(*args, **kwargs):
    resp = mock.Mock(status_code=200)
    resp.json.return_value = {'status': True, 'message': 'Authorization URL created', 'data': {
        'authorization_url': 'https://checkout.paystack.com/abc123', 'access_code': 'abc123',
        'reference': kwargs['json']['reference']}}
    return resp


@override_settings(PAYSTACK_LIVE_SECRET_KEY='sk_test_dummy', FRONTEND_URL='https://pass247.net',
                   PAYSTACK_INITIALIZE_PAYMENT_URL='https://api.paystack.co/transaction/initialize')
class InitializePaymentTests(TestCase):
    url = '/api/payments/initialize/'

    def setUp(self):
        self.user = make_user(email='payer@example.com')
        self.plan = make_plan(name='Quarterly', price=8500, duration_days=90)
        self.client = APIClient(enforce_csrf_checks=False)
        self.client.force_login(self.user)

    @mock.patch('payments.views_api.requests.post', side_effect=paystack_ok)
    def test_json_payload_returns_authorization_url(self, post):
        res = self.client.post(self.url, {'plan_id': self.plan.id}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        body = res.json()
        self.assertEqual(body['authorization_url'], 'https://checkout.paystack.com/abc123')
        sent = post.call_args.kwargs['json']
        self.assertEqual(sent['amount'], 850000)          # integer kobo
        self.assertIsInstance(sent['amount'], int)
        self.assertEqual(sent['email'], 'payer@example.com')
        self.assertEqual(sent['callback_url'], 'https://pass247.net/payment/success')
        self.assertEqual(Payment.objects.get(reference=body['reference']).status, 'pending')

    @mock.patch('payments.views_api.requests.post', side_effect=paystack_ok)
    def test_form_data_payload_is_accepted(self, post):
        """The React page used to send FormData, which the view rejected with 400."""
        res = self.client.post(self.url, {'plan_id': str(self.plan.id)})  # multipart
        self.assertEqual(res.status_code, 200, res.content)

    @mock.patch('payments.views_api.requests.post', side_effect=paystack_ok)
    def test_discount_is_charged(self, post):
        self.plan.discount_percentage = 10
        self.plan.save()
        self.client.post(self.url, {'plan_id': self.plan.id}, format='json')
        self.assertEqual(post.call_args.kwargs['json']['amount'], 765000)

    def test_validation_errors_are_coded(self):
        cases = [
            ({}, 400, 'plan_required'),
            ({'plan_id': 'abc'}, 400, 'invalid_plan'),
            ({'plan_id': 99999}, 404, 'plan_not_found'),
        ]
        for payload, code, err in cases:
            res = self.client.post(self.url, payload, format='json')
            self.assertEqual((res.status_code, res.json()['code']), (code, err), payload)

    def test_missing_email(self):
        self.user.email = ''
        self.user.save()
        res = self.client.post(self.url, {'plan_id': self.plan.id}, format='json')
        self.assertEqual(res.json()['code'], 'email_required')

    def test_already_subscribed_is_409(self):
        make_active_subscription(self.user, plan=self.plan)
        res = self.client.post(self.url, {'plan_id': self.plan.id}, format='json')
        self.assertEqual(res.status_code, 409)

    @override_settings(PAYSTACK_LIVE_SECRET_KEY='')
    def test_missing_secret_key_is_503(self):
        res = self.client.post(self.url, {'plan_id': self.plan.id}, format='json')
        self.assertEqual((res.status_code, res.json()['code']), (503, 'payment_not_configured'))

    @mock.patch('payments.views_api.requests.post')
    def test_paystack_rejection_is_reported(self, post):
        post.return_value = mock.Mock(status_code=401, json=mock.Mock(
            return_value={'status': False, 'message': 'Invalid key'}))
        res = self.client.post(self.url, {'plan_id': self.plan.id}, format='json')
        self.assertEqual((res.status_code, res.json()['error']), (502, 'Invalid key'))
        self.assertEqual(Payment.objects.get().status, 'failed')

    @mock.patch('payments.views_api.requests.post', side_effect=paystack_ok)
    def test_foreign_callback_url_is_ignored(self, post):
        self.client.post(self.url, {'plan_id': self.plan.id, 'callback_url': 'https://evil.example/x'},
                         format='json')
        self.assertEqual(post.call_args.kwargs['json']['callback_url'], 'https://pass247.net/payment/success')

    def test_anonymous_gets_json_401(self):
        res = APIClient().post(self.url, {'plan_id': self.plan.id}, format='json')
        self.assertEqual((res.status_code, res.json()['code']), (401, 'login_required'))

    def test_plans_are_public(self):
        res = APIClient().get('/api/payments/plans/')
        self.assertEqual(res.status_code, 200)
        self.assertIn(self.plan.id, [p['id'] for p in res.json()['plans']])


@override_settings(PAYSTACK_LIVE_SECRET_KEY='sk_test_dummy')
class VerifyAmountTests(TestCase):
    def test_underpayment_does_not_activate(self):
        user = make_user(email='p@example.com')
        plan = make_plan(price=8500)
        Payment.objects.create(user=user, amount=8500, reference='REF-1', email=user.email, plan=plan)
        client = APIClient()
        client.force_login(user)
        with mock.patch('payments.views_api.requests.get') as get:
            get.return_value = mock.Mock(json=mock.Mock(return_value={
                'status': True, 'data': {'status': 'success', 'amount': 100,
                                         'customer': {'email': user.email}}}))
            res = client.get('/api/payments/verify/', {'reference': 'REF-1'})
        self.assertEqual(res.json()['code'], 'amount_mismatch')
        self.assertEqual(Payment.objects.get(reference='REF-1').status, 'failed')
        user.profile.refresh_from_db()
        self.assertFalse(user.profile.is_premium)
