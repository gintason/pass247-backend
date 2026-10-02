"""
Email over HTTPS (port 443) instead of SMTP.

Some hosts block outbound SMTP (Render free instances block ports 25, 465 and
587), so signup codes sent with the SMTP backend never leave the server. This
backend sends through Brevo's transactional email API instead.

Enable with environment variables:
    EMAIL_BACKEND=utils.email_backends.BrevoEmailBackend
    BREVO_API_KEY=xkeysib-...
DEFAULT_FROM_EMAIL (e.g. "PASS 24/7 <noreply@pass247.net>") must be a sender
verified in Brevo.
"""
import logging
from email.utils import parseaddr

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email'


def _contact(address):
    name, email = parseaddr(address)
    return {'email': email, 'name': name} if name else {'email': email}


class BrevoEmailBackend(BaseEmailBackend):
    def __init__(self, fail_silently=False, api_key=None, timeout=None, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.api_key = api_key or getattr(settings, 'BREVO_API_KEY', '')
        self.timeout = timeout or getattr(settings, 'EMAIL_TIMEOUT', 20)

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        if not self.api_key:
            if self.fail_silently:
                return 0
            raise RuntimeError('BREVO_API_KEY is not set')

        sent = 0
        for message in email_messages:
            recipients = message.recipients()
            if not recipients:
                continue
            payload = {
                'sender': _contact(message.from_email or settings.DEFAULT_FROM_EMAIL),
                'to': [_contact(r) for r in message.to] or [_contact(r) for r in recipients],
                'subject': message.subject,
                'textContent': message.body or ' ',
            }
            if message.cc:
                payload['cc'] = [_contact(r) for r in message.cc]
            if message.bcc:
                payload['bcc'] = [_contact(r) for r in message.bcc]
            if message.reply_to:
                payload['replyTo'] = _contact(message.reply_to[0])
            for content, mimetype in getattr(message, 'alternatives', []) or []:
                if mimetype == 'text/html':
                    payload['htmlContent'] = content
            try:
                response = requests.post(
                    BREVO_SEND_URL, json=payload, timeout=self.timeout,
                    headers={'api-key': self.api_key, 'accept': 'application/json'},
                )
                if response.status_code >= 300:
                    raise RuntimeError(f'Brevo API {response.status_code}: {response.text[:300]}')
                sent += 1
            except Exception as exc:
                logger.error('Brevo email to %s failed: %s', recipients, exc)
                if not self.fail_silently:
                    raise
        return sent
