"""
Tests for the interview (pasApp) app.

These endpoints back public, un-authenticated marketing pages
(/interview-levels, /interview/<slug>), so anonymous access must be safe.
"""

from django.test import TestCase
from rest_framework.test import APIClient

from pasApp.models import Category, Product, Interview
from utils.factories import make_user, make_admin


class InterviewAnonymousAccessTests(TestCase):
    """
    Finding C-1: these returned HTTP 500 for anonymous visitors because
    request.user was None. /interview/<slug> is a public route, so this was
    user-facing on every logged-out visit.
    """

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name='Banking')
        self.product = Product.objects.create(
            name='Bank Interview',
            description='Prep for bank interviews',
            category=self.category,
        )
        self.interview = Interview.objects.create(
            product=self.product,
            question='Tell me about yourself',
            answer='A structured answer.',
            category=self.category,
        )

    def test_public_interview_endpoints_do_not_500_for_anonymous(self):
        for url in (
            '/api/interview/products/',
            '/api/interview/categories/',
            f'/api/interview/products/{self.product.slug}/',
            f'/api/interview/products/{self.product.slug}/interviews/',
            '/api/interview/interviews/featured/',
        ):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertLess(
                    response.status_code, 500,
                    f'{url} returned {response.status_code} for anonymous user'
                )

    def test_interview_detail_does_not_500_for_anonymous(self):
        response = self.client.get(f'/api/interview/interviews/{self.interview.pk}/')
        self.assertLess(response.status_code, 500, response.content)

    def test_authenticated_user_can_list_products(self):
        self.client.force_authenticate(user=make_user())
        response = self.client.get('/api/interview/products/')
        self.assertEqual(response.status_code, 200)

    def test_admin_can_list_products(self):
        self.client.force_authenticate(user=make_admin())
        response = self.client.get('/api/interview/products/')
        self.assertEqual(response.status_code, 200)
