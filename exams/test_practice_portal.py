"""Practice Portal: practice vs main exam engines, syllabuses, years, sessions."""
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from exams.admin import ExamSyllabusAdminForm
from exams.models import (
    ExamSyllabus, ExamYear, PracticeCategory, PracticeSession, Question, QuestionBank,
)
from utils.factories import (
    make_active_subscription, make_exam_category, make_question, make_question_bank,
    make_subject, make_user,
)


class PortalBase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = make_exam_category(name='JSS', display_name='JSSCE')
        self.subject = make_subject(categories=[self.cat])
        self.user = make_user(email='student@example.com')
        self.y2023 = ExamYear.objects.create(year=2023, exam_category=self.cat)
        self.y2024 = ExamYear.objects.create(year=2024, exam_category=self.cat)
        self.practice_set = PracticeCategory.objects.create(
            name='Number Bases', exam_category=self.cat, subject=self.subject)
        self.practice_qs = [
            make_question(self.subject, self.cat, usage=Question.USAGE_PRACTICE,
                          practice_category=self.practice_set) for _ in range(3)]
        self.loose_practice = make_question(self.subject, self.cat, usage=Question.USAGE_PRACTICE)
        self.exam_qs = [
            make_question(self.subject, self.cat, usage=Question.USAGE_EXAM, exam_year=self.y2023)
            for _ in range(4)] + [
            make_question(self.subject, self.cat, usage=Question.USAGE_EXAM, exam_year=self.y2024)]

    def login(self, user=None):
        self.client.force_authenticate(user or self.user)


class PracticeEngineTests(PortalBase):
    def test_categories_list_sets_and_loose_questions(self):
        res = self.client.get('/api/exams/practice/categories/', {'exam_category': 'jssce'})
        self.assertEqual(res.status_code, 200)
        cats = res.json()['categories']
        named = [c for c in cats if c['id'] == self.practice_set.id]
        self.assertEqual(named[0]['question_count'], 3)
        loose = [c for c in cats if c['id'] is None]
        self.assertEqual(loose[0]['question_count'], 1)

    def test_practice_requires_login(self):
        res = self.client.post('/api/exams/practice/start/', {'practice_category_id': self.practice_set.id})
        self.assertIn(res.status_code, (401, 403))

    def test_signed_up_student_practices_without_plan(self):
        self.login()
        res = self.client.post('/api/exams/practice/start/',
                               {'practice_category_id': self.practice_set.id}, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(body['total_questions'], 3)
        session = PracticeSession.objects.get(id=body['session_id'])
        self.assertEqual(session.session_type, 'PRACTICE')
        self.assertEqual(set(session.questions_order), {q.id for q in self.practice_qs})
        self.assertEqual(session.question_bank.bank_type, QuestionBank.BANK_TYPE_PRACTICE)
        # Exam-only questions never leak into practice.
        self.assertFalse(set(session.questions_order) & {q.id for q in self.exam_qs})

        cur = self.client.get(f'/api/exams/sessions/{session.id}/current_question/')
        self.assertEqual(cur.status_code, 200)
        self.assertEqual(cur.json()['session']['session_type'], 'PRACTICE')
        q = Question.objects.get(id=cur.json()['question']['id'])
        check = self.client.post(f'/api/exams/sessions/{session.id}/check_answer/',
                                 {'question_id': q.id, 'selected_answer': 'A'}, format='json')
        self.assertEqual(check.status_code, 200)
        self.assertTrue(check.json()['is_correct'])

    def test_practice_by_subject_uses_uncategorised_questions(self):
        self.login()
        res = self.client.post('/api/exams/practice/start/',
                               {'subject_id': self.subject.id, 'exam_category': 'jssce'}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()['total_questions'], 1)

    def test_empty_practice_set_is_a_clear_400(self):
        self.login()
        empty = PracticeCategory.objects.create(name='Empty', exam_category=self.cat, subject=self.subject)
        res = self.client.post('/api/exams/practice/start/', {'practice_category_id': empty.id}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()['code'], 'no_questions')

    def test_auto_banks_hidden_from_bank_listing(self):
        self.login()
        self.client.post('/api/exams/practice/start/',
                         {'practice_category_id': self.practice_set.id}, format='json')
        res = self.client.get('/api/exams/question-banks/')
        names = [b['name'] for b in res.json()['results']]
        self.assertFalse(any(n.startswith('Practice ·') for n in names))


class MainExamTests(PortalBase):
    def test_main_exam_needs_paid_plan(self):
        self.login()
        res = self.client.post('/api/exams/main-exam/start/',
                               {'subject_id': self.subject.id, 'exam_category': 'jssce'}, format='json')
        self.assertEqual(res.status_code, 402)
        self.assertEqual(res.json()['code'], 'upgrade_required')
        self.assertEqual(res.json()['upgrade_url'], '/payment-plans')

    def test_subscriber_starts_timed_exam_for_a_year(self):
        make_active_subscription(self.user)
        self.login()
        res = self.client.post('/api/exams/main-exam/start/',
                               {'subject_id': self.subject.id, 'exam_category': 'jssce', 'year': 2023},
                               format='json')
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(body['session_type'], 'EXAM')
        self.assertEqual(body['total_questions'], 4)
        self.assertGreaterEqual(body['duration_minutes'], 10)
        session = PracticeSession.objects.get(id=body['session_id'])
        self.assertFalse(set(session.questions_order) & {q.id for q in self.practice_qs})
        cur = self.client.get(f'/api/exams/sessions/{session.id}/current_question/')
        self.assertIsNotNone(cur.json()['session']['time_remaining_seconds'])

    def test_generic_exam_session_is_gated_too(self):
        self.login()
        bank = make_question_bank(self.subject, self.cat, questions=self.exam_qs)
        res = self.client.post('/api/exams/sessions/', {'question_bank': bank.id, 'session_type': 'EXAM'},
                               format='json')
        self.assertEqual(res.status_code, 402)


class SessionErrorTests(PortalBase):
    def test_other_users_session_is_structured_404(self):
        other = make_user(username='other', email='o@example.com')
        bank = make_question_bank(self.subject, self.cat, questions=self.exam_qs)
        session = PracticeSession.objects.create(user=other, question_bank=bank, total_questions=1,
                                                 questions_order=[self.exam_qs[0].id])
        self.login()
        res = self.client.get(f'/api/exams/sessions/{session.id}/current_question/')
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res.json()['code'], 'session_not_found')
        res = self.client.get('/api/exams/sessions/999999/current_question/')
        self.assertEqual(res.json()['code'], 'session_not_found')

    def test_empty_bank_cannot_start_session(self):
        self.login()
        bank = make_question_bank(self.subject, self.cat, questions=[])
        res = self.client.post('/api/exams/sessions/', {'question_bank': bank.id}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()['code'], 'no_questions')

    def test_deleted_questions_are_skipped_then_finished(self):
        bank = make_question_bank(self.subject, self.cat, questions=self.exam_qs[:2])
        session = PracticeSession.objects.create(
            user=self.user, question_bank=bank, total_questions=2,
            questions_order=[self.exam_qs[0].id, self.exam_qs[1].id])
        self.exam_qs[0].delete()
        self.login()
        res = self.client.get(f'/api/exams/sessions/{session.id}/current_question/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['question']['id'], self.exam_qs[1].id)
        self.exam_qs[1].delete()
        res = self.client.get(f'/api/exams/sessions/{session.id}/current_question/')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()['error'], 'Session already completed')

    def test_completed_session_keeps_legacy_message(self):
        bank = make_question_bank(self.subject, self.cat, questions=self.exam_qs[:1])
        session = PracticeSession.objects.create(
            user=self.user, question_bank=bank, total_questions=1, status='COMPLETED',
            questions_order=[self.exam_qs[0].id])
        self.login()
        res = self.client.get(f'/api/exams/sessions/{session.id}/current_question/')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json(), {'error': 'Session already completed', 'code': 'session_completed'})


class PickerTests(PortalBase):
    def test_exam_years(self):
        res = self.client.get('/api/exams/exam-years/', {'exam_category': 'jssce'})
        years = res.json()['years']
        self.assertEqual([y['year'] for y in years], [2024, 2023])
        self.assertEqual(years[1]['question_count'], 4)

    def test_portal_subjects_counts(self):
        res = self.client.get('/api/exams/portal/subjects/', {'exam_category': 'jssce'})
        row = res.json()['subjects'][0]
        self.assertEqual(row['practice_questions'], 4)
        self.assertEqual(row['main_exam_questions'], 5)

    def test_exam_bodies_have_slugs(self):
        res = self.client.get('/api/exams/portal/exam-bodies/')
        self.assertIn('jssce', [b['slug'] for b in res.json()['exam_bodies']])

    def test_past_questions_year_filter_and_full_year_list(self):
        make_active_subscription(self.user)
        self.login()
        res = self.client.get(f'/api/exams/past-questions/{self.subject.id}/',
                              {'exam_category': 'jssce', 'year': 2024})
        body = res.json()
        self.assertEqual(body['available_years'], [2024, 2023])
        self.assertEqual(body['total_questions'], 1)
        self.assertEqual(body['questions'][0]['year'], 2024)

    def test_access_endpoint(self):
        self.assertFalse(self.client.get('/api/exams/portal/access/').json()['practice_unlocked'])
        self.login()
        body = self.client.get('/api/exams/portal/access/').json()
        self.assertTrue(body['practice_unlocked'])
        self.assertFalse(body['main_exam_unlocked'])


class SyllabusTests(PortalBase):
    def setUp(self):
        # The storage is chosen when the model loads (Cloudinary 'raw' in
        # production); keep test uploads on the local disk instead.
        import shutil, tempfile
        from django.core.files.storage import FileSystemStorage
        tmp = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, tmp, ignore_errors=True)
        field = ExamSyllabus._meta.get_field('file')
        original = field.storage
        field.storage = FileSystemStorage(location=tmp, base_url='/media/')
        self.addCleanup(setattr, field, 'storage', original)
        super().setUp()

    def test_markdown_upload_fills_content_and_lists(self):
        form = ExamSyllabusAdminForm(
            data={'exam_category': self.cat.id, 'subject': self.subject.id, 'title': 'JSSCE Maths',
                  'is_active': 'on', 'order': 0},
            files={'file': SimpleUploadedFile('maths.md', b'# Number & Numeration\n\n- Bases\n')})
        self.assertTrue(form.is_valid(), form.errors)
        syllabus = form.save()
        self.assertIn('Number & Numeration', syllabus.content)

        make_active_subscription(self.user)
        self.login()
        res = self.client.get('/api/exams/syllabuses/', {'exam_category': 'jssce', 'subject': self.subject.id})
        item = res.json()['syllabuses'][0]
        self.assertEqual(item['title'], 'JSSCE Maths')
        self.assertTrue(item['has_content'])
        self.assertEqual(item['file_type'], 'md')
        detail = self.client.get(f"/api/exams/syllabuses/{item['id']}/").json()
        self.assertIn('Bases', detail['content'])

    def test_general_syllabus_shown_with_subject_filter(self):
        ExamSyllabus.objects.create(exam_category=self.cat, title='General', content='x')
        res = self.client.get('/api/exams/syllabuses/', {'exam_category': 'jssce', 'subject': self.subject.id})
        self.assertEqual(len(res.json()['syllabuses']), 1)

    def test_rejects_bad_file_type(self):
        form = ExamSyllabusAdminForm(
            data={'exam_category': self.cat.id, 'title': 'Bad', 'is_active': 'on', 'order': 0},
            files={'file': SimpleUploadedFile('x.exe', b'MZ')})
        self.assertFalse(form.is_valid())


class MainExamBankBypassTests(PortalBase):
    def test_practice_session_on_auto_exam_bank_is_gated(self):
        subscriber = make_user(username='sub', email='sub@example.com')
        make_active_subscription(subscriber)
        self.client.force_authenticate(subscriber)
        bank_id = PracticeSession.objects.get(id=self.client.post(
            '/api/exams/main-exam/start/', {'subject_id': self.subject.id, 'exam_category': 'jssce'},
            format='json').json()['session_id']).question_bank_id
        self.client.force_authenticate(self.user)  # no plan
        res = self.client.post('/api/exams/sessions/', {'question_bank': bank_id, 'session_type': 'PRACTICE'},
                               format='json')
        self.assertEqual(res.status_code, 402)
