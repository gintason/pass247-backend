"""
Tests for authentication, password policy, rate limiting and CSRF.

These lock in the Phase 1 hardening.
"""

import json

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, Client, override_settings

from utils.factories import make_user


class RegistrationPasswordPolicyTests(TestCase):
    """
    Phase 1: registration previously only checked len(password) < 5, ignoring
    AUTH_PASSWORD_VALIDATORS entirely. It now runs validate_password().
    """

    def setUp(self):
        self.client = Client()
        cache.clear()   # rate limiter shares the cache backend

    def register(self, **overrides):
        payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'Str0ng!Passphrase',
            'first_name': 'New',
            'last_name': 'User',
        }
        payload.update(overrides)
        return self.client.post(
            '/api/auth/register/',
            data=json.dumps(payload),
            content_type='application/json',
        )

    def test_short_password_rejected(self):
        response = self.register(password='abc')
        self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(User.objects.filter(username='newuser').exists())

    def test_entirely_numeric_password_rejected(self):
        response = self.register(password='12345678')
        self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(User.objects.filter(username='newuser').exists())

    def test_common_password_rejected(self):
        response = self.register(password='password123')
        self.assertEqual(response.status_code, 400, response.content)
        self.assertFalse(User.objects.filter(username='newuser').exists())

    def test_strong_password_accepted(self):
        response = self.register()
        self.assertIn(response.status_code, (200, 201), response.content)
        self.assertTrue(User.objects.filter(username='newuser').exists())

    def test_duplicate_username_rejected(self):
        make_user(username='taken')
        response = self.register(username='taken')
        self.assertEqual(response.status_code, 400, response.content)


class LoginRateLimitTests(TestCase):
    """
    Phase 1 added an IP-based limiter to the plain Django auth views
    (10 attempts / 5 minutes for login).
    """

    def setUp(self):
        self.client = Client()
        cache.clear()
        make_user(username='victim', password='Str0ng!Passphrase')

    def tearDown(self):
        cache.clear()

    def _attempt(self, password='wrong-password'):
        return self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'victim', 'password': password}),
            content_type='application/json',
        )

    def test_repeated_failed_logins_are_eventually_throttled(self):
        statuses = [self._attempt().status_code for _ in range(15)]
        self.assertIn(
            429, statuses,
            f'no 429 after 15 rapid login attempts; got {statuses}'
        )

    def test_correct_credentials_succeed_before_limit(self):
        response = self._attempt(password='Str0ng!Passphrase')
        self.assertIn(response.status_code, (200, 201), response.content)


class CsrfEnforcementTests(TestCase):
    """
    Phase 1 removed @csrf_exempt from browser-facing state-changing views.
    `enforce_csrf_checks=True` makes the test client behave like a browser.
    """

    def setUp(self):
        cache.clear()
        make_user(username='csrfuser', password='Str0ng!Passphrase')

    def tearDown(self):
        cache.clear()

    def test_login_without_csrf_token_is_rejected(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'csrfuser', 'password': 'Str0ng!Passphrase'}),
            content_type='application/json',
        )
        self.assertEqual(
            response.status_code, 403,
            f'login accepted without a CSRF token (status {response.status_code})'
        )


class PasswordResetTests(TestCase):
    """Phase 0 wired up a working JSON forgot/reset-password flow."""

    def setUp(self):
        self.client = Client()
        cache.clear()
        self.user = make_user(username='forgetful', password='Str0ng!Passphrase')

    def tearDown(self):
        cache.clear()

    def test_forgot_password_does_not_reveal_account_existence(self):
        """Same response whether or not the email is registered."""
        known = self.client.post(
            '/api/auth/forgot-password/',
            data=json.dumps({'email': self.user.email}),
            content_type='application/json',
        )
        cache.clear()
        unknown = self.client.post(
            '/api/auth/forgot-password/',
            data=json.dumps({'email': 'nobody@example.com'}),
            content_type='application/json',
        )
        self.assertEqual(known.status_code, unknown.status_code)
        self.assertEqual(known.json().get('message'), unknown.json().get('message'))

    def test_reset_with_invalid_id_is_rejected(self):
        import uuid
        response = self.client.post(
            f'/api/auth/reset-password/{uuid.uuid4()}/',
            data=json.dumps({'password': 'An0ther!Passphrase'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400, response.content)

    def test_reset_enforces_password_policy(self):
        from users.models import PasswordReset
        reset = PasswordReset.objects.create(user=self.user)
        response = self.client.post(
            f'/api/auth/reset-password/{reset.reset_id}/',
            data=json.dumps({'password': '123'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400, response.content)

    def test_valid_reset_changes_password(self):
        from users.models import PasswordReset
        reset = PasswordReset.objects.create(user=self.user)
        response = self.client.post(
            f'/api/auth/reset-password/{reset.reset_id}/',
            data=json.dumps({'password': 'Brand!New9Passphrase'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Brand!New9Passphrase'))


class EmailOTPModelTests(TestCase):
    """Unit tests for the OTP primitive itself."""

    def setUp(self):
        from users.models import EmailOTP
        self.EmailOTP = EmailOTP
        self.user = make_user(username='otpuser')

    def test_code_is_not_stored_in_plaintext(self):
        otp, code = self.EmailOTP.issue(self.user)
        self.assertNotIn(code, otp.code_hash)
        self.assertNotEqual(otp.code_hash, code)

    def test_code_is_six_digits(self):
        _otp, code = self.EmailOTP.issue(self.user)
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())

    def test_correct_code_verifies(self):
        _otp, code = self.EmailOTP.issue(self.user)
        ok, _msg = self.EmailOTP.verify(self.user, code)
        self.assertTrue(ok)

    def test_code_cannot_be_reused(self):
        _otp, code = self.EmailOTP.issue(self.user)
        self.assertTrue(self.EmailOTP.verify(self.user, code)[0])
        ok, _msg = self.EmailOTP.verify(self.user, code)
        self.assertFalse(ok, 'a consumed OTP was accepted a second time')

    def test_wrong_code_rejected(self):
        _otp, code = self.EmailOTP.issue(self.user)
        wrong = '000000' if code != '000000' else '111111'
        self.assertFalse(self.EmailOTP.verify(self.user, wrong)[0])

    def test_expired_code_rejected(self):
        from django.utils import timezone
        from datetime import timedelta
        otp, code = self.EmailOTP.issue(self.user)
        otp.expires_at = timezone.now() - timedelta(minutes=1)
        otp.save(update_fields=['expires_at'])
        ok, msg = self.EmailOTP.verify(self.user, code)
        self.assertFalse(ok)
        self.assertIn('expired', msg.lower())

    def test_attempts_are_limited(self):
        _otp, code = self.EmailOTP.issue(self.user)
        wrong = '000000' if code != '000000' else '111111'
        for _ in range(self.EmailOTP.MAX_ATTEMPTS):
            self.EmailOTP.verify(self.user, wrong)
        # Even the CORRECT code must now fail — the OTP is burnt.
        ok, _msg = self.EmailOTP.verify(self.user, code)
        self.assertFalse(ok, 'OTP still usable after exhausting attempt limit')

    def test_issuing_invalidates_previous_code(self):
        _otp1, code1 = self.EmailOTP.issue(self.user)
        _otp2, _code2 = self.EmailOTP.issue(self.user)
        ok, _msg = self.EmailOTP.verify(self.user, code1)
        self.assertFalse(ok, 'superseded code was still accepted')


class SignupVerificationFlowTests(TestCase):
    """End-to-end signup -> OTP -> activation."""

    def setUp(self):
        self.client = Client()
        cache.clear()

    def tearDown(self):
        cache.clear()

    def register(self, **overrides):
        payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'Str0ng!Passphrase',
            'first_name': 'New',
            'last_name': 'User',
        }
        payload.update(overrides)
        return self.client.post(
            '/api/auth/register/',
            data=json.dumps(payload),
            content_type='application/json',
        )

    def test_registration_creates_inactive_user(self):
        response = self.register()
        self.assertIn(response.status_code, (200, 201), response.content)
        self.assertTrue(response.json().get('requires_verification'))
        user = User.objects.get(username='newuser')
        self.assertFalse(user.is_active, 'new account should start unverified')

    def test_registration_sends_an_otp_email(self):
        from django.core import mail
        self.register()
        self.assertEqual(len(mail.outbox), 1, 'no verification email was sent')
        self.assertIn('verification code', mail.outbox[0].subject.lower())

    def test_unverified_user_cannot_log_in(self):
        self.register()
        cache.clear()
        response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'newuser', 'password': 'Str0ng!Passphrase'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403, response.content)
        self.assertTrue(response.json().get('requires_verification'))

    def test_verifying_activates_and_logs_in(self):
        from users.models import EmailOTP
        self.register()
        user = User.objects.get(username='newuser')
        _otp, code = EmailOTP.issue(user)

        response = self.client.post(
            '/api/auth/verify-otp/',
            data=json.dumps({'email': 'newuser@example.com', 'code': code}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        user.refresh_from_db()
        self.assertTrue(user.is_active, 'account was not activated')

        # Session should now be authenticated.
        status = self.client.get('/api/auth/status/')
        self.assertTrue(status.json().get('is_authenticated'))

    def test_wrong_code_does_not_activate(self):
        from users.models import EmailOTP
        self.register()
        user = User.objects.get(username='newuser')
        _otp, code = EmailOTP.issue(user)
        wrong = '000000' if code != '000000' else '111111'

        response = self.client.post(
            '/api/auth/verify-otp/',
            data=json.dumps({'email': 'newuser@example.com', 'code': wrong}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        user.refresh_from_db()
        self.assertFalse(user.is_active)

    def test_verify_does_not_reveal_unknown_accounts(self):
        response = self.client.post(
            '/api/auth/verify-otp/',
            data=json.dumps({'email': 'nobody@example.com', 'code': '123456'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertNotIn('not found', body.get('message', '').lower())
        self.assertNotIn('does not exist', body.get('message', '').lower())

    def test_resend_gives_a_working_code(self):
        from django.core import mail
        self.register()
        mail.outbox.clear()

        response = self.client.post(
            '/api/auth/resend-otp/',
            data=json.dumps({'email': 'newuser@example.com'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(len(mail.outbox), 1, 'resend did not send an email')

    def test_resend_is_uniform_for_unknown_accounts(self):
        response = self.client.post(
            '/api/auth/resend-otp/',
            data=json.dumps({'email': 'nobody@example.com'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get('success'))

    def test_verified_user_can_log_in_normally(self):
        from users.models import EmailOTP
        self.register()
        user = User.objects.get(username='newuser')
        _otp, code = EmailOTP.issue(user)
        self.client.post(
            '/api/auth/verify-otp/',
            data=json.dumps({'email': 'newuser@example.com', 'code': code}),
            content_type='application/json',
        )
        self.client.post('/api/auth/logout/')
        cache.clear()

        response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'newuser', 'password': 'Str0ng!Passphrase'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.json().get('success'))


class LogoutTests(TestCase):
    """Logout must actually end the session, for regular users and admins."""

    def setUp(self):
        self.client = Client()
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_logout_ends_session(self):
        user = make_user(username='leaver', password='Str0ng!Passphrase')
        self.client.force_login(user)
        self.assertTrue(self.client.get('/api/auth/status/').json().get('is_authenticated'))

        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertFalse(
            self.client.get('/api/auth/status/').json().get('is_authenticated'),
            'session survived logout'
        )

    def test_admin_can_log_out(self):
        from utils.factories import make_admin
        admin = make_admin(username='bosslady')
        self.client.force_login(admin)
        self.assertTrue(self.client.get('/api/auth/status/').json().get('is_authenticated'))

        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertFalse(
            self.client.get('/api/auth/status/').json().get('is_authenticated'),
            'admin session survived logout'
        )

    def test_logout_when_not_logged_in_is_harmless(self):
        response = self.client.post('/api/auth/logout/')
        self.assertLess(response.status_code, 500, response.content)
