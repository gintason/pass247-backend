import pandas as pd
from django.db import transaction
from django.db.models import Q
from .models import (
    ExamCategory, Subject, ExamYear, Question, QuestionBank
)


def process_excel_upload(file_path, user, options=None):
    """
    Process Excel file for bulk question upload
    
    Expected Excel columns:
    - question_text (required)
    - subject (required)
    - exam_category (required)
    - question_type (OBJECTIVE/THEORY) (required)
    - difficulty (EASY/MEDIUM/HARD) (required)
    - marks (integer, optional, default 1)
    - option_a, option_b, option_c, option_d, option_e (for OBJECTIVE)
    - correct_answer (for OBJECTIVE: A/B/C/D/E)
    - model_answer (for THEORY)
    - marking_guide (for THEORY, optional)
    - explanation (optional)
    - reference (optional)
    - exam_year (optional)
    - time_limit_seconds (optional)
    """
    
    df = pd.read_excel(file_path)
    
    # Convert all column names to lowercase
    df.columns = df.columns.str.lower().str.strip()
    
    results = {
        'total_rows': len(df),
        'success_count': 0,
        'error_count': 0,
        'errors': [],
        'created_questions': [],
        'question_banks_created': []
    }
    
    # Process each row
    for index, row in df.iterrows():
        try:
            # Validate required fields
            required_fields = ['question_text', 'subject', 'exam_category', 
                             'question_type', 'difficulty']
            
            missing_fields = []
            for field in required_fields:
                if field not in df.columns or pd.isna(row.get(field)):
                    missing_fields.append(field)
            
            if missing_fields:
                raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
            
            # Get or validate subject
            subject = get_subject(row['subject'])
            if not subject:
                raise ValueError(f"Subject '{row['subject']}' not found. Please create it first.")
            
            # Get or validate exam category
            exam_category = get_exam_category(row['exam_category'])
            if not exam_category:
                raise ValueError(f"Exam category '{row['exam_category']}' not found. Please create it first.")
            
            # Validate question type
            question_type = str(row['question_type']).upper().strip()
            if question_type not in ['OBJECTIVE', 'THEORY']:
                raise ValueError(f"Invalid question_type: {question_type}. Must be OBJECTIVE or THEORY")
            
            # Validate difficulty
            difficulty = str(row['difficulty']).upper().strip()
            if difficulty not in ['EASY', 'MEDIUM', 'HARD']:
                raise ValueError(f"Invalid difficulty: {difficulty}. Must be EASY, MEDIUM, or HARD")
            
            # Handle exam year
            exam_year = None
            if 'exam_year' in df.columns and not pd.isna(row.get('exam_year')):
                exam_year = get_or_create_exam_year(row['exam_year'], exam_category)
            
            # Prepare question data
            question_data = {
                'question_text': str(row['question_text']),
                'subject': subject,
                'exam_category': exam_category,
                'question_type': question_type,
                'difficulty': difficulty,
                'marks': int(row.get('marks', 1)) if not pd.isna(row.get('marks')) else 1,
                'exam_year': exam_year,
                'is_published': True,
                'created_by': user
            }
            
            # Add optional fields
            if 'explanation' in df.columns and not pd.isna(row.get('explanation')):
                question_data['explanation'] = str(row['explanation'])
            
            if 'reference' in df.columns and not pd.isna(row.get('reference')):
                question_data['reference'] = str(row['reference'])
            
            if 'time_limit_seconds' in df.columns and not pd.isna(row.get('time_limit_seconds')):
                question_data['time_limit_seconds'] = int(row['time_limit_seconds'])
            
            # Add options for objective questions
            if question_type == 'OBJECTIVE':
                for opt in ['a', 'b', 'c', 'd', 'e']:
                    field_name = f'option_{opt}'
                    if field_name in df.columns and not pd.isna(row.get(field_name)):
                        question_data[field_name] = str(row[field_name])
                    else:
                        question_data[field_name] = ''
                
                # Validate correct answer
                if 'correct_answer' not in df.columns or pd.isna(row.get('correct_answer')):
                    raise ValueError("correct_answer is required for OBJECTIVE questions")
                
                correct_answer = str(row['correct_answer']).upper().strip()
                if correct_answer not in ['A', 'B', 'C', 'D', 'E']:
                    raise ValueError(f"Invalid correct_answer: {correct_answer}. Must be A, B, C, D, or E")
                
                question_data['correct_answer'] = correct_answer
            
            else:  # THEORY
                if 'model_answer' in df.columns and not pd.isna(row.get('model_answer')):
                    question_data['model_answer'] = str(row['model_answer'])
                
                if 'marking_guide' in df.columns and not pd.isna(row.get('marking_guide')):
                    question_data['marking_guide'] = str(row['marking_guide'])
            
            # Create the question
            question = Question.objects.create(**question_data)
            
            results['success_count'] += 1
            results['created_questions'].append({
                'id': question.id,
                'question_text': question.question_text[:50],
                'subject': subject.name,
                'exam_category': exam_category.display_name
            })
            
        except Exception as e:
            results['error_count'] += 1
            results['errors'].append({
                'row': index + 2,  # +2 because Excel is 1-indexed and we have header
                'error': str(e)
            })
    
    # If specified in options, create question banks
    if options and options.get('create_question_banks', False) and results['success_count'] > 0:
        try:
            question_ids = [q['id'] for q in results['created_questions']]
            bank_results = auto_create_question_banks(question_ids)
            results['question_banks_created'] = bank_results
        except Exception as e:
            results['errors'].append({
                'row': 'N/A',
                'error': f'Error creating question banks: {str(e)}'
            })
    
    return results


def get_subject(subject_identifier):
    """Get subject by name, code, or ID"""
    if isinstance(subject_identifier, (int, float)):
        return Subject.objects.filter(id=int(subject_identifier), is_active=True).first()
    
    subject_str = str(subject_identifier).strip()
    return Subject.objects.filter(
        Q(name__iexact=subject_str) | Q(code__iexact=subject_str),
        is_active=True
    ).first()


def get_exam_category(category_identifier):
    """Get exam category by name, display_name, or ID"""
    if isinstance(category_identifier, (int, float)):
        return ExamCategory.objects.filter(id=int(category_identifier), is_active=True).first()
    
    category_str = str(category_identifier).strip()
    return ExamCategory.objects.filter(
        Q(name__iexact=category_str) | Q(display_name__iexact=category_str),
        is_active=True
    ).first()


def get_or_create_exam_year(year, exam_category):
    """Get or create exam year"""
    try:
        year_int = int(year)
    except (ValueError, TypeError):
        from datetime import datetime
        year_int = datetime.now().year
    
    exam_year, created = ExamYear.objects.get_or_create(
        year=year_int,
        exam_category=exam_category,
        defaults={'is_active': True}
    )
    return exam_year


def auto_create_question_banks(question_ids=None, grouping_strategy='auto'):
    """
    Automatically create question banks based on questions
    
    Grouping strategies:
    - 'auto': Create banks based on exam_category + subject + exam_year
    - 'exam_category': Create banks by exam category
    - 'subject': Create banks by subject
    - 'exam_year': Create banks by exam year
    """
    
    # Get questions
    if question_ids:
        questions = Question.objects.filter(id__in=question_ids, is_published=True)
    else:
        questions = Question.objects.filter(is_published=True)
    
    if not questions.exists():
        return []
    
    created_banks = []
    
    with transaction.atomic():
        if grouping_strategy == 'auto' or grouping_strategy == 'exam_category_subject_year':
            # Group by exam_category + subject + exam_year
            groups = {}
            
            for question in questions:
                key = f"{question.exam_category.id}_{question.subject.id}_{question.exam_year.id if question.exam_year else 'no_year'}"
                
                if key not in groups:
                    groups[key] = {
                        'exam_category': question.exam_category,
                        'subject': question.subject,
                        'exam_year': question.exam_year,
                        'questions': []
                    }
                
                groups[key]['questions'].append(question)
            
            # Create question banks for each group
            for key, group in groups.items():
                bank_name = f"{group['exam_category'].display_name} - {group['subject'].name}"
                if group['exam_year']:
                    bank_name += f" ({group['exam_year'].year})"
                
                question_bank, created = QuestionBank.objects.get_or_create(
                    name=bank_name,
                    exam_category=group['exam_category'],
                    subject=group['subject'],
                    exam_year=group['exam_year'],
                    defaults={
                        'description': f"Question bank for {bank_name}",
                        'is_active': True,
                        'has_free_trial': True,
                        'free_trial_questions': min(10, len(group['questions']))
                    }
                )
                
                # Add questions to the bank
                question_bank.questions.add(*group['questions'])
                
                created_banks.append({
                    'id': question_bank.id,
                    'name': question_bank.name,
                    'question_count': len(group['questions']),
                    'created': created
                })
        
        elif grouping_strategy == 'exam_category':
            # Group by exam category
            for exam_category in ExamCategory.objects.filter(is_active=True):
                group_questions = questions.filter(exam_category=exam_category)
                
                if group_questions.exists():
                    bank_name = f"{exam_category.display_name} - All Subjects"
                    
                    question_bank, created = QuestionBank.objects.get_or_create(
                        name=bank_name,
                        exam_category=exam_category,
                        defaults={
                            'description': f"Question bank for all {exam_category.display_name} questions",
                            'is_active': True,
                            'has_free_trial': True,
                            'free_trial_questions': min(10, group_questions.count())
                        }
                    )
                    
                    question_bank.questions.add(*group_questions)
                    
                    created_banks.append({
                        'id': question_bank.id,
                        'name': question_bank.name,
                        'question_count': group_questions.count(),
                        'created': created
                    })
        
        elif grouping_strategy == 'subject':
            # Group by subject
            for subject in Subject.objects.filter(is_active=True):
                group_questions = questions.filter(subject=subject)
                
                if group_questions.exists():
                    bank_name = f"{subject.name} - All Exams"
                    
                    question_bank, created = QuestionBank.objects.get_or_create(
                        name=bank_name,
                        subject=subject,
                        defaults={
                            'description': f"Question bank for all {subject.name} questions",
                            'is_active': True,
                            'has_free_trial': True,
                            'free_trial_questions': min(10, group_questions.count())
                        }
                    )
                    
                    question_bank.questions.add(*group_questions)
                    
                    created_banks.append({
                        'id': question_bank.id,
                        'name': question_bank.name,
                        'question_count': group_questions.count(),
                        'created': created
                    })
        
        elif grouping_strategy == 'exam_year':
            # Group by exam year
            for exam_year in ExamYear.objects.filter(is_active=True):
                group_questions = questions.filter(exam_year=exam_year)
                
                if group_questions.exists():
                    bank_name = f"{exam_year.exam_category.display_name} {exam_year.year}"
                    
                    question_bank, created = QuestionBank.objects.get_or_create(
                        name=bank_name,
                        exam_year=exam_year,
                        exam_category=exam_year.exam_category,
                        defaults={
                            'description': f"Question bank for {exam_year.exam_category.display_name} {exam_year.year}",
                            'is_active': True,
                            'has_free_trial': True,
                            'free_trial_questions': min(10, group_questions.count())
                        }
                    )
                    
                    question_bank.questions.add(*group_questions)
                    
                    created_banks.append({
                        'id': question_bank.id,
                        'name': question_bank.name,
                        'question_count': group_questions.count(),
                        'created': created
                    })
    
    return created_banks


def generate_bulk_upload_template():
    """
    Generate a sample Excel template for bulk upload
    """
    sample_data = {
        'question_text': [
            'What is the capital of Nigeria?',
            'Explain the process of photosynthesis.',
            'Solve the equation: 2x + 5 = 15'
        ],
        'subject': ['Social Studies', 'Biology', 'Mathematics'],
        'exam_category': ['WAEC', 'WAEC', 'JAMB'],
        'question_type': ['OBJECTIVE', 'THEORY', 'OBJECTIVE'],
        'difficulty': ['EASY', 'MEDIUM', 'MEDIUM'],
        'marks': [2, 5, 3],
        'option_a': ['Abuja', '', 'x = 5'],
        'option_b': ['Lagos', '', 'x = 10'],
        'option_c': ['Kano', '', 'x = 15'],
        'option_d': ['Port Harcourt', '', 'x = 20'],
        'option_e': ['Ibadan', '', 'x = 25'],
        'correct_answer': ['A', '', 'A'],
        'model_answer': ['', 'Photosynthesis is the process by which green plants convert light energy into chemical energy...', ''],
        'marking_guide': ['', 'Define photosynthesis (2 marks)\nExplain process (2 marks)\nMention importance (1 mark)', ''],
        'explanation': ['Abuja is the capital city of Nigeria since 1991.', 
                        'Plants use sunlight, water and CO2 to produce glucose and oxygen.',
                        'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5'],
        'reference': ['Nigerian Geography Textbook', 'Biology Textbook Ch.4', 'Mathematics Textbook Ch.2'],
        'exam_year': [2023, 2023, 2022],
        'time_limit_seconds': [120, 300, 180]
    }
    
    df = pd.DataFrame(sample_data)
    return df