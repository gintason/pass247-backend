"""
Free vs subscriber access across the platform.

Free (signed-up) users: 10 questions in total across Practice + Exams,
10 interview answers in total, no Notes / Syllabus / Past Questions content,
no timed or untimed quizzes. Subscribers: everything.
"""
from rest_framework.test import APIClient
from django.test import TestCase

from exams.models import ExamSyllabus, PracticeSession, Question, StudyNotes
from pasApp.models import Category as ICat, Interview, Product
from quiz.models import Category as QCat, Question as QQuestion
from utils.access import FREE_QUESTION_LIMIT, FREE_INTERVIEW_LIMIT
from utils.factories import (
    make_exam_category, make_question, make_question_bank, make_subject, make_subscriber, make_user,
)


class QuestionAllowanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = make_exam_category(name='JSS', display_name='JSSCE')
        self.maths = make_subject(categories=[self.cat])
        self.english = make_subject(name='English', code='ENG', categories=[self.cat])
        self.qs = [make_question(self.maths if i % 2 else self.english, self.cat) for i in range(14)]
        self.bank = make_question_bank(self.maths, self.cat, questions=self.qs)
        self.user = make_user(email='free@example.com')
        self.client.force_authenticate(self.user)

    def session(self, questions):
        return PracticeSession.objects.create(user=self.user, question_bank=self.bank,
                                              total_questions=len(questions),
                                              questions_order=[q.id for q in questions])

    def answer(self, session, q):
        session.refresh_from_db()
        session.current_question_index = session.questions_order.index(q.id)
        session.save()
        return self.client.post(f'/api/exams/sessions/{session.id}/check_answer/',
                                {'question_id': q.id, 'selected_answer': 'A'}, format='json')

    def test_ten_free_questions_across_subjects_then_upgrade(self):
        s = self.session(self.qs)
        for q in self.qs[:FREE_QUESTION_LIMIT]:
            self.assertEqual(self.answer(s, q).status_code, 200)
        res = self.answer(s, self.qs[FREE_QUESTION_LIMIT])
        self.assertEqual(res.status_code, 402)
        self.assertEqual(res.json()['code'], 'subscription_required')
        # Re-trying an already answered question is still allowed.
        self.assertEqual(self.answer(s, self.qs[0]).status_code, 200)

    def test_trial_endpoint_shares_the_same_allowance_and_hides_answer(self):
        s = self.session(self.qs)
        for q in self.qs[:FREE_QUESTION_LIMIT]:
            self.answer(s, q)
        res = self.client.post(f'/api/exams/question-banks/{self.bank.id}/submit_answer_trial/',
                               {'question_id': self.qs[11].id, 'selected_answer': 'A', 'session_id': s.id},
                               format='json')
        self.assertEqual(res.status_code, 402)
        self.assertNotIn('correct_answer', res.json())

    def test_practice_start_is_capped_then_blocked(self):
        for q in self.qs:
            q.usage = Question.USAGE_PRACTICE
            q.save()
        res = self.client.post('/api/exams/practice/start/',
                               {'subject_id': self.maths.id, 'exam_category': 'jssce'}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertLessEqual(res.json()['total_questions'], FREE_QUESTION_LIMIT)
        s = self.session(self.qs)
        for q in self.qs[:FREE_QUESTION_LIMIT]:
            self.answer(s, q)
        res = self.client.post('/api/exams/practice/start/',
                               {'subject_id': self.maths.id, 'exam_category': 'jssce'}, format='json')
        self.assertEqual(res.status_code, 402)

    def test_access_endpoint_reports_allowance(self):
        s = self.session(self.qs)
        for q in self.qs[:3]:
            self.answer(s, q)
        body = self.client.get('/api/exams/portal/access/').json()
        self.assertEqual((body['free_questions_used'], body['free_questions_remaining']), (3, 7))
        self.assertFalse(body['notes_unlocked'])

    def test_subscriber_is_unlimited(self):
        sub = make_subscriber(username='payer')
        self.client.force_authenticate(sub)
        s = PracticeSession.objects.create(user=sub, question_bank=self.bank, total_questions=14,
                                           questions_order=[q.id for q in self.qs])
        for i, q in enumerate(self.qs):
            s.current_question_index = i
            s.save()
            res = self.client.post(f'/api/exams/sessions/{s.id}/check_answer/',
                                   {'question_id': q.id, 'selected_answer': 'A'}, format='json')
            self.assertEqual(res.status_code, 200)


class ContentLockTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.cat = make_exam_category(name='JSS', display_name='JSSCE')
        self.subject = make_subject(categories=[self.cat])
        StudyNotes.objects.create(subject=self.subject, title='Notes', content='# Notes')
        self.syl = ExamSyllabus.objects.create(exam_category=self.cat, subject=self.subject,
                                               title='Maths Syllabus', content='secret syllabus text',
                                               external_url='https://example.com/s.pdf')

    def urls(self):
        return [f'/api/exams/study-notes/{self.subject.id}/',
                f'/api/exams/past-questions/{self.subject.id}/',
                f'/api/exams/syllabuses/{self.syl.id}/']

    def test_free_and_anonymous_are_locked(self):
        for who in (None, make_user(email='f@example.com')):
            if who:
                self.client.force_authenticate(who)
            for url in self.urls():
                res = self.client.get(url)
                self.assertEqual(res.status_code, 402, url)
                self.assertEqual(res.json()['code'], 'subscription_required')
                self.assertNotIn('secret syllabus text', res.content.decode())

    def test_syllabus_titles_visible_but_documents_hidden(self):
        self.client.force_authenticate(make_user(email='f@example.com'))
        body = self.client.get('/api/exams/syllabuses/', {'exam_category': 'jssce'}).json()
        item = body['syllabuses'][0]
        self.assertEqual(item['title'], 'Maths Syllabus')
        self.assertTrue(item['locked'])
        self.assertIsNone(item['file_url'])
        self.assertEqual(item['external_url'], '')

    def test_subscriber_unlocked(self):
        self.client.force_authenticate(make_subscriber())
        for url in self.urls():
            self.assertEqual(self.client.get(url).status_code, 200, url)


class InterviewAllowanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cat = ICat.objects.create(name='Banking')
        self.product = Product.objects.create(name='Bank Interview', description='d', category=cat)
        other = Product.objects.create(name='Teaching', description='d', category=cat)
        self.items = [Interview.objects.create(product=self.product, category=cat, question=f'Q{i}',
                                               answer=f'Answer {i}', order=i) for i in range(8)]
        self.items += [Interview.objects.create(product=other, category=cat, question=f'T{i}',
                                                answer=f'Teach {i}', order=i) for i in range(8)]

    def listing(self, product):
        return self.client.get(f'/api/interview/products/{product.slug}/interviews/', {'page_size': 50}).json()

    def test_free_user_gets_ten_answers_in_total(self):
        self.client.force_authenticate(make_user(email='f@example.com'))
        first = self.listing(self.product)['results']
        self.assertTrue(all(not r['is_locked'] and r['answer'] for r in first))     # 8 used
        second = self.listing(Product.objects.get(name='Teaching'))
        unlocked = [r for r in second['results'] if not r['is_locked']]
        locked = [r for r in second['results'] if r['is_locked']]
        self.assertEqual(len(unlocked), FREE_INTERVIEW_LIMIT - 8)
        self.assertTrue(all(r['answer'] is None for r in locked))
        self.assertEqual(second['access']['free_interviews_remaining'], 0)
        # Already-opened answers stay open.
        self.assertTrue(all(not r['is_locked'] for r in self.listing(self.product)['results']))
        # Detail view of a locked one stays locked.
        detail = self.client.get(f'/api/interview/interviews/{locked[0]["id"]}/').json()
        self.assertIsNone(detail['answer'])
        self.assertTrue(detail['premium_required'])

    def test_anonymous_sees_questions_not_answers(self):
        rows = self.listing(self.product)['results']
        self.assertEqual(len(rows), 8)
        self.assertTrue(all(r['answer'] is None for r in rows))

    def test_subscriber_sees_everything_and_filters_work(self):
        self.client.force_authenticate(make_subscriber())
        rows = self.listing(self.product)['results'] + self.listing(Product.objects.get(name='Teaching'))['results']
        self.assertTrue(all(r['answer'] for r in rows))
        res = self.client.get(f'/api/interview/products/{self.product.slug}/interviews/', {'difficulty': 'intermediate'})
        self.assertEqual(res.status_code, 200)

    def test_free_user_filter_does_not_crash(self):
        """Filtering after slicing used to raise 'Cannot filter a query once a slice has been taken'."""
        self.client.force_authenticate(make_user(email='f@example.com'))
        res = self.client.get(f'/api/interview/products/{self.product.slug}/interviews/', {'difficulty': 'intermediate'})
        self.assertEqual(res.status_code, 200)


class QuizSubscriptionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cat = ICat.objects.create(name='Banking')
        self.product = Product.objects.create(name='Bank Interview', description='d', category=cat)
        qcat = QCat.objects.create(category_name='Banking')
        self.q = QQuestion.objects.create(category=qcat, question='KYC?', correct_answers='know your customer')

    def test_free_user_blocked_from_quizzes(self):
        self.client.force_authenticate(make_user(email='f@example.com'))
        for method, url, data in (
            ('get', f'/api/quiz/product/{self.product.id}/questions/', None),
            ('get', '/api/quiz/questions/', None),
            ('post', '/api/quiz/submit-timed/', {'answers': [{'question_id': self.q.id, 'user_answer': 'x'}]}),
            ('get', '/api/untimed-quiz/questions/', None),
            ('post', '/api/untimed-quiz/submit/', {'answers': []}),
        ):
            res = getattr(self.client, method)(url, data, format='json') if data else getattr(self.client, method)(url)
            self.assertEqual(res.status_code, 402, url)
            self.assertEqual(res.json()['code'], 'subscription_required')

    def test_subscriber_can_take_quiz(self):
        self.client.force_authenticate(make_subscriber())
        res = self.client.get(f'/api/quiz/product/{self.product.id}/questions/')
        self.assertEqual(res.status_code, 200)
