from django.contrib import admin

from utils.bulk_upload_base import (
    BulkUploadAdminMixin, cell, blank_results,
)
from .models import UntimedCategory, UntimedQuestion, UntimedUserResponse


def _get_or_create_untimed_category(identifier):
    """Resolve an UntimedCategory by name (case-insensitive), create if absent."""
    ident = str(identifier).strip()
    category = UntimedCategory.objects.filter(name__iexact=ident).first()
    if category:
        return category
    return UntimedCategory.objects.create(name=ident)


@admin.register(UntimedCategory)
class UntimedCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)


@admin.register(UntimedQuestion)
class UntimedQuestionAdmin(BulkUploadAdminMixin, admin.ModelAdmin):
    list_display = ("id", "category", "short_text")
    search_fields = ("text", "correct_answer")
    list_filter = ("category",)

    change_list_template = "admin/bulk_upload_shared_changelist.html"
    bulk_upload_form_template = "admin/bulk_upload_shared_form.html"
    bulk_template_filename = "untimed_quiz_bulk_upload_template.csv"

    def short_text(self, obj):
        return (obj.text[:75] + '...') if len(obj.text) > 75 else obj.text
    short_text.short_description = 'Question'

    # ---- Bulk upload ------------------------------------------------------
    def process_bulk_upload(self, df, request):
        results = blank_results()
        results['total_rows'] = len(df)

        for index, row in df.iterrows():
            row_no = index + 2
            try:
                text = cell(row, df, 'question', 'question_text', 'text')
                correct = cell(row, df, 'correct_answer', 'correct_answers',
                               'answer', 'answers')
                category_ident = cell(row, df, 'category', 'category_name',
                                      'topic')

                missing = [name for name, val in (
                    ('question', text), ('correct_answer', correct),
                    ('category', category_ident),
                ) if not val]
                if missing:
                    raise ValueError(f"Missing required field(s): {', '.join(missing)}")

                category = _get_or_create_untimed_category(category_ident)

                UntimedQuestion.objects.create(
                    category=category,
                    text=text,
                    correct_answer=correct,
                    hint=cell(row, df, 'hint') or '',
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
            ('choices', 'No', 'Options/choices, pipe-separated (stored, optional).'),
            ('correct_answer', 'YES', 'The correct answer (fuzzy-matched at >=50% similarity).'),
            ('category', 'YES', 'Category/topic name. Created if missing.'),
            ('hint', 'No', 'Optional hint shown to the user.'),
            ('explanation', 'No', 'Explanation / answer details (optional).'),
        ]
        sample_rows = [
            {
                'question': 'What is the boiling point of water at sea level in Celsius?',
                'choices': '',
                'correct_answer': '100 degrees celsius',
                'category': 'General Science',
                'hint': 'Think about the metric scale.',
                'explanation': 'At standard atmospheric pressure water boils at 100°C.',
            },
            {
                'question': 'Name the largest planet in the solar system.',
                'choices': 'Jupiter | Saturn | Earth',
                'correct_answer': 'jupiter',
                'category': 'General Science',
                'hint': 'It is a gas giant.',
                'explanation': 'Jupiter is the largest planet by mass and volume.',
            },
        ]
        return sample_rows, field_specs


@admin.register(UntimedUserResponse)
class UntimedUserResponseAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "question", "is_correct")
    search_fields = ("user__username", "question__text")
    list_filter = ("is_correct",)
