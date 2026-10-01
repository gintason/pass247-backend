"""Tests for the study notes upload -> colour-coded Markdown conversion."""
import os

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from exams.admin import StudyNotesAdminForm
from exams.study_notes_import import (
    StudyNotesImportError, convert_uploaded_file, docx_to_markdown,
)
from utils.factories import make_exam_category, make_subject

SAMPLE_DOCX = os.path.join(
    os.path.dirname(__file__), 'fixtures_study_notes', 'sample_maths_jssce.docx'
)


class DocxConversionTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.md = docx_to_markdown(SAMPLE_DOCX)

    def test_all_nine_topic_banners(self):
        for n in range(1, 10):
            self.assertIn('TOPIC %d |' % n, self.md)
        self.assertIn('# 📘 TOPIC 1 | NUMBER AND NUMERATION', self.md)

    def test_callout_panels_present(self):
        for marker in ('[!DEFINITION]', '[!KEY FACT]', '[!FORMULA]',
                       '[!WORKED EXAMPLE]', '[!EXAM TIP]', '[!KEY RULE]'):
            self.assertIn(marker, self.md)

    def test_worked_example_steps_are_numbered(self):
        self.assertIn('> **❓ Evaluate: 3 + 4 × (6 − 2)² ÷ 8**', self.md)
        self.assertIn('> 1. Brackets: (6 − 2) = 4', self.md)
        self.assertIn('> **✅ Answer: 11**', self.md)

    def test_tables_and_toc(self):
        self.assertIn('TABLE OF CONTENTS', self.md)
        self.assertIn('| Acute angle | Between 0° and 90° |', self.md)
        self.assertIn('QUICK REFERENCE FORMULA SHEET', self.md)

    def test_markdown_specials_escaped(self):
        # "<" from the document must not become raw HTML
        self.assertIn('1 ≤ A \\< 10', self.md)


class UploadTests(TestCase):
    def test_markdown_passthrough(self):
        f = SimpleUploadedFile('notes.md', '# Hi\n\n> [!FORMULA]\n> a = b\n'.encode())
        self.assertEqual(convert_uploaded_file(f), '# Hi\n\n> [!FORMULA]\n> a = b\n')

    def test_rejects_other_types(self):
        with self.assertRaises(StudyNotesImportError):
            convert_uploaded_file(SimpleUploadedFile('notes.pdf', b'%PDF'))

    def test_rejects_corrupt_docx(self):
        with self.assertRaises(StudyNotesImportError):
            convert_uploaded_file(SimpleUploadedFile('notes.docx', b'not a zip'))

    def test_admin_form_upload_replaces_content(self):
        subject = make_subject(categories=[make_exam_category()])
        with open(SAMPLE_DOCX, 'rb') as fh:
            upload = SimpleUploadedFile('maths.docx', fh.read())
        form = StudyNotesAdminForm(
            data={'subject': subject.pk, 'title': 'JSSCE Maths', 'content': 'old',
                  'topics': '[]', 'formulas': '[]', 'references': '[]',
                  'is_active': 'on'},
            files={'upload_file': upload},
        )
        self.assertTrue(form.is_valid(), form.errors)
        note = form.save()
        self.assertIn('[!WORKED EXAMPLE]', note.content)
        self.assertNotEqual(note.content, 'old')
