"""Signup OTP email: failures are reported instead of silently swallowed."""
import json
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings

from utils.email_backends import BrevoEmailBackend

REGISTER = {'username': 'newbie', 'email': 'newbie@example.com', 'password': 'Sup3r-Secret-Pass!',
            'first_name': 'New', 'last_name': 'Bie'}


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class SignupEmailTests(TestCase):
    def post(self, url, data):
        return self.client.post(url, json.dumps(data), content_type='application/json')

    def test_code_is_emailed(self):
        res = self.post('/api/auth/register/', REGISTER)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['email_sent'])
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('verification code', mail.outbox[0].body)

    def test_failure_is_reported(self):
        with mock.patch('django.core.mail.EmailMessage.send', side_effect=OSError('Network unreachable')):
            res = self.post('/api/auth/register/', REGISTER)
            self.assertFalse(res.json()['email_sent'])
            self.assertIn("couldn't send", res.json()['message'])
            res = self.post('/api/auth/resend-otp/', {'email': REGISTER['email']})
            self.assertEqual(res.status_code, 503)
        res = self.post('/api/auth/resend-otp/', {'email': REGISTER['email']})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)


class ProductionNeverUsesConsoleTests(TestCase):
    def test_settings_rule(self):
        from django.conf import settings
        if not settings.DEBUG:
            self.assertNotIn('console', settings.EMAIL_BACKEND)


@override_settings(BREVO_API_KEY='xkeysib-test', DEFAULT_FROM_EMAIL='PASS 24/7 <noreply@pass247.net>')
class BrevoBackendTests(TestCase):
    def test_sends_via_https_api(self):
        from django.core.mail import EmailMessage
        with mock.patch('utils.email_backends.requests.post') as post:
            post.return_value = mock.Mock(status_code=201, text='{}')
            n = BrevoEmailBackend().send_messages([EmailMessage('Code', '123456', None, ['a@b.com'])])
        self.assertEqual(n, 1)
        payload = post.call_args.kwargs['json']
        self.assertEqual(payload['sender'], {'email': 'noreply@pass247.net', 'name': 'PASS 24/7'})
        self.assertEqual(payload['to'], [{'email': 'a@b.com'}])
        self.assertEqual(post.call_args.kwargs['headers']['api-key'], 'xkeysib-test')

    def test_api_error_raises(self):
        from django.core.mail import EmailMessage
        with mock.patch('utils.email_backends.requests.post') as post:
            post.return_value = mock.Mock(status_code=401, text='unauthorized')
            with self.assertRaises(RuntimeError):
                BrevoEmailBackend().send_messages([EmailMessage('Code', '1', None, ['a@b.com'])])
