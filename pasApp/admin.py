from django.contrib import admin
from django.db.models import Q

from utils.bulk_upload_base import (
    BulkUploadAdminMixin, cell, to_bool, to_int, blank_results,
)
from .models import Interview, Category, Product, ContactMessage


# --------------------------------------------------------------------------
# Interview lookups
# --------------------------------------------------------------------------
def _get_product(identifier):
    """Resolve a Product by id, slug or (case-insensitive) name. Must exist."""
    if identifier is None:
        return None
    ident = str(identifier).strip()
    if ident.isdigit():
        product = Product.objects.filter(id=int(ident)).first()
        if product:
            return product
    return Product.objects.filter(
        Q(name__iexact=ident) | Q(slug__iexact=ident)
    ).first()


def _get_or_create_category(identifier):
    """Resolve an interview Category by name/slug, creating it if absent."""
    ident = str(identifier).strip()
    category = Category.objects.filter(
        Q(name__iexact=ident) | Q(slug__iexact=ident)
    ).first()
    if category:
        return category
    return Category.objects.create(name=ident)


# Accepted spellings for the difficulty column, mapped to model values.
_DIFFICULTY_MAP = {
    'beginner': 'BEGINNER',
    'entry': 'BEGINNER',
    'entry level': 'BEGINNER',
    'intermediate': 'INTERMEDIATE',
    'mid': 'INTERMEDIATE',
    'advanced': 'ADVANCED',
    'senior': 'ADVANCED',
    'senior level': 'ADVANCED',
    'expert': 'EXPERT',
}


@admin.register(Interview)
class InterviewAdmin(BulkUploadAdminMixin, admin.ModelAdmin):
    list_display = ['question', 'product', 'category', 'difficulty',
                    'is_featured', 'views_count', 'order']
    list_filter = ['difficulty', 'is_featured', 'product', 'category']
    search_fields = ['question', 'answer']
    list_editable = ['is_featured', 'order']

    change_list_template = "admin/bulk_upload_shared_changelist.html"
    bulk_upload_form_template = "admin/bulk_upload_shared_form.html"
    bulk_template_filename = "interview_bulk_upload_template.csv"

    # ---- Bulk upload ------------------------------------------------------
    def process_bulk_upload(self, df, request):
        results = blank_results()
        results['total_rows'] = len(df)

        for index, row in df.iterrows():
            row_no = index + 2  # header + 1-indexing
            try:
                question = cell(row, df, 'question', 'question_text')
                answer = cell(row, df, 'answer', 'answer_text')
                product_ident = cell(row, df, 'product', 'product_name')
                category_ident = cell(row, df, 'category', 'category_name', 'topic')

                missing = [name for name, val in (
                    ('question', question), ('answer', answer),
                    ('product', product_ident), ('category', category_ident),
                ) if not val]
                if missing:
                    raise ValueError(f"Missing required field(s): {', '.join(missing)}")

                product = _get_product(product_ident)
                if not product:
                    raise ValueError(
                        f"Product '{product_ident}' not found. Create it first.")

                category = _get_or_create_category(category_ident)

                difficulty_raw = cell(row, df, 'difficulty')
                difficulty = _DIFFICULTY_MAP.get(
                    (difficulty_raw or '').lower(), 'INTERMEDIATE')

                Interview.objects.create(
                    product=product,
                    question=question[:500],
                    answer=answer,
                    category=category,
                    difficulty=difficulty,
                    views_count=to_int(cell(row, df, 'views_count', 'views count', 'views'), 0),
                    is_featured=to_bool(cell(row, df, 'is_featured', 'is featured', 'featured'), False),
                    order=to_int(cell(row, df, 'order'), 0),
                )
                results['success_count'] += 1

            except Exception as exc:  # noqa: BLE001
                results['error_count'] += 1
                results['errors'].append({'row': row_no, 'error': str(exc)})

        return results

    def get_bulk_template_rows(self):
        field_specs = [
            ('product', 'YES', 'Existing product name, slug or id (must already exist).'),
            ('question', 'YES', 'The interview question (max 500 chars).'),
            ('answer', 'YES', 'The model answer.'),
            ('category', 'YES', 'Category/level name, e.g. "Entry level", "Senior level". Created if missing.'),
            ('difficulty', 'No', 'Beginner / Intermediate / Advanced / Expert (default Intermediate).'),
            ('views_count', 'No', 'Integer, default 0.'),
            ('is_featured', 'No', 'true/false, yes/no (default false).'),
            ('order', 'No', 'Integer display order, default 0.'),
        ]
        sample_rows = [
            {
                'product': 'Python Developer',
                'question': 'What is the difference between a list and a tuple?',
                'answer': 'Lists are mutable; tuples are immutable and hashable.',
                'category': 'Entry level',
                'difficulty': 'Beginner',
                'views_count': 0,
                'is_featured': 'true',
                'order': 1,
            },
            {
                'product': 'Python Developer',
                'question': 'Explain the GIL and its impact on threading.',
                'answer': 'The Global Interpreter Lock serialises bytecode execution...',
                'category': 'Senior level',
                'difficulty': 'Advanced',
                'views_count': 0,
                'is_featured': 'false',
                'order': 2,
            },
        ]
        return sample_rows, field_specs


class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "description", "image", "is_active", "order"]
    list_editable = ["is_active", "order"]
    search_fields = ["name", "description"]


class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'is_read', 'created_at']
    list_filter = ['is_read']
    search_fields = ['name', 'email', 'message']


admin.site.register(Category)
admin.site.register(Product, ProductAdmin)
admin.site.register(ContactMessage, ContactMessageAdmin)
