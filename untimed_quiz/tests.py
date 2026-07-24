"""
Tests for the untimed quiz app.

untimed_quiz already separates its serializers correctly (a list serializer
without the answer, and a full serializer for admin/review). These tests lock
that in so it does not regress the way exams and quiz both did.
"""

from django.test import TestCase
from rest_framework.test import APIClient

from untimed_quiz.models import UntimedCategory, UntimedQuestion
from utils.factories import make_user, make_admin


def iter_payload_dicts(payload):
    if isinstance(payload, dict):
        yield payload
        for value in payload.values():
            yield from iter_payload_dicts(value)
    elif isinstance(payload, list):
        for item in payload:
            yield from iter_payload_dicts(item)


class UntimedQuizAnswerLeakageTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.category = UntimedCategory.objects.create(name='Logic')
        self.question = UntimedQuestion.objects.create(
            category=self.category,
            text='What comes next: 2, 4, 6, ?',
            correct_answer='EIGHT-UNIQUE-ANSWER',
        )

    def assertNoAnswers(self, response, label):
        """
        Assert the real answer never reaches the client. Checks the answer
        *value*, since some views inject the key with a masked placeholder to
        drive the upgrade prompt - that is not a leak.
        """
        self.assertEqual(response.status_code, 200, f'{label} -> {response.status_code}')
        real_answer = self.question.correct_answer
        for chunk in iter_payload_dicts(response.json()):
            if 'correct_answer' in chunk:
                self.assertNotIn(
                    real_answer, str(chunk['correct_answer']),
                    f'{label} leaked the real answer: {chunk}'
                )

    def test_question_list_hides_answers(self):
        self.client.force_authenticate(user=make_user())
        self.assertNoAnswers(
            self.client.get('/api/untimed-quiz/questions/'), 'question list'
        )

    def test_category_questions_hides_answers(self):
        self.client.force_authenticate(user=make_user())
        self.assertNoAnswers(
            self.client.get(f'/api/untimed-quiz/categories/{self.category.pk}/questions/'),
            'category questions',
        )


class UntimedQuizAnonymousAccessTests(TestCase):
    """Finding C-1."""

    def setUp(self):
        self.client = APIClient()
        self.category = UntimedCategory.objects.create(name='Logic')
        UntimedQuestion.objects.create(
            category=self.category, text='Q?', correct_answer='A'
        )

    def test_endpoints_do_not_500_for_anonymous(self):
        for url in (
            '/api/untimed-quiz/categories/',
            '/api/untimed-quiz/questions/',
            f'/api/untimed-quiz/categories/{self.category.pk}/questions/',
        ):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertLess(
                    response.status_code, 500,
                    f'{url} returned {response.status_code} for anonymous user'
                )


class UntimedQuizGradingTests(TestCase):
    """Grading is similarity-based on the model; it must stay server-side."""

    def setUp(self):
        self.category = UntimedCategory.objects.create(name='Logic')
        self.question = UntimedQuestion.objects.create(
            category=self.category,
            text='Capital of Nigeria?',
            correct_answer='Abuja',
        )

    def test_response_grades_itself_on_save(self):
        from untimed_quiz.models import UntimedUserResponse
        user = make_user()
        correct = UntimedUserResponse.objects.create(
            user=user, question=self.question, user_answer='Abuja'
        )
        wrong = UntimedUserResponse.objects.create(
            user=user, question=self.question, user_answer='Something else entirely'
        )
        self.assertTrue(correct.is_correct)
        self.assertFalse(wrong.is_correct)
