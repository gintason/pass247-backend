from django.contrib import admin
from django.db.models import Q

from utils.bulk_upload_base import (
    BulkUploadAdminMixin, cell, blank_results,
)
from .models import Question, Category


def _get_or_create_quiz_category(identifier):
    """Resolve a quiz Category by category_name (case-insensitive), create if absent."""
    ident = str(identifier).strip()
    category = Category.objects.filter(category_name__iexact=ident).first()
    if category:
        return category
    return Category.objects.create(category_name=ident)


@admin.register(Question)
class QuestionAdmin(BulkUploadAdminMixin, admin.ModelAdmin):
    list_display = ['short_question', 'category']
    list_filter = ['category']
    search_fields = ['question', 'correct_answers']

    change_list_template = "admin/bulk_upload_shared_changelist.html"
    bulk_upload_form_template = "admin/bulk_upload_shared_form.html"
    bulk_template_filename = "quiz_bulk_upload_template.csv"

    def short_question(self, obj):
        return (obj.question[:75] + '...') if len(obj.question) > 75 else obj.question
    short_question.short_description = 'Question'

    # ---- Bulk upload ------------------------------------------------------
    def process_bulk_upload(self, df, request):
        results = blank_results()
        results['total_rows'] = len(df)

        for index, row in df.iterrows():
            row_no = index + 2
            try:
                question = cell(row, df, 'question', 'question_text')
                correct = cell(row, df, 'correct_answers', 'correct_answer',
                               'answers', 'answer')
                category_ident = cell(row, df, 'category', 'category_name',
                                      'topic')

                missing = [name for name, val in (
                    ('question', question), ('correct_answers', correct),
                    ('category', category_ident),
                ) if not val]
                if missing:
                    raise ValueError(f"Missing required field(s): {', '.join(missing)}")

                category = _get_or_create_quiz_category(category_ident)

                Question.objects.create(
                    category=category,
                    question=question,
                    correct_answers=correct,
                    options=cell(row, df, 'options', 'choices') or '',
                    explanation=cell(row, df, 'explanation', 'answer_details',
                                     'answer details') or '',
                )
                results['success_count'] += 1

            except Exception as exc:  # noqa: BLE001
                results['error_count'] += 1
                results['errors'].append({'row': row_no, 'error': str(exc)})

        return results

    def get_bulk_template_rows(self):
        field_specs = [
            ('question', 'YES', 'The question text.'),
            ('choices', 'No', 'Options/choices, pipe-separated e.g. "A | B | C" (stored, optional).'),
            ('correct_answers', 'YES', 'Correct answer(s). Comma-separate acceptable variations for fuzzy matching.'),
            ('category', 'YES', 'Category/topic name. Created if missing.'),
            ('explanation', 'No', 'Explanation / answer details (optional).'),
        ]
        sample_rows = [
            {
                'question': 'Define an operating system.',
                'choices': '',
                'correct_answers': 'system software that manages hardware, resource manager',
                'category': 'Computer Science',
                'explanation': 'An OS manages hardware/software resources and provides services.',
            },
            {
                'question': 'What does CPU stand for?',
                'choices': 'Central Processing Unit | Computer Personal Unit',
                'correct_answers': 'central processing unit',
                'category': 'Computer Science',
                'explanation': 'The CPU is the primary component that executes instructions.',
            },
        ]
        return sample_rows, field_specs


admin.site.register(Category)
