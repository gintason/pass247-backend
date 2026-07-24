"""
Regression tests for the exams app.

Covers the Phase 0 answer-leak fix and the Phase 2A anonymous-access fix.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from utils.factories import (
    make_user, make_admin, make_exam_category, make_subject,
    make_question, make_question_bank, make_active_subscription,
)

ANSWER_FIELDS = ('correct_answer', 'model_answer', 'marking_guide')


def iter_payload_dicts(payload):
    """Yield every dict nested anywhere in a JSON response body."""
    if isinstance(payload, dict):
        yield payload
        for value in payload.values():
            yield from iter_payload_dicts(value)
    elif isinstance(payload, list):
        for item in payload:
            yield from iter_payload_dicts(item)


class AnswerLeakageTests(TestCase):
    """
    The answer key must never appear in a question payload served to a user
    who has not answered yet. This is the Phase 0 fix; it regressed once
    already (independently, in the quiz app), so it is asserted broadly.
    """

    def setUp(self):
        self.client = APIClient()
        self.category = make_exam_category()
        self.subject = make_subject(categories=[self.category])
        self.question = make_question(self.subject, self.category, correct_answer='A')

    def assertNoAnswerFields(self, response, label):
        self.assertEqual(response.status_code, 200, f'{label} returned {response.status_code}')
        for chunk in iter_payload_dicts(response.json()):
            for field in ANSWER_FIELDS:
                self.assertNotIn(
                    field, chunk,
                    f'{label} leaked "{field}" in payload: {chunk}'
                )

    def test_question_list_hides_answers_from_anonymous(self):
        self.assertNoAnswerFields(
            self.client.get('/api/exams/questions/'), 'anonymous question list'
        )

    def test_question_list_hides_answers_from_authenticated_user(self):
        self.client.force_authenticate(user=make_user())
        self.assertNoAnswerFields(
            self.client.get('/api/exams/questions/'), 'authenticated question list'
        )

    def test_question_detail_hides_answers(self):
        self.client.force_authenticate(user=make_user())
        self.assertNoAnswerFields(
            self.client.get(f'/api/exams/questions/{self.question.pk}/'),
            'question detail',
        )

    def test_paying_subscriber_still_does_not_see_answers_up_front(self):
        """Paying for access buys more questions, not the answer key."""
        user = make_user(username='payer')
        make_active_subscription(user)
        self.client.force_authenticate(user=user)
        self.assertNoAnswerFields(
            self.client.get('/api/exams/questions/'), 'subscriber question list'
        )

    def test_admin_sees_same_shape_as_user_on_question_list(self):
        """
        Admin bypass must not change the response *shape*. Divergent payloads
        for admins mean admins cannot meaningfully test the real user
        experience, and any frontend list handling breaks when an admin logs
        in. (Report: API consistency.)
        """
        self.client.force_authenticate(user=make_user(username='normal'))
        user_keys = sorted(self.client.get('/api/exams/questions/').json().keys())

        admin_client = APIClient()
        admin_client.force_authenticate(user=make_admin())
        admin_keys = sorted(admin_client.get('/api/exams/questions/').json().keys())

        self.assertEqual(
            user_keys, admin_keys,
            f'admin payload shape {admin_keys} != user payload shape {user_keys}'
        )


class AnonymousAccessTests(TestCase):
    """
    Finding C-1: `UNAUTHENTICATED_USER: None` made request.user None for
    anonymous DRF requests, so any view calling request.user.is_authenticated
    raised AttributeError -> HTTP 500. Public endpoints must never 500.
    """

    def setUp(self):
        self.client = APIClient()
        self.category = make_exam_category()
        self.subject = make_subject(categories=[self.category])
        make_question(self.subject, self.category)

    def test_public_exam_endpoints_do_not_500_for_anonymous(self):
        for url in (
            '/api/exams/categories/',
            '/api/exams/subjects/',
            '/api/exams/questions/',
            '/api/exams/question-banks/',
        ):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertLess(
                    response.status_code, 500,
                    f'{url} returned {response.status_code} for anonymous user'
                )


class QuestionWritePermissionTests(TestCase):
    """
    Phase 0 also restricted question writes to admins. Any authenticated user
    could previously create/edit/delete exam questions.
    """

    def setUp(self):
        self.client = APIClient()
        self.category = make_exam_category()
        self.subject = make_subject(categories=[self.category])
        self.payload = {
            'question_text': 'Injected question',
            'subject': self.subject.pk,
            'exam_category': self.category.pk,
            'option_a': 'a', 'option_b': 'b', 'option_c': 'c', 'option_d': 'd',
            'correct_answer': 'A',
        }

    def test_regular_user_cannot_create_question(self):
        self.client.force_authenticate(user=make_user())
        response = self.client.post('/api/exams/questions/', self.payload)
        self.assertIn(response.status_code, (401, 403),
                      f'expected denial, got {response.status_code}')

    def test_anonymous_cannot_create_question(self):
        response = self.client.post('/api/exams/questions/', self.payload)
        self.assertIn(response.status_code, (401, 403),
                      f'expected denial, got {response.status_code}')

    def test_admin_can_create_question(self):
        self.client.force_authenticate(user=make_admin())
        response = self.client.post('/api/exams/questions/', self.payload)
        self.assertIn(response.status_code, (200, 201),
                      f'admin create failed with {response.status_code}: {response.content!r}')


class PastQuestionsCategoryResolutionTests(TestCase):
    """
    Regression for the reported bug: past questions existed in the DB for
    Mathematics but the tab showed "No Past Questions Available".

    Root cause: get_past_questions filtered with
    exam_category__name__iexact=<param>, but the frontend sends the URL slug
    ('waec'), while ExamCategory.name is 'WASSCE'. The filter matched nothing.
    Study Notes worked because it never filters on exam category.
    """

    def setUp(self):
        from exams.models import ExamYear
        self.client = APIClient()
        self.category = make_exam_category(name='WASSCE', display_name='WAEC/NECO')
        self.subject = make_subject(name='Mathematics', code='MTH',
                                    categories=[self.category])
        self.year = ExamYear.objects.create(year=2023, exam_category=self.category)
        # A published objective past question, as a real one would be.
        self.q = make_question(
            self.subject, self.category, correct_answer='A',
            question_text='Past Q: 2 + 2 = ?', question_type='OBJECTIVE',
            is_published=True,
        )
        self.q.exam_year = self.year
        self.q.save()
        self.user = make_user()

    def _get(self, exam_category):
        self.client.force_authenticate(user=self.user)
        return self.client.get(
            f'/api/exams/past-questions/{self.subject.id}/',
            {'exam_category': exam_category}
        )

    def test_waec_slug_resolves_and_returns_questions(self):
        response = self._get('waec')
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertGreaterEqual(
            body['total_questions'], 1,
            f"'waec' slug returned no past questions: {body}"
        )

    def test_canonical_name_also_works(self):
        self.assertGreaterEqual(self._get('WASSCE').json()['total_questions'], 1)

    def test_display_name_also_works(self):
        self.assertGreaterEqual(self._get('WAEC/NECO').json()['total_questions'], 1)

    def test_year_value_is_the_actual_year_not_the_fk_id(self):
        """The frontend year filter compares against a real year (2023)."""
        body = self._get('waec').json()
        q = body['questions'][0]
        self.assertEqual(q['exam_year'], 2023, f"exam_year should be the year: {q}")
        self.assertEqual(q['year'], 2023, f"year alias missing/wrong: {q}")
        self.assertIn(2023, body['available_years'])

    def test_unresolvable_category_does_not_hide_everything(self):
        """A stray/unknown category param should not force an empty result."""
        body = self._get('not-a-real-category').json()
        self.assertGreaterEqual(body['total_questions'], 1)

    def test_answers_are_present_for_self_study_review(self):
        """Past questions is a review surface; the answer is expected here."""
        q = self._get('waec').json()['questions'][0]
        self.assertEqual(q.get('correct_answer'), 'A')


class OwnAccountDataNotPaywalledTests(TestCase):
    """
    Regression: a user's OWN data must never sit behind a payment gate.

    api_user_stats and api_get_profile were decorated
    @admin_or_premium_required, which returns HTTP 402. Every query in those
    views is scoped to request.user, so this locked free users out of their
    own practice history and profile — and the dashboard broke immediately
    after signup, which is the worst possible moment.

    api_user_stats also reports free-trial usage, which by definition matters
    most to users who have NOT paid.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = make_user(username='freshuser')

    def test_new_user_can_load_own_stats(self):
        self.client.force_login(self.user)
        response = self.client.get('/api/exams/api/stats/')
        self.assertNotEqual(
            response.status_code, 402,
            'own practice stats are paywalled — new users get a broken dashboard'
        )
        self.assertEqual(response.status_code, 200, response.content)

    def test_new_user_can_load_own_profile(self):
        self.client.force_login(self.user)
        response = self.client.get('/api/exams/api/profile/')
        self.assertNotEqual(
            response.status_code, 402,
            'own profile is paywalled'
        )
        self.assertEqual(response.status_code, 200, response.content)

    def test_stats_still_require_authentication(self):
        response = self.client.get('/api/exams/api/stats/')
        self.assertIn(
            response.status_code, (302, 401, 403),
            f'unauthenticated access should be refused, got {response.status_code}'
        )

    def test_paywall_logic_itself_is_unchanged(self):
        """
        The fix relaxed two OWN-DATA endpoints only. Paid content must still
        be refused to a user without a subscription.

        Asserted against check_user_access directly rather than an HTTP
        endpoint: the only remaining @admin_or_premium_required view
        (get_questions_from_bank) is not routed in exams/urls.py, so there is
        no live URL to exercise.
        """
        from payments.utils import check_user_access

        category = make_exam_category()
        subject = make_subject(categories=[category])
        bank = make_question_bank(
            subject, category, is_free=False, has_free_trial=False
        )
        has_access, _msg, _data = check_user_access(self.user, bank)
        self.assertFalse(
            has_access,
            'paid content became accessible to a non-paying user'
        )
