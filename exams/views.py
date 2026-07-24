from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import *
from .serializers import *
from users.models import UserProfile, UserActivity
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.middleware.csrf import get_token
import json
import random
import tempfile
import os
from .bulk_upload_utils import process_excel_upload, auto_create_question_banks, generate_bulk_upload_template
from datetime import datetime
from .serializers import QuestionBankListSerializer, QuestionBankSerializer
from django.http import JsonResponse
from exams.models import PracticeSession, UserPerformance, FreeTrialUsage
from utils.admin_access import admin_or_premium_required, admin_or_login_required, auto_set_admin_premium, is_admin
from utils.rate_limit import rate_limit

# Payment integration import
try:
    from payments.utils import check_user_access
except ImportError:
    check_user_access = None


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ExamCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExamCategory.objects.filter(is_active=True)
    serializer_class = ExamCategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.filter(is_active=True)
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = []
    search_fields = ['name', 'code']
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        exam_category_param = self.request.query_params.get('exam_categories')
        if exam_category_param:
            if exam_category_param.isdigit():
                queryset = queryset.filter(exam_categories__id=exam_category_param)
            else:
                queryset = queryset.filter(
                    Q(exam_categories__name__iexact=exam_category_param) |
                    Q(exam_categories__display_name__iexact=exam_category_param)
                )
        return queryset.distinct()


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.filter(is_published=True)
    serializer_class = QuestionSerializer
    filterset_fields = ['subject', 'exam_category', 'difficulty', 'question_type']
    search_fields = ['question_text']
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        # SECURITY: creating/editing/deleting questions must be admin-only.
        # IsAuthenticatedOrReadOnly previously let ANY logged-in user write.
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticatedOrReadOnly()]

    @action(detail=True, methods=['post'])
    def increment_usage(self, request, pk=None):
        question = self.get_object()
        question.times_used += 1
        question.save()
        return Response({'status': 'usage count incremented'})


def _get_user_full_access(user):
    """Helper to check if user has full access via paid plan, bank subscription, or admin status"""
    # ============================================================
    # ADMIN BYPASS
    # ============================================================
    if user.is_staff or user.is_superuser:
        return True
    
    try:
        from payments.models import UserPlanSubscription
        has_paid_plan = UserPlanSubscription.objects.filter(
            user=user,
            is_active=True,
            end_date__gte=timezone.now()
        ).exists()
    except (ImportError, Exception):
        has_paid_plan = False
    
    has_bank_subscription = UserSubscription.objects.filter(
        user=user,
        is_active=True
    ).exists()
    
    has_premium_profile = (
        hasattr(user, 'profile') and 
        user.profile.is_premium and 
        user.profile.premium_expiry and 
        user.profile.premium_expiry > timezone.now()
    )
    
    return has_paid_plan or has_bank_subscription or has_premium_profile


class QuestionBankViewSet(viewsets.ModelViewSet):
    queryset = QuestionBank.objects.filter(is_active=True)
    serializer_class = QuestionBankSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['subject', 'exam_year', 'is_free']
    search_fields = ['name', 'description']
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return QuestionBankListSerializer
        return QuestionBankSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        queryset = super().get_queryset()
        exam_category_param = self.request.query_params.get('exam_category')
        if exam_category_param:
            if exam_category_param.isdigit():
                queryset = queryset.filter(exam_category__id=exam_category_param)
            else:
                queryset = queryset.filter(
                    Q(exam_category__name__iexact=exam_category_param) |
                    Q(exam_category__display_name__iexact=exam_category_param)
                )
        subject_param = self.request.query_params.get('subject')
        if subject_param:
            if subject_param.isdigit():
                queryset = queryset.filter(subject__id=subject_param)
            else:
                queryset = queryset.filter(
                    Q(subject__name__iexact=subject_param) |
                    Q(subject__code__iexact=subject_param)
                )
        return queryset.distinct()
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get questions from a question bank (with free trial limits - admin bypass)"""
        question_bank = self.get_object()
        
        # Admin bypass
        if is_admin(request.user):
            questions = question_bank.questions.all()
            if request.query_params.get('randomize') == 'true':
                questions = list(questions)
                random.shuffle(questions)
            limit = request.query_params.get('limit')
            if limit:
                questions = questions[:int(limit)]
            serializer = QuestionSerializer(questions, many=True, context={'request': request})
            return Response({
                'questions': serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: Full question bank unlocked'
            })
        
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Please login to access questions'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # ============================================================
        # UPDATED: Check both paid plan AND bank subscription
        # ============================================================
        has_full_access = _get_user_full_access(request.user)
        # ============================================================
        
        questions = question_bank.questions.all()
        
        if request.query_params.get('randomize') == 'true':
            questions = list(questions)
            random.shuffle(questions)
        
        if not has_full_access and question_bank.has_free_trial:
            trial, created = FreeTrialUsage.objects.get_or_create(
                user=request.user,
                subject=question_bank.subject,
                defaults={'questions_answered': 0}
            )
            
            if trial.questions_answered >= question_bank.free_trial_questions:
                upgrade_data = {
                    'message': f"You've completed all {question_bank.free_trial_questions} free questions for {question_bank.subject.name}! Upgrade to access the full question bank.",
                    'subject': question_bank.subject.name,
                    'questions_attempted': trial.questions_answered,
                    'upgrade_url': "/api/payments/initialize/",
                    'available_plans': [
                        {'name': 'Monthly', 'price': '₦2000', 'duration': '30 days'},
                        {'name': 'Quarterly', 'price': '₦5000', 'duration': '90 days'},
                        {'name': 'Yearly', 'price': '₦15000', 'duration': '365 days'}
                    ]
                }
                return Response(upgrade_data, status=status.HTTP_402_PAYMENT_REQUIRED)
            
            remaining = question_bank.free_trial_questions - trial.questions_answered
            questions = questions[:remaining]
            
            response_data = {
                'questions': QuestionSerializer(questions, many=True, context={'request': request}).data,
                'trial_info': {
                    'total_free': question_bank.free_trial_questions,
                    'used': trial.questions_answered,
                    'remaining': remaining,
                    'subject': question_bank.subject.name
                }
            }
            return Response(response_data)
        
        elif has_full_access or question_bank.is_free:
            limit = request.query_params.get('limit')
            if limit:
                questions = questions[:int(limit)]
            serializer = QuestionSerializer(questions, many=True, context={'request': request})
            return Response(serializer.data)
        
        else:
            return Response(
                {'error': 'Please subscribe to access this question bank'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=True, methods=['post'])
    def submit_answer_trial(self, request, pk=None):
        """Submit answer for trial question and track usage"""
        question_bank = self.get_object()
        
        user = None
        if request.user.is_authenticated:
            user = request.user
        else:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token_key = auth_header[7:]
                from rest_framework.authtoken.models import Token
                try:
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except Token.DoesNotExist:
                    pass
        
        if not user:
            return Response(
                {'error': 'Please login to submit answers'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        question_id = request.data.get('question_id')
        selected_answer = request.data.get('selected_answer')
        time_spent = request.data.get('time_spent_seconds', 0)
        session_id = request.data.get('session_id')
        
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
        
        is_correct = False
        if question.question_type == 'OBJECTIVE' and selected_answer:
            is_correct = (question.correct_answer.upper() == selected_answer.upper())
        
        # Save to UserAnswer
        if session_id:
            try:
                active_session = PracticeSession.objects.get(id=int(session_id), user=user)
                if active_session.status != 'COMPLETED':
                    UserAnswer.objects.update_or_create(
                        session=active_session,
                        question=question,
                        defaults={
                            'selected_answer': selected_answer,
                            'is_correct': is_correct,
                            'time_spent_seconds': time_spent,
                            'feedback_shown': True,
                            'feedback_viewed_at': timezone.now()
                        }
                    )
                    correct_count = UserAnswer.objects.filter(session=active_session, is_correct=True).count()
                    wrong_count = UserAnswer.objects.filter(session=active_session, is_correct=False).count()
                    active_session.answered_questions = correct_count + wrong_count
                    active_session.correct_answers = correct_count
                    active_session.wrong_answers = wrong_count
                    active_session.time_spent_seconds = (active_session.time_spent_seconds or 0) + time_spent
                    if active_session.total_questions > 0:
                        active_session.percentage = (correct_count / active_session.total_questions) * 100
                    active_session.save()
            except PracticeSession.DoesNotExist:
                pass
            except Exception:
                pass
        
        # Admin bypass
        if is_admin(user):
            return Response({
                'is_correct': is_correct,
                'correct_answer': question.get_correct_answer_display() if question.question_type == 'OBJECTIVE' else question.model_answer,
                'explanation': question.explanation,
                'admin_bypass': True,
                'message': 'Admin access: No trial limits'
            })
        
        # ============================================================
        # UPDATED: Check both paid plan AND bank subscription
        # ============================================================
        has_full_access = _get_user_full_access(user)
        # ============================================================
        
        if has_full_access:
            return Response({
                'is_correct': is_correct,
                'correct_answer': question.get_correct_answer_display() if question.question_type == 'OBJECTIVE' else question.model_answer,
                'explanation': question.explanation,
                'message': 'Answer submitted successfully',
                'has_full_access': True
            })
        
        # Track trial usage
        trial, created = FreeTrialUsage.objects.get_or_create(
            user=user,
            subject=question_bank.subject,
            defaults={'questions_answered': 0}
        )
        
        if trial.questions_answered >= question_bank.free_trial_questions:
            return Response(
                {
                    'error': 'Free trial limit reached. Please upgrade to continue.',
                    'is_correct': is_correct,
                    'correct_answer': question.get_correct_answer_display() if question.question_type == 'OBJECTIVE' else question.model_answer,
                    'explanation': question.explanation,
                    'upgrade_prompt': {
                        'message': f"You've completed all {question_bank.free_trial_questions} free questions!",
                        'upgrade_url': "/api/payments/initialize/"
                    }
                },
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        
        trial.questions_answered += 1
        trial.save()
        
        response_data = {
            'is_correct': is_correct,
            'correct_answer': question.get_correct_answer_display() if question.question_type == 'OBJECTIVE' else question.model_answer,
            'explanation': question.explanation,
            'trial_remaining': question_bank.free_trial_questions - trial.questions_answered,
            'trial_total': question_bank.free_trial_questions
        }
        
        if trial.questions_answered >= question_bank.free_trial_questions:
            response_data['upgrade_prompt'] = {
                'message': "Congratulations! You've completed all free questions. Upgrade to access the full question bank!",
                'upgrade_url': "/api/payments/initialize/"
            }
        
        return Response(response_data)


class FreeTrialViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        if is_admin(request.user):
            return Response([{
                'subject': 'Admin Access',
                'subject_id': 0,
                'questions_answered': 0,
                'total_free': 999999,
                'remaining': 999999,
                'has_upgraded': True,
                'bank_id': 0,
                'bank_name': 'Admin Unlimited Access',
                'admin_bypass': True
            }])
        
        # Check for full access
        if _get_user_full_access(request.user):
            subjects = Subject.objects.filter(is_active=True)
            data = []
            for subject in subjects:
                data.append({
                    'subject': subject.name,
                    'subject_id': subject.id,
                    'questions_answered': 0,
                    'total_free': 'unlimited',
                    'remaining': 'unlimited',
                    'has_upgraded': True,
                    'bank_id': 0,
                    'bank_name': 'Full Access',
                    'is_premium': True
                })
            return Response(data)
        
        trials = FreeTrialUsage.objects.filter(user=request.user).select_related('subject')
        data = []
        for trial in trials:
            banks = QuestionBank.objects.filter(subject=trial.subject, has_free_trial=True)
            for bank in banks:
                data.append({
                    'subject': trial.subject.name,
                    'subject_id': trial.subject.id,
                    'questions_answered': trial.questions_answered,
                    'total_free': bank.free_trial_questions,
                    'remaining': max(0, bank.free_trial_questions - trial.questions_answered),
                    'has_upgraded': trial.has_upgraded,
                    'bank_id': bank.id,
                    'bank_name': bank.name
                })
        return Response(data)
    
    @action(detail=True, methods=['get'])
    def subject_status(self, request, pk=None):
        if is_admin(request.user):
            return Response({
                'subject': 'Admin Access',
                'total_questions_answered': 0,
                'total_remaining': 999999,
                'banks': [{
                    'bank_id': 0,
                    'bank_name': 'Admin Unlimited Access',
                    'questions_answered': 0,
                    'total_free': 999999,
                    'remaining': 999999
                }],
                'has_upgraded': True,
                'admin_bypass': True
            })
        
        try:
            subject = Subject.objects.get(id=pk)
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if _get_user_full_access(request.user):
            banks = QuestionBank.objects.filter(subject=subject)
            bank_data = []
            for bank in banks:
                bank_data.append({
                    'bank_id': bank.id,
                    'bank_name': bank.name,
                    'questions_answered': 0,
                    'total_free': 'unlimited',
                    'remaining': 'unlimited'
                })
            return Response({
                'subject': subject.name,
                'total_questions_answered': 0,
                'total_remaining': 'unlimited',
                'banks': bank_data,
                'has_upgraded': True
            })
        
        trial, created = FreeTrialUsage.objects.get_or_create(
            user=request.user,
            subject=subject
        )
        banks = QuestionBank.objects.filter(subject=subject, has_free_trial=True)
        bank_data = []
        total_remaining = 0
        for bank in banks:
            remaining = max(0, bank.free_trial_questions - trial.questions_answered)
            total_remaining += remaining
            bank_data.append({
                'bank_id': bank.id,
                'bank_name': bank.name,
                'questions_answered': trial.questions_answered,
                'total_free': bank.free_trial_questions,
                'remaining': remaining
            })
        
        return Response({
            'subject': subject.name,
            'total_questions_answered': trial.questions_answered,
            'total_remaining': total_remaining,
            'banks': bank_data,
            'has_upgraded': trial.has_upgraded
        })


class PracticeSessionViewSet(viewsets.ModelViewSet):
    serializer_class = PracticeSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return PracticeSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        question_bank_id = self.request.data.get('question_bank')
        question_bank = QuestionBank.objects.get(id=question_bank_id)
        questions = list(question_bank.questions.all())
        random.shuffle(questions)
        questions_order = [q.id for q in questions]
        serializer.save(
            user=self.request.user,
            total_questions=len(questions),
            questions_order=questions_order
        )

    @action(detail=True, methods=['post'])
    def check_answer(self, request, pk=None):
        session = self.get_object()
        
        if request.user.is_authenticated and session.user != request.user:
            return Response(
                {'error': 'You do not have permission to answer this session'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not request.user.is_authenticated:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token_key = auth_header[7:]
                from rest_framework.authtoken.models import Token
                try:
                    token = Token.objects.get(key=token_key)
                    if session.user != token.user:
                        return Response(
                            {'error': 'You do not have permission to answer this session'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except Token.DoesNotExist:
                    return Response(
                        {'error': 'Invalid authentication'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            else:
                return Response(
                    {'error': 'Please login to check answers'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        question_id = request.data.get('question_id')
        selected_answer = request.data.get('selected_answer')
        time_spent = request.data.get('time_spent_seconds', 0)
        
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)
        
        current_question = session.get_next_question()
        if not current_question or current_question.id != question.id:
            return Response(
                {'error': 'This is not the current question'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_correct = False
        points_earned = 0
        if question.question_type == 'OBJECTIVE':
            is_correct = (question.correct_answer.upper() == selected_answer.upper())
            if is_correct:
                points_earned = 25
        
        answer, created = UserAnswer.objects.update_or_create(
            session=session,
            question=question,
            defaults={
                'selected_answer': selected_answer,
                'is_correct': is_correct,
                'time_spent_seconds': time_spent,
                'feedback_shown': True,
                'feedback_viewed_at': timezone.now()
            }
        )
        
        if is_correct:
            try:
                profile = request.user.profile
                profile.total_points = (profile.total_points or 0) + points_earned
                profile.total_questions_answered = (profile.total_questions_answered or 0) + 1
                profile.save()
            except Exception:
                pass
        
        correct_count = UserAnswer.objects.filter(session=session, is_correct=True).count()
        wrong_count = UserAnswer.objects.filter(session=session, is_correct=False).count()
        
        session.answered_questions = correct_count + wrong_count
        session.correct_answers = correct_count
        session.wrong_answers = wrong_count
        session.time_spent_seconds = (session.time_spent_seconds or 0) + time_spent
        
        if session.total_questions > 0 and (correct_count + wrong_count) > 0:
            session.percentage = (correct_count / session.total_questions) * 100
        else:
            session.percentage = 0
        
        session.save()
        
        response_data = {
            'is_correct': is_correct,
            'correct_option': question.correct_answer if question.question_type == 'OBJECTIVE' else None,
            'correct_answer': question.get_correct_answer_display() if question.question_type == 'OBJECTIVE' else question.model_answer,
            'explanation': question.explanation,
            'points_earned': points_earned,
            'next_question_available': session.current_question_index < len(session.questions_order) - 1,
            'question_id': question.id,
            'reference': question.reference,
            'question_type': question.question_type,
            'session_stats': {
                'correct': session.correct_answers,
                'wrong': session.wrong_answers,
                'answered': session.answered_questions,
                'percentage': session.percentage
            }
        }
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def next_question(self, request, pk=None):
        session = self.get_object()
        
        if session.status == 'COMPLETED':
            return Response({
                'status': 'completed',
                'session': {
                    'id': session.id,
                    'status': session.status,
                    'total_questions': session.total_questions,
                    'correct_answers': session.correct_answers,
                    'wrong_answers': session.wrong_answers,
                    'answered_questions': session.answered_questions,
                    'percentage': session.percentage,
                    'time_spent_seconds': session.time_spent_seconds,
                    'question_bank_name': session.question_bank.name,
                },
                'total_questions': session.total_questions,
                'correct': session.correct_answers,
                'wrong': session.wrong_answers,
                'skipped': session.total_questions - session.answered_questions,
                'answered': session.answered_questions,
                'percentage': session.percentage,
                'time_spent_seconds': session.time_spent_seconds
            }, status=status.HTTP_200_OK)
        
        is_trial = request.data.get('is_trial', False)
        current_question = session.get_next_question()
        
        if current_question and not is_trial:
            answer_exists = UserAnswer.objects.filter(session=session, question=current_question).exists()
            if not answer_exists:
                return Response(
                    {'error': 'Please answer the current question first'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if session.current_question_index < len(session.questions_order) - 1:
            session.current_question_index += 1
            session.save()
            next_question = session.get_next_question()
            serializer = QuestionWithExplanationSerializer(next_question, context={'request': request})
            return Response({
                'status': 'moving to next question',
                'question': serializer.data,
                'question_index': session.current_question_index,
                'total_questions': len(session.questions_order)
            })
        else:
            return self.complete_session(request, pk)

    @action(detail=True, methods=['get'])
    def current_question(self, request, pk=None):
        session = self.get_object()
        if session.status == 'COMPLETED':
            return Response({'error': 'Session already completed'}, status=status.HTTP_400_BAD_REQUEST)
        question = session.get_next_question()
        if not question:
            return Response({'error': 'No more questions'}, status=status.HTTP_404_NOT_FOUND)
        answer = UserAnswer.objects.filter(session=session, question=question).first()
        response_data = {
            'question': QuestionWithExplanationSerializer(question, context={'request': request}).data,
            'question_index': session.current_question_index,
            'total_questions': len(session.questions_order),
            'has_been_answered': answer is not None,
            'previous_answer': answer.selected_answer if answer else None,
            'was_correct': answer.is_correct if answer else None,
        }
        return Response(response_data)
    
    @action(detail=True, methods=['post'])
    def skip_question(self, request, pk=None):
        session = self.get_object()
        if session.status == 'COMPLETED':
            return Response({'error': 'Session already completed'}, status=status.HTTP_400_BAD_REQUEST)
        current_question = session.get_next_question()
        if current_question:
            UserAnswer.objects.create(
                session=session,
                question=current_question,
                selected_answer='SKIPPED',
                is_correct=None,
                feedback_shown=False
            )
        has_next = session.move_to_next_question()
        return Response({
            'status': 'question skipped',
            'has_next': has_next,
            'next_question_available': has_next
        })
    
    @action(detail=True, methods=['get'])
    def review_wrong_answers(self, request, pk=None):
        session = self.get_object()
        wrong_answers = session.answers.filter(is_correct=False).select_related('question')
        review_data = []
        for answer in wrong_answers:
            review_data.append({
                'question': QuestionWithExplanationSerializer(answer.question, context={'request': request}).data,
                'user_answer': answer.selected_answer,
                'correct_answer': answer.question.get_correct_answer_display(),
                'explanation': answer.question.explanation,
                'answered_at': answer.answered_at
            })
        return Response({'total_wrong': len(review_data), 'questions': review_data})

    @action(detail=True, methods=['post'])
    def complete_session(self, request, pk=None):
        session = self.get_object()
        
        for question_id in session.questions_order:
            if not UserAnswer.objects.filter(session=session, question_id=question_id).exists():
                try:
                    question = Question.objects.get(id=question_id)
                    UserAnswer.objects.create(
                        session=session,
                        question=question,
                        selected_answer='NOT_ANSWERED',
                        is_correct=None,
                        feedback_shown=False
                    )
                except Question.DoesNotExist:
                    continue
        
        all_answers = UserAnswer.objects.filter(session=session)
        correct_count = all_answers.filter(is_correct=True).count()
        wrong_count = all_answers.filter(is_correct=False).count()
        answered_count = correct_count + wrong_count
        
        session.status = 'COMPLETED'
        session.answered_questions = answered_count
        session.correct_answers = correct_count
        session.wrong_answers = wrong_count
        session.completed_at = timezone.now()
        session.is_submitted = True
        
        if session.total_questions > 0:
            session.percentage = (correct_count / session.total_questions) * 100
            session.score = correct_count
        else:
            session.percentage = 0.0
            session.score = 0
        
        session.save()
        
        try:
            ExamResult.objects.get_or_create(
                session=session,
                defaults={'time_taken': str(session.time_spent_seconds // 60) + ' minutes'}
            )
        except Exception:
            pass
        
        try:
            update_user_performance(request.user, session)
        except Exception:
            pass
        
        if session.session_type == 'EXAM':
            try:
                send_result_email(request.user, session)
            except Exception:
                pass
        
        response_data = {
            'session': {
                'id': session.id,
                'status': session.status,
                'total_questions': session.total_questions,
                'correct_answers': session.correct_answers,
                'wrong_answers': session.wrong_answers,
                'answered_questions': session.answered_questions,
                'percentage': session.percentage,
                'time_spent_seconds': session.time_spent_seconds,
                'question_bank_name': session.question_bank.name,
            },
            'total_questions': session.total_questions,
            'correct': session.correct_answers,
            'wrong': session.wrong_answers,
            'skipped': session.total_questions - answered_count,
            'answered': answered_count,
            'percentage': session.percentage,
            'time_spent_seconds': session.time_spent_seconds
        }
        return Response(response_data, status=status.HTTP_200_OK)


def update_user_performance(user, session):
    performance, created = UserPerformance.objects.get_or_create(
        user=user,
        subject=session.question_bank.subject,
        exam_category=session.question_bank.exam_category,
        defaults={
            'total_practices': 0,
            'total_questions_attempted': 0,
            'total_correct': 0
        }
    )
    performance.total_practices += 1
    performance.total_questions_attempted += session.total_questions
    performance.total_correct += session.correct_answers
    performance.average_score = (performance.total_correct / performance.total_questions_attempted) * 100 if performance.total_questions_attempted > 0 else 0
    if session.percentage > performance.best_score:
        performance.best_score = session.percentage
    performance.last_practiced = timezone.now()
    performance.total_time_spent_minutes += session.time_spent_seconds // 60
    performance.save()


def send_result_email(user, session):
    subject = f"Your {session.question_bank.name} Exam Results"
    message = f"""
    Dear {user.username},
    
    Thank you for completing the {session.question_bank.name} exam.
    
    Your Results:
    - Score: {session.score}/{session.total_questions}
    - Percentage: {session.percentage:.2f}%
    - Correct Answers: {session.correct_answers}
    - Wrong Answers: {session.wrong_answers}
    - Time Spent: {session.time_spent_seconds // 60} minutes
    
    Keep practicing to improve your score!
    
    Best regards,
    Your Exam Platform Team
    """
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        if hasattr(session, 'exam_result'):
            session.exam_result.email_sent = True
            session.exam_result.email_sent_at = timezone.now()
            session.exam_result.save()
    except Exception:
        pass


class UserPerformanceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserPerformanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserPerformance.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        performances = self.get_queryset()
        total_exams = PracticeSession.objects.filter(user=request.user).count()
        completed_exams = PracticeSession.objects.filter(user=request.user, status='COMPLETED').count()
        avg_score = performances.aggregate(Avg('average_score'))['average_score__avg'] or 0
        recent_sessions = PracticeSession.objects.filter(
            user=request.user, status='COMPLETED'
        ).order_by('-completed_at')[:5]
        recent_data = []
        for session in recent_sessions:
            recent_data.append({
                'date': session.completed_at,
                'exam': session.question_bank.name,
                'score': session.score,
                'percentage': session.percentage
            })
        return Response({
            'total_exams_taken': total_exams,
            'completed_exams': completed_exams,
            'average_score': round(avg_score, 2),
            'subject_performance': UserPerformanceSerializer(performances, many=True).data,
            'recent_activities': recent_data
        })


class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.ModelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        from .serializers import QuestionSerializer
        if self.action == 'list':
            return serializers.ModelSerializer
        return super().get_serializer_class()
    
    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def questions(self, request):
        bookmarks = self.get_queryset().select_related('question')
        questions = [b.question for b in bookmarks]
        serializer = QuestionSerializer(questions, many=True, context={'request': request})
        return Response(serializer.data)


# ============================================================
# CSRF, AUTH, AND PROFILE ENDPOINTS
# ============================================================
@ensure_csrf_cookie
@require_http_methods(["GET"])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token, 'success': True})


@rate_limit('login', limit=10, period_seconds=300)
def api_login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            UserActivity.objects.create(user=user, activity_type='LOGIN', description='User logged in via API')
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id, 'username': user.username, 'email': user.email,
                    'first_name': user.first_name, 'last_name': user.last_name,
                    'is_premium': user.profile.is_premium or is_admin(user)
                }
            })
        else:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'}, status=400)


@login_required
def api_logout(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'success': True})


@login_required
def api_auth_status(request):
    return JsonResponse({
        'is_authenticated': True,
        'user': {
            'id': request.user.id, 'username': request.user.username,
            'email': request.user.email, 'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'is_premium': request.user.profile.is_premium or is_admin(request.user)
        }
    })


# Was @admin_or_premium_required — same bug as api_user_stats below: this
# returns only request.user's own profile, so paywalling it locked free
# users out of their own account details. Note the payload even includes
# `is_premium`, which a non-premium user could never read while gated.
# (api_update_profile immediately below is correctly @login_required.)
@admin_or_login_required
def api_get_profile(request):
    profile = request.user.profile
    return JsonResponse({
        'user': {
            'id': request.user.id, 'username': request.user.username,
            'email': request.user.email, 'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        },
        'phone_number': profile.phone_number, 'location': profile.location,
        'bio': profile.bio, 'preferred_exam_type': profile.preferred_exam_type,
        'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
        'is_premium': profile.is_premium or is_admin(request.user),
        'total_practices': profile.total_practices,
        'total_questions': profile.total_questions_answered,
        'average_score': profile.average_score
    })


@login_required
def api_update_profile(request):
    if request.method == 'PUT' or request.method == 'POST':
        user = request.user
        profile = user.profile
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.email = request.POST.get('email', user.email)
        user.save()
        profile.phone_number = request.POST.get('phone_number', profile.phone_number)
        profile.location = request.POST.get('location', profile.location)
        profile.bio = request.POST.get('bio', profile.bio)
        profile.preferred_exam_type = request.POST.get('preferred_exam_type', profile.preferred_exam_type)
        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id, 'username': user.username, 'email': user.email,
                'first_name': user.first_name, 'last_name': user.last_name,
            }
        })


# Was @admin_or_premium_required, which returned HTTP 402 to any user
# without a subscription — so every newly-registered user hit a broken
# dashboard immediately after verifying their email. Every query below is
# scoped to request.user: this is the caller's own practice history, plus
# their free-trial usage, which by definition matters most to people who
# have NOT paid. Own-account data is not premium content.
@admin_or_login_required
def api_user_stats(request):
    completed_sessions = PracticeSession.objects.filter(
        user=request.user,
        status='COMPLETED'
    )

    total_sessions = PracticeSession.objects.filter(
        user=request.user
    ).count()

    completed_count = completed_sessions.count()

    total_questions = (
        completed_sessions.aggregate(
            total=Sum('total_questions')
        )['total'] or 0
    )

    average_score = (
        completed_sessions.aggregate(
            avg=Avg('percentage')
        )['avg'] or 0
    )

    recent_sessions = completed_sessions.order_by(
        '-completed_at'
    )[:5]

    recent_data = []

    for session in recent_sessions:
        recent_data.append({
            'id': session.id,
            'question_bank_name': session.question_bank.name,
            'percentage': session.percentage,
            'score': float(session.score),
            'completed_at': session.completed_at,
            'correct_answers': session.correct_answers,
            'wrong_answers': session.wrong_answers,
        })

    trials = FreeTrialUsage.objects.filter(
        user=request.user
    ).select_related('subject')

    trial_data = []

    for trial in trials:
        trial_data.append({
            'subject': trial.subject.name,
            'questions_answered': trial.questions_answered,
            'remaining': max(0, 5 - trial.questions_answered),
            'total_free': 5
        })

    return JsonResponse({
        'stats': {
            'totalSessions': total_sessions,
            'completedSessions': completed_count,
            'totalQuestions': total_questions,
            'averageScore': round(float(average_score), 1),
        },
        'recentSessions': recent_data,
        'freeTrials': trial_data
    })


@auto_set_admin_premium
@admin_or_premium_required
def get_questions_from_bank(request, bank_id):
    try:
        question_bank = QuestionBank.objects.get(id=bank_id, is_active=True)
    except QuestionBank.DoesNotExist:
        return JsonResponse({'error': 'Question bank not found'}, status=404)
    
    questions = question_bank.questions.filter(is_published=True)
    randomize = request.GET.get('randomize', 'false').lower() == 'true'
    if randomize:
        questions = list(questions)
        random.shuffle(questions)
    limit = request.GET.get('limit')
    if limit:
        try:
            limit = int(limit)
            questions = questions[:limit]
        except ValueError:
            return JsonResponse({'error': 'Invalid limit parameter'}, status=400)
    
    subscription_info = None
    if not is_admin(request.user):
        has_subscription = _get_user_full_access(request.user)
        subscription_info = {
            'has_active_subscription': has_subscription,
            'is_free': question_bank.is_free,
            'has_free_trial': question_bank.has_free_trial
        }
    
    serializer = QuestionSerializer(questions, many=True)
    response_data = {
        'questions': serializer.data,
        'total': len(questions),
        'question_bank': {
            'id': question_bank.id, 'name': question_bank.name,
            'subject': question_bank.subject.name,
            'exam_category': question_bank.exam_category.display_name if question_bank.exam_category else None,
            'exam_year': question_bank.exam_year.year if question_bank.exam_year else None,
            'total_marks': question_bank.total_marks,
            'duration_minutes': question_bank.duration_minutes
        },
        'admin_access': is_admin(request.user)
    }
    if subscription_info:
        response_data['subscription'] = subscription_info
    return JsonResponse(response_data)


# Add these view classes and endpoints at the end of exams/views.py (before the bulk upload section)

# ============================================================
# STUDY NOTES VIEWS
# ============================================================
class StudyNotesViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for study notes"""
    serializer_class = StudyNotesSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = StudyNotes.objects.filter(is_active=True)
        subject_id = self.request.query_params.get('subject_id')
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        return queryset
    
    @action(detail=False, methods=['get'], url_path='by-subject/(?P<subject_id>[^/.]+)')
    def by_subject(self, request, subject_id=None):
        """Get study notes for a specific subject"""
        try:
            subject = Subject.objects.get(id=subject_id, is_active=True)
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)
        
        notes = StudyNotes.objects.filter(subject=subject, is_active=True)
        
        if not notes.exists():
            # Return empty structure if no notes exist
            return Response({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'topics': [],
                'formulas': [],
                'content': '',
                'references': [],
                'message': 'Study notes for this subject are coming soon!'
            })
        
        # Combine all notes for the subject
        combined_data = {
            'subject_id': subject.id,
            'subject_name': subject.name,
            'topics': [],
            'formulas': [],
            'content': '',
            'references': [],
            'notes_count': notes.count()
        }
        
        for note in notes:
            if note.topics:
                combined_data['topics'].extend(note.topics if isinstance(note.topics, list) else [])
            if note.formulas:
                combined_data['formulas'].extend(note.formulas if isinstance(note.formulas, list) else [])
            if note.content:
                combined_data['content'] += ('' if not combined_data['content'] else '\n\n') + note.content
            if note.references:
                combined_data['references'].extend(note.references if isinstance(note.references, list) else [])
        
        return Response(combined_data)


# ============================================================
# PAST QUESTIONS VIEWS
# ============================================================
class PastQuestionsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for past questions"""
    serializer_class = PastQuestionCollectionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = PastQuestionCollection.objects.filter(is_active=True)
        subject_id = self.request.query_params.get('subject_id')
        exam_category = self.request.query_params.get('exam_category')
        
        if subject_id:
            queryset = queryset.filter(subject_id=subject_id)
        if exam_category:
            queryset = queryset.filter(exam_category__name=exam_category)
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='by-subject/(?P<subject_id>[^/.]+)')
    def by_subject(self, request, subject_id=None):
        """Get past questions for a specific subject"""
        try:
            subject = Subject.objects.get(id=subject_id, is_active=True)
        except Subject.DoesNotExist:
            return Response({'error': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)
        
        exam_category_param = request.query_params.get('exam_category')
        
        # Get past question collections for this subject
        collections = PastQuestionCollection.objects.filter(
            subject=subject, 
            is_active=True
        )
        
        if exam_category_param:
            collections = collections.filter(exam_category__name=exam_category_param)
        
        # If no collections exist, get questions directly
        if not collections.exists():
            questions = Question.objects.filter(
                subject=subject,
                is_published=True,
                question_type='OBJECTIVE'
            )
            
            if exam_category_param:
                questions = questions.filter(exam_category__name=exam_category_param)
            
            questions = questions.order_by('-exam_year__year')[:50]  # Limit to 50 questions
            
            serializer = PastQuestionSerializer(questions, many=True)
            
            # Get available years
            years = list(set(
                questions.exclude(exam_year__isnull=True)
                .values_list('exam_year__year', flat=True)
            ))
            years.sort(reverse=True)
            
            return Response({
                'subject_id': subject.id,
                'subject_name': subject.name,
                'questions': serializer.data,
                'total_questions': questions.count(),
                'available_years': years
            })
        
        # Combine questions from all collections
        all_questions = []
        for collection in collections:
            questions = collection.questions.filter(is_published=True)
            all_questions.extend(questions)
        
        # Remove duplicates
        unique_questions = list({q.id: q for q in all_questions}.values())
        unique_questions.sort(key=lambda q: q.exam_year.year if q.exam_year else 0, reverse=True)
        
        serializer = PastQuestionSerializer(unique_questions[:50], many=True)
        
        # Get available years
        years = list(set(
            q.exam_year.year for q in unique_questions if q.exam_year
        ))
        years.sort(reverse=True)
        
        return Response({
            'subject_id': subject.id,
            'subject_name': subject.name,
            'questions': serializer.data,
            'total_questions': len(unique_questions),
            'available_years': years,
            'collections_count': collections.count()
        })
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get questions from a specific past question collection"""
        collection = self.get_object()
        questions = collection.questions.filter(is_published=True)
        
        year = request.query_params.get('year')
        if year:
            questions = questions.filter(exam_year__year=year)
        
        serializer = PastQuestionSerializer(questions, many=True)
        return Response({
            'collection': PastQuestionCollectionSerializer(collection).data,
            'questions': serializer.data,
            'total_questions': questions.count()
        })


# ============================================================
# SIMPLE FUNCTION-BASED VIEWS FOR STUDY NOTES AND PAST QUESTIONS
# (These are the endpoints called by the frontend)
# ============================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def get_study_notes(request, subject_id):
    """Get study notes for a subject"""
    try:
        subject = Subject.objects.get(id=subject_id, is_active=True)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)
    
    notes = StudyNotes.objects.filter(subject=subject, is_active=True)
    
    if not notes.exists():
        return Response({
            'subject_id': subject.id,
            'subject_name': subject.name,
            'topics': [],
            'formulas': [],
            'content': '',
            'references': [],
            'message': 'Study notes for this subject are coming soon!'
        })
    
    # Combine all notes
    combined_topics = []
    combined_formulas = []
    combined_content = ''
    combined_references = []
    
    for note in notes:
        if note.topics:
            if isinstance(note.topics, list):
                combined_topics.extend(note.topics)
        if note.formulas:
            if isinstance(note.formulas, list):
                combined_formulas.extend(note.formulas)
        if note.content:
            combined_content += ('\n\n' if combined_content else '') + note.content
        if note.references:
            if isinstance(note.references, list):
                combined_references.extend(note.references)
    
    return Response({
        'subject_id': subject.id,
        'subject_name': subject.name,
        'topics': combined_topics,
        'formulas': combined_formulas,
        'content': combined_content,
        'references': combined_references,
        'notes_count': notes.count()
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def get_past_questions(request, subject_id):
    """Get past questions for a subject"""
    try:
        subject = Subject.objects.get(id=subject_id, is_active=True)
    except Subject.DoesNotExist:
        return Response({'error': 'Subject not found'}, status=status.HTTP_404_NOT_FOUND)

    exam_category_param = request.query_params.get('exam_category')

    # Resolve whatever form the frontend sent (URL slug like 'waec', numeric
    # id, name, or display_name) into an actual ExamCategory. The old code
    # filtered with exam_category__name__iexact=<param>, which silently
    # matched nothing for slugs such as 'waec' (real name 'WASSCE'), 'jamb'
    # ('UTME') and 'jssce' ('JSS') - the direct cause of past questions not
    # showing even though they existed in the DB. If the param is present but
    # unresolvable we leave exam_category as None (no category filter) rather
    # than forcing an empty result set.
    from .category_utils import resolve_exam_category
    exam_category = resolve_exam_category(exam_category_param) if exam_category_param else None

    # Get past question collections
    collections = PastQuestionCollection.objects.filter(
        subject=subject,
        is_active=True
    )

    if exam_category:
        collections = collections.filter(exam_category=exam_category)

    all_questions = []
    if collections.exists():
        for collection in collections:
            questions = collection.questions.filter(is_published=True)
            all_questions.extend(questions)

    # Fall back to direct questions if no collection questions were found.
    if not all_questions:
        questions = Question.objects.filter(
            subject=subject,
            is_published=True,
            question_type='OBJECTIVE'
        )

        if exam_category:
            questions = questions.filter(exam_category=exam_category)

        questions = list(
            questions.select_related('exam_year', 'subject', 'exam_category')
            .order_by('-exam_year__year')[:50]
        )
    else:
        # Deduplicate collection questions. Note `questions` is now a plain
        # list, so ordering must use sorted()/list.sort() - calling the
        # queryset method .order_by() on it (as an earlier version did) would
        # raise AttributeError.
        unique_questions = list({q.id: q for q in all_questions}.values())
        unique_questions.sort(
            key=lambda q: q.exam_year.year if q.exam_year else 0,
            reverse=True
        )
        questions = unique_questions[:50]

    serializer = PastQuestionSerializer(questions, many=True)

    years = sorted(
        {q.exam_year.year for q in questions if q.exam_year},
        reverse=True
    )

    return Response({
        'subject_id': subject.id,
        'subject_name': subject.name,
        'questions': serializer.data,
        'total_questions': len(questions),
        'available_years': years
    })


# ============================================================
# BULK UPLOAD AND AUTO-CREATE ENDPOINTS
# ============================================================
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def bulk_upload_questions_api(request):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided', 'success': False}, status=status.HTTP_400_BAD_REQUEST)
    excel_file = request.FILES['file']
    if not excel_file.name.endswith(('.xlsx', '.xls')):
        return Response({'error': 'Invalid file format', 'success': False}, status=status.HTTP_400_BAD_REQUEST)
    if excel_file.size > 10 * 1024 * 1024:
        return Response({'error': 'File too large. Maximum size is 10MB', 'success': False}, status=status.HTTP_400_BAD_REQUEST)
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp_file:
            for chunk in excel_file.chunks():
                tmp_file.write(chunk)
            temp_file_path = tmp_file.name
        options = {'create_question_banks': request.data.get('create_question_banks', False)}
        results = process_excel_upload(temp_file_path, request.user, options)
        return Response({'success': True, **results})
    except Exception as e:
        import traceback
        return Response({'error': str(e), 'success': False, 'traceback': traceback.format_exc() if settings.DEBUG else None}, status=status.HTTP_400_BAD_REQUEST)
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def auto_create_banks_api(request):
    grouping_strategy = request.data.get('grouping_strategy', 'auto')
    filter_params = request.data.get('filters', {})
    valid_strategies = ['auto', 'exam_category', 'subject', 'exam_year', 'exam_category_subject_year']
    if grouping_strategy not in valid_strategies:
        return Response({'error': f'Invalid grouping strategy', 'success': False}, status=status.HTTP_400_BAD_REQUEST)
    question_ids = None
    try:
        if filter_params.get('exam_category'):
            question_ids = Question.objects.filter(exam_category_id=filter_params['exam_category'], is_published=True).values_list('id', flat=True)
        elif filter_params.get('subject'):
            question_ids = Question.objects.filter(subject_id=filter_params['subject'], is_published=True).values_list('id', flat=True)
        elif filter_params.get('exam_year'):
            question_ids = Question.objects.filter(exam_year_id=filter_params['exam_year'], is_published=True).values_list('id', flat=True)
        elif filter_params.get('unassigned_only'):
            assigned_question_ids = QuestionBank.questions.through.objects.values_list('question_id', flat=True).distinct()
            question_ids = Question.objects.filter(is_published=True).exclude(id__in=assigned_question_ids).values_list('id', flat=True)
        question_id_list = list(question_ids) if question_ids is not None else None
        if question_id_list is not None and len(question_id_list) == 0:
            return Response({'success': True, 'banks_created': 0, 'banks': [], 'message': 'No questions found'})
        results = auto_create_question_banks(question_ids=question_id_list, grouping_strategy=grouping_strategy)
        return Response({'success': True, 'banks_created': len(results), 'banks': results, 'message': f'Successfully created/updated {len(results)} question banks'})
    except Exception as e:
        import traceback
        return Response({'error': str(e), 'success': False, 'traceback': traceback.format_exc() if settings.DEBUG else None}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, permissions.IsAdminUser])
def download_template_api(request):
    try:
        import pandas as pd
        from io import BytesIO
        from django.http import HttpResponse
        df = generate_bulk_upload_template()
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Questions', index=False)
            instructions_data = {
                'Field': ['question_text', 'subject', 'exam_category', 'question_type', 'difficulty', 'marks', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'correct_answer', 'model_answer', 'marking_guide', 'explanation', 'reference', 'exam_year', 'time_limit_seconds'],
                'Required': ['YES', 'YES', 'YES', 'YES', 'YES', 'No', 'For OBJECTIVE', 'For OBJECTIVE', 'For OBJECTIVE', 'For OBJECTIVE', 'For OBJECTIVE', 'For OBJECTIVE', 'For THEORY', 'For THEORY', 'No', 'No', 'No', 'No'],
                'Example': ['What is the capital of France?', 'Geography', 'WAEC', 'OBJECTIVE', 'EASY', '5', 'Paris', 'London', 'Berlin', 'Madrid', 'Rome', 'A', '', '', 'Paris is the capital of France', 'World Geography Textbook', '2023', '120']
            }
            instructions_df = pd.DataFrame(instructions_data)
            instructions_df.to_excel(writer, sheet_name='Instructions', index=False)
        output.seek(0)
        response = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="bulk_question_template.xlsx"'
        return response
    except Exception as e:
        return Response({'error': f'Error generating template: {str(e)}', 'success': False}, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# TRIAL STATUS AND ACCESS CHECK ENDPOINTS
# ============================================================
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def trial_status_api(request):
    """Get comprehensive trial and subscription status"""
    has_full_access = _get_user_full_access(request.user) or is_admin(request.user)
    
    if has_full_access:
        subjects = Subject.objects.filter(is_active=True)
        trial_data = []
        for subject in subjects:
            trial_data.append({
                'subject': subject.name,
                'subject_id': subject.id,
                'questions_answered': 0,
                'total_free': 'unlimited',
                'remaining': 'unlimited',
                'has_upgraded': True,
                'bank_id': 0,
                'bank_name': 'Full Access',
                'is_premium': True
            })
    else:
        trials = FreeTrialUsage.objects.filter(user=request.user).select_related('subject')
        trial_data = []
        for trial in trials:
            banks = QuestionBank.objects.filter(subject=trial.subject, has_free_trial=True)
            for bank in banks:
                trial_data.append({
                    'subject': trial.subject.name,
                    'subject_id': trial.subject.id,
                    'questions_answered': trial.questions_answered,
                    'total_free': bank.free_trial_questions,
                    'remaining': max(0, bank.free_trial_questions - trial.questions_answered),
                    'has_upgraded': trial.has_upgraded,
                    'bank_id': bank.id,
                    'bank_name': bank.name
                })
    
    return Response({
        'success': True,
        'has_full_access': has_full_access,
        'is_premium': hasattr(request.user, 'profile') and request.user.profile.is_premium,
        'is_admin': is_admin(request.user),
        'trials': trial_data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_access_api(request):
    """Check if user can access a specific question bank"""
    bank_id = request.query_params.get('bank_id')
    question_bank = None
    if bank_id:
        try:
            question_bank = QuestionBank.objects.get(id=bank_id, is_active=True)
        except QuestionBank.DoesNotExist:
            return Response({'error': 'Question bank not found'}, status=404)
    
    if is_admin(request.user):
        return Response({
            'success': True,
            'has_access': True,
            'message': 'Admin access',
            'access_data': {'is_admin': True}
        })
    
    has_full_access = _get_user_full_access(request.user)
    
    if has_full_access:
        return Response({
            'success': True,
            'has_access': True,
            'message': 'Full access granted',
            'access_data': {'has_subscription': True}
        })
    
    if question_bank and question_bank.is_free:
        return Response({
            'success': True,
            'has_access': True,
            'message': 'Free content',
            'access_data': {'is_free': True}
        })
    
    if question_bank and question_bank.has_free_trial:
        trial, created = FreeTrialUsage.objects.get_or_create(
            user=request.user,
            subject=question_bank.subject,
            defaults={'questions_answered': 0}
        )
        remaining = question_bank.free_trial_questions - trial.questions_answered
        if remaining > 0:
            return Response({
                'success': True,
                'has_access': True,
                'message': f'{remaining} free trials remaining',
                'access_data': {
                    'is_trial': True,
                    'remaining': remaining,
                    'total': question_bank.free_trial_questions,
                    'used': trial.questions_answered
                }
            })
        else:
            return Response({
                'success': True,
                'has_access': False,
                'message': 'Free trials exhausted',
                'access_data': {
                    'trial_exhausted': True,
                    'requires_payment': True,
                    'upgrade_url': '/api/payments/initialize/'
                }
            })
    
    return Response({
        'success': True,
        'has_access': False,
        'message': 'Subscription required',
        'access_data': {
            'requires_payment': True,
            'upgrade_url': '/api/payments/initialize/'
        }
    })