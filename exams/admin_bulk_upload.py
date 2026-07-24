from django.contrib import admin
from django.shortcuts import render, redirect
from django.urls import path
from django.contrib import messages
from django.http import HttpResponseRedirect, HttpResponse
from django.utils.html import format_html
from django.utils import timezone
import pandas as pd
import tempfile
import os
from io import BytesIO
from .bulk_upload_utils import (
    process_excel_upload, 
    auto_create_question_banks, 
    generate_bulk_upload_template
)
from .models import Question, QuestionBank


class BulkUploadAdmin(admin.ModelAdmin):
    change_list_template = "admin/bulk_upload.html"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk-upload/', self.admin_site.admin_view(self.bulk_upload_view), 
                 name='bulk-upload-questions'),
            path('download-template/', self.admin_site.admin_view(self.download_template_view),
                 name='download-upload-template'),
            path('create-question-banks/', self.admin_site.admin_view(self.create_question_banks_view),
                 name='create-question-banks'),
        ]
        return custom_urls + urls
    
    def bulk_upload_view(self, request):
        context = dict(
            self.admin_site.each_context(request),
            title='Bulk Upload Questions',
            result=None
        )
        
        if request.method == 'POST' and request.FILES.get('excel_file'):
            excel_file = request.FILES['excel_file']
            
            # Validate file type
            if not excel_file.name.endswith(('.xlsx', '.xls')):
                messages.error(request, 'Please upload an Excel file (.xlsx or .xls)')
                return render(request, "admin/bulk_upload_form.html", context)
            
            # Save uploaded file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
                for chunk in excel_file.chunks():
                    tmp_file.write(chunk)
                tmp_file_path = tmp_file.name
            
            try:
                # Process options
                options = {
                    'create_question_banks': request.POST.get('create_question_banks') == 'on',
                }
                
                # Process the upload
                results = process_excel_upload(tmp_file_path, request.user, options)
                
                context['result'] = results
                
                # Display messages
                messages.success(request, 
                    f"Successfully uploaded {results['success_count']} questions. "
                    f"{results['error_count']} errors found.")
                
                if results['question_banks_created']:
                    messages.success(request,
                        f"Created {len(results['question_banks_created'])} question banks.")
                
                if results['errors']:
                    for error in results['errors'][:5]:  # Show first 5 errors
                        messages.warning(request, f"Row {error['row']}: {error['error']}")
                    
                    if len(results['errors']) > 5:
                        messages.warning(request, 
                            f"...and {len(results['errors']) - 5} more errors.")
                
            except Exception as e:
                messages.error(request, f'Error processing file: {str(e)}')
            
            finally:
                # Clean up temp file
                os.unlink(tmp_file_path)
            
            return render(request, "admin/bulk_upload_form.html", context)
        
        return render(request, "admin/bulk_upload_form.html", context)
    
    def download_template_view(self, request):
        """Download Excel template for bulk upload"""
        df = generate_bulk_upload_template()
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Questions', index=False)
            
            # Add instructions sheet
            instructions = pd.DataFrame({
                'Field': [
                    'question_text', 'subject', 'exam_category', 'question_type',
                    'difficulty', 'marks', 'option_a', 'option_b', 'option_c',
                    'option_d', 'option_e', 'correct_answer', 'model_answer',
                    'marking_guide', 'explanation', 'reference', 'exam_year',
                    'time_limit_seconds'
                ],
                'Required': [
                    'YES', 'YES', 'YES', 'YES', 'YES', 'No (default: 1)',
                    'Only for OBJECTIVE', 'Only for OBJECTIVE', 'Only for OBJECTIVE',
                    'Only for OBJECTIVE', 'Only for OBJECTIVE', 'Only for OBJECTIVE',
                    'Only for THEORY', 'Only for THEORY', 'No', 'No', 'No', 'No'
                ],
                'Description': [
                    'The actual question text',
                    'Subject name or code (must exist in system)',
                    'Exam category name (WAEC, JAMB, NECO, etc.)',
                    'OBJECTIVE or THEORY',
                    'EASY, MEDIUM, or HARD',
                    'Marks for this question (integer)',
                    'Option A text',
                    'Option B text',
                    'Option C text',
                    'Option D text',
                    'Option E text',
                    'Correct option: A, B, C, D, or E',
                    'Model answer for theory questions',
                    'Marking guide for theory questions',
                    'Explanation for the answer',
                    'Reference source',
                    'Exam year (e.g., 2023)',
                    'Time limit in seconds'
                ]
            })
            instructions.to_excel(writer, sheet_name='Instructions', index=False)
        
        output.seek(0)
        
        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="question_upload_template.xlsx"'
        
        messages.success(request, 'Template downloaded successfully!')
        return response
    
    def create_question_banks_view(self, request):
        """Create question banks automatically"""
        if request.method == 'POST':
            grouping_strategy = request.POST.get('grouping_strategy', 'auto')
            question_filter = request.POST.get('question_filter', 'all')
            
            question_ids = None
            
            if question_filter == 'by_category':
                category_id = request.POST.get('exam_category')
                if category_id:
                    question_ids = Question.objects.filter(
                        exam_category_id=category_id, 
                        is_published=True
                    ).values_list('id', flat=True)
            
            elif question_filter == 'by_subject':
                subject_id = request.POST.get('subject')
                if subject_id:
                    question_ids = Question.objects.filter(
                        subject_id=subject_id, 
                        is_published=True
                    ).values_list('id', flat=True)
            
            elif question_filter == 'by_date':
                date_from = request.POST.get('date_from')
                date_to = request.POST.get('date_to')
                if date_from and date_to:
                    question_ids = Question.objects.filter(
                        created_at__date__gte=date_from,
                        created_at__date__lte=date_to,
                        is_published=True
                    ).values_list('id', flat=True)
            
            results = auto_create_question_banks(
                question_ids_or_objects=list(question_ids) if question_ids else None,
                grouping_strategy=grouping_strategy
            )
            
            messages.success(request, f'Created/Updated {len(results)} question banks!')
            
            for bank in results:
                if bank['created']:
                    messages.info(request, 
                        f"New bank: {bank['name']} ({bank['question_count']} questions)")
                else:
                    messages.info(request, 
                        f"Updated bank: {bank['name']} ({bank['question_count']} questions)")
            
            return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/admin/'))
        
        # GET request - show form
        from .models import ExamCategory, Subject
        context = dict(
            self.admin_site.each_context(request),
            title='Auto-Create Question Banks',
            exam_categories=ExamCategory.objects.filter(is_active=True),
            subjects=Subject.objects.filter(is_active=True),
        )
        return render(request, "admin/create_question_banks.html", context)