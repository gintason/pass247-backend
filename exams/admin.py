from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.db.models import Count
from django.shortcuts import redirect, render
from django.contrib import messages
from django.http import HttpResponse
from io import BytesIO
import tempfile
import os

# Try to import optional dependencies
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None

from .models import (
    ExamCategory, Subject, ExamYear, Question, QuestionBank,
    UserSubscription, FreeTrialUsage, PracticeSession, UserAnswer,
    UserPerformance, ExamResult, Bookmark, StudyNotes, PastQuestionCollection
)

# Try to import bulk upload utilities
try:
    from .bulk_upload_utils import process_excel_upload, auto_create_question_banks, generate_bulk_upload_template
    BULK_UPLOAD_AVAILABLE = True
except ImportError:
    BULK_UPLOAD_AVAILABLE = False
    process_excel_upload = None
    auto_create_question_banks = None
    generate_bulk_upload_template = None


@admin.register(ExamCategory)
class ExamCategoryAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'order', 'is_active', 'question_count']
    list_filter = ['is_active', 'name', 'created_at']
    search_fields = ['display_name', 'description']
    list_editable = ['order', 'is_active']
    ordering = ['order', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'display_name', 'description', 'icon')
        }),
        ('Settings', {
            'fields': ('is_active', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def question_count(self, obj):
        count = Question.objects.filter(exam_category=obj).count()
        url = reverse('admin:exams_question_changelist') + f'?exam_category__id={obj.id}'
        return format_html('<a href="{}">{}</a>', url, count)
    question_count.short_description = 'Questions'


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'order', 'is_active', 'exam_categories_list', 'question_count']
    list_filter = ['is_active', 'exam_categories', 'created_at']
    search_fields = ['name', 'code', 'description']
    list_editable = ['order', 'is_active']
    filter_horizontal = ['exam_categories']
    ordering = ['order', 'name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'description', 'icon')
        }),
        ('Categories', {
            'fields': ('exam_categories',)
        }),
        ('Settings', {
            'fields': ('is_active', 'order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    readonly_fields = ['created_at', 'updated_at']
    
    def exam_categories_list(self, obj):
        return ", ".join([cat.display_name for cat in obj.exam_categories.all()])
    exam_categories_list.short_description = 'Exam Categories'
    
    def question_count(self, obj):
        count = Question.objects.filter(subject=obj).count()
        url = reverse('admin:exams_question_changelist') + f'?subject__id={obj.id}'
        return format_html('<a href="{}">{}</a>', url, count)
    question_count.short_description = 'Questions'


@admin.register(ExamYear)
class ExamYearAdmin(admin.ModelAdmin):
    list_display = ['year', 'exam_category', 'is_active']
    list_filter = ['exam_category', 'is_active', 'year']
    search_fields = ['year']
    list_editable = ['is_active']
    ordering = ['-year', 'exam_category']


class QuestionBankQuestionInline(admin.TabularInline):
    """Inline for questions in question bank"""
    model = QuestionBank.questions.through
    extra = 1
    verbose_name = 'Question'
    verbose_name_plural = 'Questions'
    autocomplete_fields = ['question']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'short_question', 'subject', 'exam_category', 
        'question_type', 'difficulty', 'marks', 'is_published', 
        'times_used', 'created_at'
    ]
    list_filter = [
        'question_type', 'difficulty', 'is_published', 
        'subject', 'exam_category', 'created_at'
    ]
    search_fields = ['question_text', 'explanation', 'reference']
    list_editable = ['is_published', 'marks', 'difficulty']
    readonly_fields = ['times_used', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    # ============================================================
    # USE CUSTOM TEMPLATE TO SHOW BULK UPLOAD BUTTONS
    # ============================================================
    change_list_template = "admin/exams/question/bulk_upload_changelist.html"
    
    fieldsets = (
        ('Question Content', {
            'fields': (
                'question_text', 'question_type', 'subject', 
                'exam_category', 'exam_year', 'difficulty', 'marks',
                'time_limit_seconds'
            )
        }),
        ('Diagram & Passage (optional)', {
            'fields': ('diagram_url', 'essay_paragraph'),
            'description': 'Image URL/path for diagram questions, and a '
                           'comprehension passage / essay body for passage-based questions.',
        }),
        ('Objective Question Options', {
            'fields': (
                'option_a', 'option_b', 'option_c', 'option_d', 'option_e',
                'correct_answer'
            ),
            'classes': ('collapse',),
        }),
        ('Theory Question', {
            'fields': ('model_answer', 'marking_guide'),
            'classes': ('collapse',),
        }),
        ('Explanation & References', {
            'fields': ('explanation', 'reference')
        }),
        ('Media Attachments', {
            'fields': ('question_image', 'question_audio'),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': ('is_published', 'times_used', 'created_by'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def short_question(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text
    short_question.short_description = 'Question'
    
    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def changelist_view(self, request, extra_context=None):
        """Add bulk upload buttons context to the question list page"""
        if extra_context is None:
            extra_context = {}
        
        extra_context['show_bulk_upload'] = True
        extra_context['bulk_upload_url'] = reverse('admin:exams_question_bulk_upload')
        extra_context['template_url'] = reverse('admin:exams_question_download_template')
        extra_context['dependencies_ok'] = BULK_UPLOAD_AVAILABLE and PANDAS_AVAILABLE
        
        return super().changelist_view(request, extra_context=extra_context)
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk-upload/', 
                 self.admin_site.admin_view(self.bulk_upload_view), 
                 name='exams_question_bulk_upload'),
            path('download-template/', 
                 self.admin_site.admin_view(self.download_template_view), 
                 name='exams_question_download_template'),
        ]
        return custom_urls + urls
    
    def bulk_upload_view(self, request):
        """Handle bulk upload of questions via Excel"""
        if not BULK_UPLOAD_AVAILABLE or not PANDAS_AVAILABLE:
            messages.error(request, '❌ Bulk upload dependencies are missing. Please install pandas and create bulk_upload_utils.py')
            return redirect('admin:exams_question_changelist')
        
        if request.method == 'POST' and request.FILES.get('excel_file'):
            excel_file = request.FILES['excel_file']
            
            if not excel_file.name.lower().endswith(('.xlsx', '.xls', '.csv')):
                messages.error(request, '❌ Please upload an Excel (.xlsx/.xls) or CSV (.csv) file')
                return redirect('admin:exams_question_changelist')
            
            if excel_file.size > 10 * 1024 * 1024:
                messages.error(request, '❌ File too large. Maximum size is 10MB')
                return redirect('admin:exams_question_changelist')
            
            # Preserve the original extension so the parser can pick the right
            # reader (CSV vs Excel).
            suffix = '.csv' if excel_file.name.lower().endswith('.csv') else '.xlsx'
            tmp_file_path = None
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                    for chunk in excel_file.chunks():
                        tmp_file.write(chunk)
                    tmp_file_path = tmp_file.name
                
                options = {
                    'create_question_banks': request.POST.get('create_question_banks') == 'on',
                }
                
                results = process_excel_upload(tmp_file_path, request.user, options)
                
                messages.success(request, 
                    f"✅ Upload complete: {results['success_count']} questions created, "
                    f"{results['error_count']} errors")
                
                if results.get('question_banks_created'):
                    messages.success(request, 
                        f"📚 {len(results['question_banks_created'])} question banks created/updated")
                
                if results.get('errors'):
                    for error in results['errors'][:5]:
                        messages.warning(request, f"⚠️ Row {error['row']}: {error['error']}")
                    
            except Exception as e:
                messages.error(request, f'❌ Error processing file: {str(e)}')
            finally:
                if tmp_file_path and os.path.exists(tmp_file_path):
                    try:
                        os.unlink(tmp_file_path)
                    except Exception:
                        pass
            
            return redirect('admin:exams_question_changelist')
        
        context = dict(
            self.admin_site.each_context(request),
            title='📤 Bulk Upload Questions',
            opts=self.model._meta,
            app_label=self.model._meta.app_label,
            has_permission=True,
        )
        return render(request, "admin/exams/question/bulk_upload_form.html", context)
    
    def download_template_view(self, request):
        """Download Excel template for bulk upload"""
        if not PANDAS_AVAILABLE or not BULK_UPLOAD_AVAILABLE:
            messages.error(request, '❌ Missing dependencies. Install pandas and create bulk_upload_utils.py')
            return redirect('admin:exams_question_changelist')
        
        try:
            df = generate_bulk_upload_template()
            
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Questions', index=False)
                
                instructions_data = {
                    'Field': [
                        'question_text', 'subject', 'exam_category', 'question_type',
                        'difficulty', 'marks', 'option_a', 'option_b', 'option_c',
                        'option_d', 'option_e', 'correct_answer', 'model_answer',
                        'marking_guide', 'explanation', 'reference', 'exam_year',
                        'time_limit_seconds', 'diagram_url', 'essay_paragraph'
                    ],
                    'Required': [
                        'YES', 'YES', 'YES', 'YES', 'YES', 'No',
                        'For OBJECTIVE', 'For OBJECTIVE', 'For OBJECTIVE',
                        'For OBJECTIVE', 'For OBJECTIVE', 'For OBJECTIVE',
                        'For THEORY', 'For THEORY', 'No', 'No', 'No', 'No',
                        'No', 'No'
                    ],
                    'Description': [
                        'The actual question text',
                        'Subject name or code',
                        'Exam category name (WAEC, JAMB, NECO)',
                        'OBJECTIVE or THEORY',
                        'EASY, MEDIUM, or HARD',
                        'Marks (integer)',
                        'Option A text',
                        'Option B text',
                        'Option C text',
                        'Option D text',
                        'Option E text',
                        'Correct: A, B, C, D, or E',
                        'Model answer for theory',
                        'Marking guide for theory',
                        'Explanation for answer',
                        'Reference source',
                        'Exam year (e.g., 2023)',
                        'Time limit in seconds',
                        'Optional: image URL or file path for a diagram/figure '
                        '(also accepted as column "diagram")',
                        'Optional: comprehension passage / essay body (also '
                        'accepted as column "comprehension_text")'
                    ]
                }
                instructions_df = pd.DataFrame(instructions_data)
                instructions_df.to_excel(writer, sheet_name='Instructions', index=False)
            
            output.seek(0)
            
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="bulk_question_template.xlsx"'
            
            messages.success(request, '📥 Template downloaded successfully!')
            return response
            
        except Exception as e:
            messages.error(request, f'❌ Error generating template: {str(e)}')
            return redirect('admin:exams_question_changelist')


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'subject', 'exam_category', 'exam_year', 
        'question_count_display', 'is_free', 'has_free_trial', 
        'free_trial_questions', 'is_active'
    ]
    list_filter = [
        'is_free', 'has_free_trial', 'is_active', 
        'exam_category', 'subject', 'exam_year'
    ]
    search_fields = ['name', 'description']
    list_editable = ['is_free', 'has_free_trial', 'free_trial_questions', 'is_active']
    filter_horizontal = ['questions']
    readonly_fields = ['created_at', 'updated_at']
    
    # ============================================================
    # USE CUSTOM TEMPLATE TO SHOW AUTO-CREATE BUTTON
    # ============================================================
    change_list_template = "admin/exams/questionbank/auto_create_changelist.html"
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'exam_category', 'subject', 'exam_year')
        }),
        ('Exam Settings', {
            'fields': ('duration_minutes', 'total_marks', 'pass_mark')
        }),
        ('Free Trial Settings', {
            'fields': ('is_free', 'has_free_trial', 'free_trial_questions', 'price')
        }),
        ('Questions', {
            'fields': ('questions',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def question_count_display(self, obj):
        count = obj.questions.count()
        url = reverse('admin:exams_question_changelist') + f'?questionbank__id={obj.id}'
        return format_html('<a href="{}">{}</a>', url, count)
    question_count_display.short_description = 'Questions'
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            question_count=Count('questions')
        )
    
    def changelist_view(self, request, extra_context=None):
        """Add auto-create button context to the question bank list page"""
        if extra_context is None:
            extra_context = {}
        
        extra_context['show_auto_create'] = True
        extra_context['auto_create_url'] = reverse('admin:exams_questionbank_auto_create')
        extra_context['dependencies_ok'] = BULK_UPLOAD_AVAILABLE
        
        return super().changelist_view(request, extra_context=extra_context)
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('auto-create/', 
                 self.admin_site.admin_view(self.auto_create_view), 
                 name='exams_questionbank_auto_create'),
        ]
        return custom_urls + urls
    
    def auto_create_view(self, request):
        """Auto-create question banks based on grouping strategy"""
        if not BULK_UPLOAD_AVAILABLE:
            messages.error(request, '❌ Auto-create is not available. Missing bulk_upload_utils.py')
            return redirect('admin:exams_questionbank_changelist')
        
        if request.method == 'POST':
            grouping_strategy = request.POST.get('grouping_strategy', 'auto')
            filter_type = request.POST.get('filter_type', 'all')
            
            question_ids = None
            
            try:
                if filter_type == 'exam_category':
                    category_id = request.POST.get('exam_category')
                    if category_id:
                        question_ids = Question.objects.filter(
                            exam_category_id=category_id, is_published=True
                        ).values_list('id', flat=True)
                
                elif filter_type == 'subject':
                    subject_id = request.POST.get('subject')
                    if subject_id:
                        question_ids = Question.objects.filter(
                            subject_id=subject_id, is_published=True
                        ).values_list('id', flat=True)
                
                elif filter_type == 'exam_year':
                    year_id = request.POST.get('exam_year')
                    if year_id:
                        question_ids = Question.objects.filter(
                            exam_year_id=year_id, is_published=True
                        ).values_list('id', flat=True)
                
                elif filter_type == 'unassigned':
                    assigned_question_ids = QuestionBank.questions.through.objects.values_list(
                        'question_id', flat=True
                    ).distinct()
                    question_ids = Question.objects.filter(
                        is_published=True
                    ).exclude(
                        id__in=assigned_question_ids
                    ).values_list('id', flat=True)
                
                results = auto_create_question_banks(
                    question_ids=list(question_ids) if question_ids else None,
                    grouping_strategy=grouping_strategy
                )
                
                if results:
                    messages.success(request, f'✅ Created/Updated {len(results)} question banks!')
                    
                    for bank in results:
                        if bank['created']:
                            messages.success(request, 
                                f"🆕 New: {bank['name']} ({bank['question_count']} questions)")
                        else:
                            messages.info(request, 
                                f"🔄 Updated: {bank['name']} ({bank['question_count']} questions)")
                else:
                    messages.warning(request, '⚠️ No question banks were created.')
                
            except Exception as e:
                messages.error(request, f'❌ Error creating question banks: {str(e)}')
            
            return redirect('admin:exams_questionbank_changelist')
        
        context = dict(
            self.admin_site.each_context(request),
            title='🤖 Auto-Create Question Banks',
            opts=self.model._meta,
            app_label=self.model._meta.app_label,
            exam_categories=ExamCategory.objects.filter(is_active=True),
            subjects=Subject.objects.filter(is_active=True),
            exam_years=ExamYear.objects.filter(is_active=True).select_related('exam_category'),
            has_permission=True,
        )
        return render(request, "admin/exams/questionbank/auto_create_form.html", context)


# ============================================================
# STUDY NOTES ADMIN
# ============================================================
@admin.register(StudyNotes)
class StudyNotesAdmin(admin.ModelAdmin):
    list_display = ['title', 'subject', 'is_active', 'created_by', 'created_at', 'topics_count']
    list_filter = ['is_active', 'subject', 'created_at']
    search_fields = ['title', 'content', 'subject__name']
    list_editable = ['is_active']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['subject', 'title']
    autocomplete_fields = ['subject', 'created_by']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('subject', 'title', 'content')
        }),
        ('Topics & Formulas', {
            'fields': ('topics', 'formulas'),
            'description': 'Enter topics as JSON array with title, description, and key_points. Enter formulas as JSON array with formula, description, and application.'
        }),
        ('References', {
            'fields': ('references',),
            'description': 'Enter references as JSON array with title, author, and other relevant fields.'
        }),
        ('Settings', {
            'fields': ('is_active', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def topics_count(self, obj):
        if obj.topics and isinstance(obj.topics, list):
            return len(obj.topics)
        return 0
    topics_count.short_description = 'Topics'
    
    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# ============================================================
# PAST QUESTIONS COLLECTION ADMIN
# ============================================================
class PastQuestionsInline(admin.TabularInline):
    """Inline for questions in past question collection"""
    model = PastQuestionCollection.questions.through
    extra = 1
    verbose_name = 'Question'
    verbose_name_plural = 'Questions'
    autocomplete_fields = ['question']


@admin.register(PastQuestionCollection)
class PastQuestionCollectionAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'subject', 'exam_category', 'exam_year', 
        'question_count_display', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'exam_category', 'subject', 'exam_year', 'created_at']
    search_fields = ['name', 'description', 'subject__name']
    list_editable = ['is_active']
    filter_horizontal = ['questions']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-exam_year__year', 'subject']
    autocomplete_fields = ['subject', 'exam_category', 'exam_year']
    # NOTE: intentionally NO `inlines` for the questions M2M. This admin edits
    # `questions` via filter_horizontal above; also attaching a
    # PastQuestionCollection.questions.through inline would render a second,
    # duplicate editor for the same relationship on the same page. Pick one -
    # filter_horizontal is the simpler bulk editor here.
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'subject', 'exam_category', 'exam_year')
        }),
        ('Questions', {
            'fields': ('questions',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def question_count_display(self, obj):
        count = obj.questions.count()
        url = reverse('admin:exams_question_changelist') + f'?pastquestioncollection__id={obj.id}'
        return format_html('<a href="{}">{}</a>', url, count)
    question_count_display.short_description = 'Questions'


# Keep all the remaining admin classes unchanged
@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'question_bank', 'is_active', 'subscription_date', 'expiry_date']
    list_filter = ['is_active', 'subscription_date', 'expiry_date']
    search_fields = ['user__username', 'user__email', 'question_bank__name', 'payment_reference']
    readonly_fields = ['subscription_date']
    list_select_related = ['user', 'question_bank']
    
    fieldsets = (
        ('User & Bank', {
            'fields': ('user', 'question_bank')
        }),
        ('Subscription Details', {
            'fields': ('subscription_date', 'expiry_date', 'is_active')
        }),
        ('Payment', {
            'fields': ('payment_reference',)
        })
    )


@admin.register(FreeTrialUsage)
class FreeTrialUsageAdmin(admin.ModelAdmin):
    list_display = ['user', 'subject', 'questions_answered', 'has_upgraded', 'last_answered_date']
    list_filter = ['has_upgraded', 'last_answered_date', 'subject']
    search_fields = ['user__username', 'user__email', 'subject__name']
    readonly_fields = ['last_answered_date']
    list_select_related = ['user', 'subject']
    
    fieldsets = (
        ('User & Subject', {
            'fields': ('user', 'subject')
        }),
        ('Trial Usage', {
            'fields': ('questions_answered', 'has_upgraded', 'last_answered_date')
        })
    )


class UserAnswerInline(admin.TabularInline):
    model = UserAnswer
    extra = 0
    readonly_fields = ['answered_at']
    fields = ['question', 'selected_answer', 'is_correct', 'time_spent_seconds', 'answered_at']


@admin.register(PracticeSession)
class PracticeSessionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'question_bank', 'session_type', 'status', 
        'percentage_display', 'total_questions', 'answered_questions', 
        'started_at'
    ]
    list_filter = ['session_type', 'status', 'started_at', 'question_bank']
    search_fields = ['user__username', 'user__email', 'question_bank__name']
    readonly_fields = ['started_at', 'completed_at', 'questions_order', 'score', 'percentage']
    list_select_related = ['user', 'question_bank']
    inlines = [UserAnswerInline]
    
    fieldsets = (
        ('Session Info', {
            'fields': ('user', 'question_bank', 'session_type', 'status')
        }),
        ('Progress', {
            'fields': (
                'total_questions', 'answered_questions', 
                'correct_answers', 'wrong_answers', 'score', 'percentage'
            )
        }),
        ('Timing', {
            'fields': ('started_at', 'completed_at', 'time_spent_seconds')
        }),
        ('Settings', {
            'fields': ('show_explanation_on_wrong', 'allow_review', 'is_submitted')
        }),
        ('Tracking', {
            'fields': ('current_question_index', 'questions_order'),
            'classes': ('collapse',)
        })
    )
    
    def percentage_display(self, obj):
        return f"{obj.percentage:.1f}%" if obj.percentage else "0%"
    percentage_display.short_description = 'Percentage'
    
    actions = ['mark_as_completed']
    
    def mark_as_completed(self, request, queryset):
        updated = queryset.update(status='COMPLETED')
        self.message_user(request, f'{updated} sessions marked as completed.')
    mark_as_completed.short_description = 'Mark selected sessions as completed'


@admin.register(UserAnswer)
class UserAnswerAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'session', 'question_short', 'selected_answer_preview', 
        'is_correct', 'time_spent_seconds', 'answered_at'
    ]
    list_filter = ['is_correct', 'feedback_shown', 'answered_at']
    search_fields = ['session__user__username', 'question__question_text']
    readonly_fields = ['answered_at']
    list_select_related = ['session', 'session__user', 'question']
    
    def question_short(self, obj):
        return obj.question.question_text[:50] + '...' if len(obj.question.question_text) > 50 else obj.question.question_text
    question_short.short_description = 'Question'
    
    def selected_answer_preview(self, obj):
        return obj.selected_answer[:50] + '...' if len(obj.selected_answer) > 50 else obj.selected_answer
    selected_answer_preview.short_description = 'Answer'


@admin.register(UserPerformance)
class UserPerformanceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'subject', 'exam_category', 'total_practices', 
        'total_questions_attempted', 'total_correct', 'average_score_display', 
        'best_score_display', 'last_practiced'
    ]
    list_filter = ['exam_category', 'last_practiced']
    search_fields = ['user__username', 'user__email', 'subject__name']
    readonly_fields = ['created_at', 'updated_at']
    list_select_related = ['user', 'subject', 'exam_category']
    
    def average_score_display(self, obj):
        return f"{obj.average_score:.1f}%"
    average_score_display.short_description = 'Avg Score'
    
    def best_score_display(self, obj):
        return f"{obj.best_score:.1f}%"
    best_score_display.short_description = 'Best Score'


@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display = ['session', 'email_sent', 'email_sent_at', 'certificate_generated', 'created_at']
    list_filter = ['email_sent', 'certificate_generated', 'created_at']
    search_fields = ['session__user__username', 'session__user__email']
    readonly_fields = ['created_at']
    list_select_related = ['session']
    
    fieldsets = (
        ('Session', {
            'fields': ('session',)
        }),
        ('Email Status', {
            'fields': ('email_sent', 'email_sent_at')
        }),
        ('Performance', {
            'fields': ('subject_scores', 'topic_performance', 'time_taken')
        }),
        ('Certificate', {
            'fields': ('certificate_generated', 'certificate_url')
        })
    )


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ['user', 'question_short', 'notes_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'question__question_text', 'notes']
    list_select_related = ['user', 'question']
    
    def question_short(self, obj):
        return obj.question.question_text[:50] + '...' if len(obj.question.question_text) > 50 else obj.question.question_text
    question_short.short_description = 'Question'
    
    def notes_preview(self, obj):
        return obj.notes[:50] + '...' if obj.notes and len(obj.notes) > 50 else obj.notes
    notes_preview.short_description = 'Notes'


# Custom admin site configuration 
admin.site.site_header = 'Exam Platform Administration'
admin.site.site_title = 'Exam Platform Admin'
admin.site.index_title = 'Welcome to Exam Platform Admin Dashboard'