from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from .models import UntimedCategory, UntimedQuestion, UntimedUserResponse
from .serializers import *
from utils.admin_access import is_admin, admin_or_premium_required, admin_or_login_required
from payments.utils import check_quiz_access
import difflib

# Define the pagination class FIRST before using it
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UntimedCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UntimedCategory.objects.all()
    serializer_class = UntimedCategorySerializer
    pagination_class = StandardResultsSetPagination
    
    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        """Get questions for a specific category - with admin bypass"""
        category = self.get_object()
        questions = category.untimed_questions.all()
        
        # Admin bypass: Full access without restrictions
        if is_admin(request.user):
            page = self.paginate_queryset(questions)
            if page is not None:
                serializer = UntimedQuestionListSerializer(page, many=True)
                return self.get_paginated_response({
                    'questions': serializer.data,
                    'admin_bypass': True,
                    'message': 'Admin access: All untimed questions unlocked'
                })
            serializer = UntimedQuestionListSerializer(questions, many=True)
            return Response({
                'questions': serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: All untimed questions unlocked'
            })
        
        # For non-admin users, check premium access
        has_premium_access = False
        if request.user.is_authenticated:
            if check_quiz_access(request.user)[0]:
                has_premium_access = True
        
        # Limit questions for non-premium users
        if not has_premium_access:
            questions = questions[:15]  # First 15 questions only
        
        page = self.paginate_queryset(questions)
        if page is not None:
            serializer = UntimedQuestionListSerializer(page, many=True)
            response_data = self.get_paginated_response(serializer.data)
            if not has_premium_access and not is_admin(request.user):
                response_data.data['upgrade_message'] = "Premium subscription required for full access to all untimed quiz questions"
                response_data.data['upgrade_url'] = '/api/payments/plans/'
                response_data.data['limited_access'] = True
            return response_data
        
        serializer = UntimedQuestionListSerializer(questions, many=True)
        response_data = {'questions': serializer.data}
        if not has_premium_access and not is_admin(request.user):
            response_data['upgrade_message'] = "Premium subscription required for full access to all untimed quiz questions"
            response_data['upgrade_url'] = '/api/payments/plans/'
            response_data['limited_access'] = True
        return Response(response_data)


class UntimedQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UntimedQuestion.objects.all()
    # SECURITY: default to the answer-free serializer for quiz-taking.
    # This was UntimedQuestionSerializer, which includes `correct_answer`;
    # since list()/retrieve()/random() all call self.get_serializer(), the
    # real answer key was served from /api/untimed-quiz/questions/ - entirely
    # unmasked in the list path, and to premium users in both paths.
    # UntimedQuestionSerializer is still used explicitly by the admin
    # management endpoints further down this module, where answers are
    # legitimately needed.
    serializer_class = UntimedQuestionListSerializer
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['category']
    
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
                    'message': 'Admin access: All untimed quiz questions unlocked'
                })
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'results': serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: All untimed quiz questions unlocked'
            })
        
        # For non-admin users, check premium access
        has_premium_access = False
        if request.user.is_authenticated:
            if check_quiz_access(request.user)[0]:
                has_premium_access = True
        
        # Limit to first 25 questions for non-premium users
        if not has_premium_access:
            queryset = queryset[:25]
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response_data = self.get_paginated_response(serializer.data)
            if not has_premium_access:
                response_data.data['upgrade_message'] = "Premium subscription required for full untimed quiz access"
                response_data.data['upgrade_url'] = '/api/payments/plans/'
                response_data.data['limited_access'] = True
            return response_data
        
        serializer = self.get_serializer(queryset, many=True)
        response_data = {'results': serializer.data}
        if not has_premium_access:
            response_data['upgrade_message'] = "Premium subscription required for full untimed quiz access"
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
            data['correct_answer'] = "*** Premium content - Upgrade to see the correct answer ***"
            data['premium_required'] = True
            data['upgrade_message'] = "Subscribe to premium to see correct answers"
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
        
        questions = UntimedQuestion.objects.all().order_by('?')[:count]
        
        # Admin bypass: Full access without restrictions
        if is_admin(request.user):
            serializer = UntimedQuestionListSerializer(questions, many=True)
            return Response({
                'results': serializer.data,
                'admin_bypass': True,
                'message': f'Admin access: {len(serializer.data)} random untimed questions'
            })
        
        # For non-admin users, check premium access
        has_premium_access = False
        if request.user.is_authenticated:
            if check_quiz_access(request.user)[0]:
                has_premium_access = True
        
        # Limit to 7 random questions for non-premium users
        if not has_premium_access:
            questions = questions[:7]
        
        serializer = UntimedQuestionListSerializer(questions, many=True)
        response_data = {'results': serializer.data}
        
        if not has_premium_access:
            response_data['upgrade_message'] = "Premium subscription required for more random untimed questions"
            response_data['upgrade_url'] = '/api/payments/plans/'
            response_data['limited_access'] = True
        
        return Response(response_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_category_questions(request, category_id):
    """Get questions for a specific untimed quiz category - with admin bypass"""
    category = get_object_or_404(UntimedCategory, id=category_id)
    questions = UntimedQuestion.objects.filter(category=category)
    
    # Admin bypass: Full access without restrictions
    if is_admin(request.user):
        paginator = StandardResultsSetPagination()
        paginated_questions = paginator.paginate_queryset(questions, request)
        
        if paginated_questions is not None:
            serializer = UntimedQuestionListSerializer(paginated_questions, many=True)
            response = paginator.get_paginated_response({
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'question_count': questions.count()
                },
                'questions': serializer.data
            })
            response.data['admin_bypass'] = True
            response.data['message'] = 'Admin access: All category questions unlocked'
            return response
        
        serializer = UntimedQuestionListSerializer(questions, many=True)
        return Response({
            'category': {
                'id': category.id,
                'name': category.name,
                'question_count': questions.count()
            },
            'questions': serializer.data,
            'admin_bypass': True,
            'message': 'Admin access: All category questions unlocked'
        })
    
    # For non-admin users, check premium access
    has_premium_access = False
    if request.user.is_authenticated:
        if check_quiz_access(request.user)[0]:
            has_premium_access = True
    
    # Limit to 15 questions for non-premium users
    if not has_premium_access:
        questions = questions[:15]
    
    paginator = StandardResultsSetPagination()
    paginated_questions = paginator.paginate_queryset(questions, request)
    
    if paginated_questions is not None:
        serializer = UntimedQuestionListSerializer(paginated_questions, many=True)
        response = paginator.get_paginated_response({
            'category': {
                'id': category.id,
                'name': category.name,
                'question_count': UntimedQuestion.objects.filter(category=category).count()
            },
            'questions': serializer.data
        })
        if not has_premium_access:
            response.data['upgrade_message'] = "Premium subscription required for more questions in this category"
            response.data['upgrade_url'] = '/api/payments/plans/'
            response.data['limited_access'] = True
        return response
    
    serializer = UntimedQuestionListSerializer(questions, many=True)
    response_data = {
        'category': {
            'id': category.id,
            'name': category.name,
            'question_count': UntimedQuestion.objects.filter(category=category).count()
        },
        'questions': serializer.data
    }
    
    if not has_premium_access:
        response_data['upgrade_message'] = "Premium subscription required for more questions in this category"
        response_data['upgrade_url'] = '/api/payments/plans/'
        response_data['limited_access'] = True
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_untimed_quiz(request):
    """Submit untimed quiz answers and calculate score - with admin bypass"""
    data = request.data
    answers = data.get('answers', [])
    category_id = data.get('category_id')
    
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
            question = UntimedQuestion.objects.get(id=question_id)
            
            # Calculate similarity (at least 50% match)
            similarity = difflib.SequenceMatcher(
                None, 
                user_answer.lower().strip(), 
                question.correct_answer.lower().strip()
            ).ratio()
            is_correct = similarity >= 0.5
            
            if is_correct:
                score += 1
                correct += 1
            else:
                wrong += 1
            
            # Save user response (admin bypass also saves but with full access)
            if not is_admin_user or not hasattr(request, '_admin_no_save'):
                UntimedUserResponse.objects.create(
                    user=request.user,
                    question=question,
                    user_answer=user_answer,
                    is_correct=is_correct
                )
            
            result_item = {
                'question_id': question.id,
                'question': question.text,
                'user_answer': user_answer or "No answer provided",
                'is_correct': is_correct,
                'similarity': round(similarity * 100, 2)
            }
            
            # Admins always see correct answers, non-premium users only see them if they answered correctly
            if is_admin_user:
                result_item['correct_answer'] = question.correct_answer
            elif check_quiz_access(request.user)[0]:
                result_item['correct_answer'] = question.correct_answer
            elif is_correct:
                result_item['correct_answer'] = question.correct_answer
            else:
                result_item['correct_answer'] = "*** Premium content - Upgrade to see correct answers ***"
                result_item['upgrade_hint'] = "Subscribe to premium to see correct answers for questions you got wrong"
            
            results.append(result_item)
        except UntimedQuestion.DoesNotExist:
            continue
    
    percent = (score / total) * 100 if total > 0 else 0
    
    response_data = {
        'score': score,
        'total': total,
        'correct': correct,
        'wrong': wrong,
        'percent': round(percent, 2),
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


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_quiz_history(request):
    """Get user's past quiz responses - with admin bypass"""
    # Admin bypass: Admins can see all users' history
    if is_admin(request.user):
        user_id = request.query_params.get('user_id')
        if user_id:
            from django.contrib.auth.models import User
            try:
                user = User.objects.get(id=user_id)
                responses = UntimedUserResponse.objects.filter(
                    user=user
                ).select_related('question', 'question__category').order_by('-id')[:100]
            except User.DoesNotExist:
                responses = UntimedUserResponse.objects.filter(
                    user=request.user
                ).select_related('question', 'question__category').order_by('-id')[:50]
        else:
            responses = UntimedUserResponse.objects.all().select_related(
                'question', 'question__category', 'user'
            ).order_by('-id')[:100]
        
        serializer = UntimedUserResponseSerializer(responses, many=True)
        return Response({
            'results': serializer.data,
            'admin_bypass': True,
            'message': 'Admin access: Complete user history'
        })
    
    # Regular user: Only see their own history
    responses = UntimedUserResponse.objects.filter(
        user=request.user
    ).select_related('question', 'question__category').order_by('-id')[:50]
    
    serializer = UntimedUserResponseSerializer(responses, many=True)
    return Response(serializer.data)


# Admin-only endpoints
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_all_questions(request):
    """Admin-only endpoint to get all untimed quiz questions without restrictions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    questions = UntimedQuestion.objects.all().select_related('category')
    page = request.query_params.get('page', 1)
    page_size = request.query_params.get('page_size', 50)
    
    paginator = StandardResultsSetPagination()
    paginator.page_size = page_size
    result_page = paginator.paginate_queryset(questions, request)
    
    serializer = UntimedQuestionSerializer(result_page, many=True)
    return paginator.get_paginated_response({
        'results': serializer.data,
        'admin_bypass': True,
        'total_count': questions.count(),
        'message': 'Admin access: All untimed quiz questions'
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_create_question(request):
    """Admin-only endpoint to create new untimed quiz questions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = UntimedQuestionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'message': 'Untimed question created successfully',
            'data': serializer.data,
            'admin_bypass': True
        }, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_update_question(request, pk):
    """Admin-only endpoint to update untimed quiz questions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        question = UntimedQuestion.objects.get(pk=pk)
    except UntimedQuestion.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)
    
    serializer = UntimedQuestionSerializer(question, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'message': 'Untimed question updated successfully',
            'data': serializer.data,
            'admin_bypass': True
        })
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def admin_delete_question(request, pk):
    """Admin-only endpoint to delete untimed quiz questions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        question = UntimedQuestion.objects.get(pk=pk)
        question.delete()
        return Response({
            'status': 'success',
            'message': 'Untimed question deleted successfully',
            'admin_bypass': True
        })
    except UntimedQuestion.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_create_category(request):
    """Admin-only endpoint to create new untimed categories"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    name = request.data.get('name')
    if not name:
        return Response({'error': 'Category name is required'}, status=400)
    
    category, created = UntimedCategory.objects.get_or_create(name=name)
    
    return Response({
        'status': 'success',
        'message': 'Category created successfully' if created else 'Category already exists',
        'category': UntimedCategorySerializer(category).data,
        'admin_bypass': True
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_untimed_stats(request):
    """Admin-only endpoint to get untimed quiz statistics"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    from django.db.models import Count
    
    total_questions = UntimedQuestion.objects.count()
    total_categories = UntimedCategory.objects.count()
    total_responses = UntimedUserResponse.objects.count()
    average_correct = UntimedUserResponse.objects.filter(is_correct=True).count() / total_responses * 100 if total_responses > 0 else 0
    
    questions_by_category = UntimedCategory.objects.annotate(
        question_count=Count('untimed_questions')
    ).values('name', 'question_count')
    
    return Response({
        'total_questions': total_questions,
        'total_categories': total_categories,
        'total_user_responses': total_responses,
        'average_correct_percentage': round(average_correct, 2),
        'questions_by_category': list(questions_by_category),
        'admin_bypass': True
    })