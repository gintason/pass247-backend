"""
Regression tests for the quiz app.

The quiz app carried the *same* answer-leak bug as exams, independently
(finding C-3), and its viewsets were part of the anonymous-500 set (C-1).
"""

from django.test import TestCase
from rest_framework.test import APIClient

from quiz.models import Category, Question
from utils.factories import make_user, make_admin


def iter_payload_dicts(payload):
    if isinstance(payload, dict):
        yield payload
        for value in payload.values():
            yield from iter_payload_dicts(value)
    elif isinstance(payload, list):
        for item in payload:
            yield from iter_payload_dicts(item)


class QuizAnswerLeakageTests(TestCase):
    """`correct_answers` must not be readable from quiz-taking endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(category_name='General Knowledge')
        self.question = Question.objects.create(
            category=self.category,
            question='Capital of Nigeria?',
            correct_answers='Abuja',
        )

    def assertNoAnswers(self, response, label):
        """
        Assert the real answer never reaches the client.

        Note this checks the answer *value*, not merely the presence of the
        key. Some views deliberately inject the key with a masked placeholder
        ("*** Premium content - Upgrade to see answers ***") to drive the
        upgrade prompt; that is not a leak. What must never appear is the
        actual answer text.
        """
        self.assertEqual(response.status_code, 200, f'{label} -> {response.status_code}')
        real_answer = self.question.correct_answers
        for chunk in iter_payload_dicts(response.json()):
            if 'correct_answers' in chunk:
                self.assertNotIn(
                    real_answer, str(chunk['correct_answers']),
                    f'{label} leaked the real answer key: {chunk}'
                )

    def test_question_list_hides_answers_from_anonymous(self):
        self.assertNoAnswers(self.client.get('/api/quiz/questions/'), 'anon list')

    def test_question_list_hides_answers_from_user(self):
        self.client.force_authenticate(user=make_user())
        self.assertNoAnswers(self.client.get('/api/quiz/questions/'), 'user list')

    def test_question_detail_hides_answers(self):
        self.client.force_authenticate(user=make_user())
        self.assertNoAnswers(
            self.client.get(f'/api/quiz/questions/{self.question.pk}/'), 'detail'
        )

    def test_category_questions_hides_answers(self):
        self.client.force_authenticate(user=make_user())
        self.assertNoAnswers(
            self.client.get(f'/api/quiz/categories/{self.category.uid}/questions/'),
            'category questions',
        )

    def test_admin_also_does_not_get_answers_on_quiz_taking_endpoint(self):
        """
        Admins bypass paywalls, not the answer key. Serving admins a different
        payload here would both defeat 'test the app as a user' and break
        frontend list handling for admin sessions.
        """
        self.client.force_authenticate(user=make_admin())
        self.assertNoAnswers(self.client.get('/api/quiz/questions/'), 'admin list')

    def test_admin_management_endpoint_does_expose_answers(self):
        """The dedicated admin endpoint is allowed to show answers."""
        self.client.force_authenticate(user=make_admin())
        response = self.client.get('/api/quiz/admin/questions/')
        self.assertEqual(response.status_code, 200)
        found = any(
            'correct_answers' in chunk
            for chunk in iter_payload_dicts(response.json())
        )
        self.assertTrue(found, 'admin management endpoint should expose answers')

    def test_admin_management_endpoint_denied_to_regular_user(self):
        self.client.force_authenticate(user=make_user())
        response = self.client.get('/api/quiz/admin/questions/')
        self.assertIn(response.status_code, (401, 403))


class QuizAnonymousAccessTests(TestCase):
    """Finding C-1 - these endpoints previously returned 500 for anonymous."""

    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(category_name='General Knowledge')
        Question.objects.create(
            category=self.category, question='Q?', correct_answers='A'
        )

    def test_quiz_endpoints_do_not_500_for_anonymous(self):
        for url in (
            '/api/quiz/categories/',
            '/api/quiz/questions/',
            f'/api/quiz/categories/{self.category.uid}/questions/',
        ):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertLess(
                    response.status_code, 500,
                    f'{url} returned {response.status_code} for anonymous user'
                )


class QuizGradingTests(TestCase):
    """
    Hiding the answer key must not break grading, which happens server-side
    via Question.check_answer().
    """

    def setUp(self):
        self.category = Category.objects.create(category_name='General Knowledge')
        self.question = Question.objects.create(
            category=self.category,
            question='Capital of Nigeria?',
            correct_answers='Abuja',
        )

    def test_correct_answer_is_graded_correct(self):
        self.assertTrue(self.question.check_answer('Abuja'))

    def test_wrong_answer_is_graded_wrong(self):
        self.assertFalse(self.question.check_answer('Lagos'))

    def test_submit_timed_quiz_scores_server_side(self):
        client = APIClient()
        client.force_authenticate(user=make_user())
        response = client.post(
            '/api/quiz/submit-timed/',
            {
                'answers': [
                    {'question_id': self.question.pk, 'user_answer': 'Abuja'}
                ],
                'time_taken': '0:30',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertEqual(body.get('correct'), 1, f'unexpected grading: {body}')

    def test_client_cannot_dictate_its_own_score(self):
        """A forged score in the request body must be ignored."""
        client = APIClient()
        client.force_authenticate(user=make_user())
        response = client.post(
            '/api/quiz/submit-timed/',
            {
                'answers': [
                    {'question_id': self.question.pk, 'user_answer': 'Lagos'}
                ],
                'score': 9999,
                'correct': 9999,
                'time_taken': '0:30',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertEqual(body.get('correct'), 0, f'server trusted client score: {body}')
        self.assertNotEqual(body.get('score'), 9999, f'server trusted client score: {body}')
