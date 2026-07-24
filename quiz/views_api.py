from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Category, Question
from .serializers import *
from pasApp.models import Product, Interview
from utils.admin_access import is_admin, admin_or_premium_required, admin_or_login_required
from payments.utils import check_quiz_access
import json
import difflib


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = StandardResultsSetPagination
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get questions for a specific category - with admin bypass"""
        category = self.get_object()
        questions = category.questions.all()
        
        # Admin bypass: Full access without restrictions
        if is_admin(request.user):
            page = self.paginate_queryset(questions)
            if page is not None:
                serializer = QuestionSerializer(page, many=True)
                return self.get_paginated_response({
                    'questions': serializer.data,
                    'admin_bypass': True,
                    'message': 'Admin access: All questions unlocked'
                })
            serializer = QuestionSerializer(questions, many=True)
            return Response({
                'questions': serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: All questions unlocked'
            })
        
        # For non-admin users, check premium access
        has_premium_access = False
        if request.user.is_authenticated:
            if check_quiz_access(request.user)[0]:
                has_premium_access = True
        
        # Limit questions for non-premium users
        if not has_premium_access:
            questions = questions[:10]  # First 10 questions only
        
        page = self.paginate_queryset(questions)
        if page is not None:
            serializer = QuestionSerializer(page, many=True)
            response_data = self.get_paginated_response(serializer.data)
            if not has_premium_access and not is_admin(request.user):
                response_data.data['upgrade_message'] = "Premium subscription required for full access to all quiz questions"
                response_data.data['upgrade_url'] = '/api/payments/plans/'
                response_data.data['limited_access'] = True
            return response_data
        
        serializer = QuestionSerializer(questions, many=True)
        response_data = {'questions': serializer.data}
        if not has_premium_access and not is_admin(request.user):
            response_data['upgrade_message'] = "Premium subscription required for full access to all quiz questions"
            response_data['upgrade_url'] = '/api/payments/plans/'
            response_data['limited_access'] = True
        return Response(response_data)


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['category']
    search_fields = ['question']
    
    def list(self, request, *args, **kwargs):
        """List questions with admin bypass"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Admin bypass: Full access without restrictions
        if is_admin(request.user):
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response({
                    'results': serializer.data,
                    'admin_bypass': True,
                    'message': 'Admin access: All quiz questions unlocked'
                })
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'results': serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: All quiz questions unlocked'
            })
        
        # For non-admin users, check premium access
        has_premium_access = False
        if request.user.is_authenticated:
            if check_quiz_access(request.user)[0]:
                has_premium_access = True
        
        # Limit to first 20 questions for non-premium users
        if not has_premium_access:
            queryset = queryset[:20]
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response_data = self.get_paginated_response(serializer.data)
            if not has_premium_access:
                response_data.data['upgrade_message'] = "Premium subscription required for full quiz access"
                response_data.data['upgrade_url'] = '/api/payments/plans/'
                response_data.data['limited_access'] = True
            return response_data
        
        serializer = self.get_serializer(queryset, many=True)
        response_data = {'results': serializer.data}
        if not has_premium_access:
            response_data['upgrade_message'] = "Premium subscription required for full quiz access"
            response_data['upgrade_url'] = '/api/payments/plans/'
            response_data['limited_access'] = True
        return Response(response_data)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve a single question with admin bypass"""
        instance = self.get_object()
        
        # Admin bypass: Full access without restrictions
        if is_admin(request.user):
            serializer = self.get_serializer(instance)
            return Response({
                **serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: Full question details unlocked'
            })
        
        # For non-admin users, check premium access
        has_premium_access = False
        if request.user.is_authenticated:
            if check_quiz_access(request.user)[0]:
                has_premium_access = True
        
        serializer = self.get_serializer(instance)
        
        # For non-premium users, hide correct answers
        if not has_premium_access:
            data = serializer.data
            data['correct_answers'] = "*** Premium content - Upgrade to see answers ***"
            data['premium_required'] = True
            data['upgrade_message'] = "Subscribe to premium to see the correct answers"
            data['upgrade_url'] = '/api/payments/plans/'
            return Response(data)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def random(self, request):
        """Get random questions - with admin bypass"""
        count = request.query_params.get('count', 10)
        
        try:
            count = int(count)
            if count > 100:
                count = 100
        except ValueError:
            count = 10
        
        questions = Question.objects.all().order_by('?')[:count]
        
        # Admin bypass: Full access without restrictions
        if is_admin(request.user):
            serializer = self.get_serializer(questions, many=True)
            return Response({
                'results': serializer.data,
                'admin_bypass': True,
                'message': f'Admin access: {len(serializer.data)} random questions'
            })
        
        # For non-admin users, check premium access
        has_premium_access = False
        if request.user.is_authenticated:
            if check_quiz_access(request.user)[0]:
                has_premium_access = True
        
        # Limit to 5 random questions for non-premium users
        if not has_premium_access:
            questions = questions[:5]
        
        serializer = self.get_serializer(questions, many=True)
        response_data = {'results': serializer.data}
        
        if not has_premium_access:
            response_data['upgrade_message'] = "Premium subscription required for more random questions"
            response_data['upgrade_url'] = '/api/payments/plans/'
            response_data['limited_access'] = True
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def category_questions(self, request):
        """Get questions by category - with admin bypass"""
        category_id = request.query_params.get('category_id')
        
        if not category_id:
            return Response({'error': 'category_id parameter is required'}, status=400)
        
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=404)
        
        questions = category.questions.all()
        
        # Admin bypass: Full access without restrictions
        if is_admin(request.user):
            serializer = self.get_serializer(questions, many=True)
            return Response({
                'category': category.category_name,
                'questions': serializer.data,
                'total': len(serializer.data),
                'admin_bypass': True
            })
        
        # For non-admin users, check premium access
        has_premium_access = False
        if request.user.is_authenticated:
            if check_quiz_access(request.user)[0]:
                has_premium_access = True
        
        # Limit to 10 questions for non-premium users
        if not has_premium_access:
            questions = questions[:10]
        
        serializer = self.get_serializer(questions, many=True)
        response_data = {
            'category': category.category_name,
            'questions': serializer.data,
            'total': len(serializer.data)
        }
        
        if not has_premium_access and not is_admin(request.user):
            response_data['upgrade_message'] = "Premium subscription required for more questions in this category"
            response_data['upgrade_url'] = '/api/payments/plans/'
            response_data['limited_access'] = True
        
        return Response(response_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_product_questions(request, product_id):
    """Get questions for a specific product/interview - with admin bypass"""
    product = get_object_or_404(Product, id=product_id)
    
    # Admin bypass: Full access without restrictions
    if is_admin(request.user):
        questions = Question.objects.all()[:50]  # Admin can see up to 50 questions
        serializer = QuestionSerializer(questions, many=True)
        return Response({
            'product': {
                'id': product.id,
                'name': product.name,
                'description': product.description
            },
            'questions': serializer.data,
            'total_questions': len(serializer.data),
            'admin_bypass': True,
            'message': 'Admin access: All questions unlocked'
        })
    
    # For non-admin users, check premium access
    has_premium_access = False
    if request.user.is_authenticated:
        if check_quiz_access(request.user)[0]:
            has_premium_access = True
    
    # For non-premium users, limit to 10 questions
    questions = Question.objects.all()
    if not has_premium_access:
        questions = questions[:10]
    
    serializer = QuestionSerializer(questions, many=True)
    response_data = {
        'product': {
            'id': product.id,
            'name': product.name,
            'description': product.description
        },
        'questions': serializer.data,
        'total_questions': len(serializer.data)
    }
    
    if not has_premium_access:
        response_data['upgrade_message'] = "Premium subscription required for more practice questions"
        response_data['upgrade_url'] = '/api/payments/plans/'
        response_data['limited_access'] = True
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_timed_quiz(request):
    """Submit timed quiz answers and calculate score - with admin bypass"""
    data = request.data
    answers = data.get('answers', [])
    time_taken = data.get('time_taken', '0:00')
    product_id = data.get('product_id')
    
    if not answers:
        return Response({'error': 'No answers provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    score = 0
    correct = 0
    wrong = 0
    total = len(answers)
    results = []
    
    # Admin bypass: Admins can see correct answers in results even if they get questions wrong
    is_admin_user = is_admin(request.user)
    
    for answer in answers:
        question_id = answer.get('question_id')
        user_answer = answer.get('user_answer', '').strip()
        
        try:
            question = Question.objects.get(id=question_id)
            is_correct = question.check_answer(user_answer) if user_answer else False
            
            if is_correct:
                score += 10
                correct += 1
            else:
                wrong += 1
            
            result_item = {
                'question_id': question.id,
                'question': question.question,
                'user_answer': user_answer or "No answer provided",
                'is_correct': is_correct
            }
            
            # Admins always see correct answers, non-premium users only see them if they answered correctly
            if is_admin_user:
                result_item['correct_answer'] = question.correct_answers
            elif check_quiz_access(request.user)[0]:
                result_item['correct_answer'] = question.correct_answers
            elif is_correct:
                result_item['correct_answer'] = question.correct_answers
            else:
                result_item['correct_answer'] = "*** Premium content - Upgrade to see correct answers ***"
                result_item['upgrade_hint'] = "Subscribe to premium to see correct answers for questions you got wrong"
            
            results.append(result_item)
        except Question.DoesNotExist:
            continue
    
    percent = (score / (total * 10)) * 100 if total > 0 else 0
    
    response_data = {
        'score': score,
        'total': total,
        'correct': correct,
        'wrong': wrong,
        'percent': round(percent, 2),
        'time_taken': time_taken,
        'answers': results
    }
    
    # Add upgrade prompt for non-premium users who got some questions wrong
    if not is_admin_user and wrong > 0:
        if not check_quiz_access(request.user)[0]:
            response_data['upgrade_prompt'] = {
                'message': f"You got {wrong} question(s) wrong. Upgrade to premium to see the correct answers and improve your skills!",
                'upgrade_url': '/api/payments/plans/'
            }
    
    # Add admin flag
    if is_admin_user:
        response_data['admin_bypass'] = True
        response_data['message'] = 'Admin access: Full quiz results unlocked'
    
    return Response(response_data)


# Admin-only endpoints
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_all_questions(request):
    """Admin-only endpoint to get all quiz questions without restrictions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    questions = Question.objects.all().select_related('category')
    page = request.query_params.get('page', 1)
    page_size = request.query_params.get('page_size', 50)
    
    paginator = StandardResultsSetPagination()
    paginator.page_size = page_size
    result_page = paginator.paginate_queryset(questions, request)
    
    serializer = QuestionAdminSerializer(result_page, many=True)
    return paginator.get_paginated_response({
        'results': serializer.data,
        'admin_bypass': True,
        'total_count': questions.count(),
        'message': 'Admin access: All quiz questions'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_create_question(request):
    """Admin-only endpoint to create new quiz questions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = QuestionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'message': 'Question created successfully',
            'data': serializer.data,
            'admin_bypass': True
        }, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_update_question(request, pk):
    """Admin-only endpoint to update quiz questions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        question = Question.objects.get(pk=pk)
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)
    
    serializer = QuestionSerializer(question, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'message': 'Question updated successfully',
            'data': serializer.data,
            'admin_bypass': True
        })
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def admin_delete_question(request, pk):
    """Admin-only endpoint to delete quiz questions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        question = Question.objects.get(pk=pk)
        question.delete()
        return Response({
            'status': 'success',
            'message': 'Question deleted successfully',
            'admin_bypass': True
        })
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_quiz_stats(request):
    """Admin-only endpoint to get quiz statistics"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count
    
    total_questions = Question.objects.count()
    total_categories = Category.objects.count()
    questions_by_category = Category.objects.annotate(
        question_count=Count('questions')
    ).values('category_name', 'question_count')
    
    return Response({
        'total_questions': total_questions,
        'total_categories': total_categories,
        'questions_by_category': list(questions_by_category),
        'admin_bypass': True
    })