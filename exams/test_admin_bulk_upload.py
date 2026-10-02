"""Admin: Exam Questions and Practice Questions both have bulk upload."""
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from exams.models import PracticeCategory, Question
from utils.factories import make_admin, make_exam_category, make_subject

CSV_HEADER = ('question_text,subject,exam_category,question_type,difficulty,'
              'option_a,option_b,option_c,option_d,correct_answer')


def csv_file(rows, extra_header=''):
    body = CSV_HEADER + extra_header + '\n' + '\n'.join(rows) + '\n'
    return SimpleUploadedFile('questions.csv', body.encode(), content_type='text/csv')


class BulkUploadAdminTests(TestCase):
    def setUp(self):
        self.admin = make_admin(superuser=True)
        self.client.force_login(self.admin)
        self.cat = make_exam_category(name='JSS', display_name='JSSCE')
        self.subject = make_subject(categories=[self.cat])

    def test_sections_are_named(self):
        res = self.client.get('/admin/exams/')
        self.assertContains(res, 'Exam Questions')
        self.assertContains(res, 'Practice Questions')

    def test_both_changelists_show_bulk_buttons(self):
        for model, label in (('question', 'Exam Questions'), ('practicequestion', 'Practice Questions')):
            res = self.client.get(f'/admin/exams/{model}/')
            self.assertEqual(res.status_code, 200, model)
            self.assertContains(res, f'Bulk Upload {label}')
            self.assertContains(res, f'/admin/exams/{model}/download-template/')

    def test_both_templates_download(self):
        for model in ('question', 'practicequestion'):
            res = self.client.get(f'/admin/exams/{model}/download-template/')
            self.assertEqual(res.status_code, 200, model)
            self.assertIn('spreadsheetml', res['Content-Type'])

    def test_practice_upload_defaults_to_practice_and_set(self):
        res = self.client.post('/admin/exams/practicequestion/bulk-upload/', {
            'excel_file': csv_file(['What is 2+2?,Mathematics,JSS,OBJECTIVE,EASY,4,5,6,7,A',
                                    'What is 3+3?,Mathematics,JSS,OBJECTIVE,EASY,6,5,4,7,A']),
            'practice_category': 'Addition',
        })
        self.assertRedirects(res, '/admin/exams/practicequestion/', fetch_redirect_response=False)
        qs = Question.objects.all()
        self.assertEqual(qs.count(), 2)
        self.assertTrue(all(q.usage == Question.USAGE_PRACTICE for q in qs))
        pc = PracticeCategory.objects.get(name='Addition')
        self.assertEqual(pc.questions.count(), 2)

    def test_practice_upload_column_overrides_default(self):
        self.client.post('/admin/exams/practicequestion/bulk-upload/', {
            'excel_file': csv_file(['Q1,Mathematics,JSS,OBJECTIVE,EASY,a,b,c,d,A,BOTH,Fractions'],
                                   extra_header=',usage,practice_category'),
        })
        q = Question.objects.get()
        self.assertEqual((q.usage, q.practice_category.name), ('BOTH', 'Fractions'))

    def test_exam_upload_keeps_both_default(self):
        res = self.client.post('/admin/exams/question/bulk-upload/', {
            'excel_file': csv_file(['Q1,Mathematics,JSS,OBJECTIVE,EASY,a,b,c,d,A']),
        })
        self.assertRedirects(res, '/admin/exams/question/', fetch_redirect_response=False)
        self.assertEqual(Question.objects.get().usage, Question.USAGE_BOTH)

    def test_bulk_forms_render(self):
        res = self.client.get('/admin/exams/practicequestion/bulk-upload/')
        self.assertContains(res, 'Bulk Upload Practice Questions')
        self.assertContains(res, 'name="practice_category"')
        res = self.client.get('/admin/exams/question/bulk-upload/')
        self.assertContains(res, 'Bulk Upload Exam Questions')
        self.assertContains(res, 'create_question_banks')
