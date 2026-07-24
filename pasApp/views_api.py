from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from .models import Category, Product, Interview, ContactMessage, InterviewBookmark
from .serializers import *
from django.contrib.auth.models import User
from django.utils import timezone
from utils.admin_access import admin_or_premium_required, admin_or_login_required, auto_set_admin_premium, is_admin
from payments.utils import check_interview_access

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = StandardResultsSetPagination
    lookup_field = 'slug'


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    pagination_class = StandardResultsSetPagination
    lookup_field = 'slug'
    filterset_fields = ['category']
    search_fields = ['name', 'description']
    
    @action(detail=True, methods=['get'])
    def interviews(self, request, slug=None):
        product = self.get_object()
        interviews = product.interviews.all()
        
        # ADMIN BYPASS: Admin users get full access without any restrictions
        if is_admin(request.user):
            # Filter by difficulty if provided
            difficulty = request.query_params.get('difficulty')
            if difficulty:
                interviews = interviews.filter(difficulty=difficulty.upper())
            
            # Filter by category if provided
            category = request.query_params.get('category')
            if category:
                interviews = interviews.filter(category__slug=category)
            
            # Search in questions
            search = request.query_params.get('search')
            if search:
                interviews = interviews.filter(question__icontains=search)
            
            # Paginate
            page = self.paginate_queryset(interviews)
            if page is not None:
                serializer = InterviewListSerializer(page, many=True, context={'request': request})
                response_data = self.get_paginated_response(serializer.data)
                response_data.data['admin_bypass'] = True
                response_data.data['message'] = 'Admin access: All interviews unlocked'
                return response_data
            
            serializer = InterviewListSerializer(interviews, many=True, context={'request': request})
            return Response({
                'results': serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: All interviews unlocked'
            })
        
        # For non-admin users, apply payment/premium restrictions
        # Check if user is authenticated and has premium access
        has_premium_access = False
        if request.user.is_authenticated:
            # Check if user has premium profile
            if check_interview_access(request.user)[0]:
                has_premium_access = True
        
        # For non-premium users, limit number of interviews or show only free content
        if not has_premium_access and not is_admin(request.user):
            # Option 1: Limit to first 5 interviews for non-premium users
            interviews = interviews[:5] if request.user.is_authenticated else interviews[:3]
            message = "Premium subscription required for full access. Upgrade to see all interviews."
        else:
            message = None
        
        # Filter by difficulty if provided
        difficulty = request.query_params.get('difficulty')
        if difficulty:
            interviews = interviews.filter(difficulty=difficulty.upper())
        
        # Filter by category if provided
        category = request.query_params.get('category')
        if category:
            interviews = interviews.filter(category__slug=category)
        
        # Search in questions
        search = request.query_params.get('search')
        if search:
            interviews = interviews.filter(question__icontains=search)
        
        # Paginate
        page = self.paginate_queryset(interviews)
        if page is not None:
            serializer = InterviewListSerializer(page, many=True, context={'request': request})
            response_data = self.get_paginated_response(serializer.data)
            if message:
                response_data.data['upgrade_message'] = message
                response_data.data['upgrade_url'] = '/api/payments/plans/'
            return response_data
        
        serializer = InterviewListSerializer(interviews, many=True, context={'request': request})
        response_data = {'results': serializer.data}
        if message:
            response_data['upgrade_message'] = message
            response_data['upgrade_url'] = '/api/payments/plans/'
        return Response(response_data)


class InterviewViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['product', 'category', 'difficulty', 'is_featured']
    search_fields = ['question', 'answer']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InterviewListSerializer
        return InterviewSerializer
    
    def retrieve(self, request, *args, **kwargs):
        # Increment view count
        instance = self.get_object()
        
        # ADMIN BYPASS: Admin users can view without restrictions
        if is_admin(request.user):
            instance.views_count += 1
            instance.save()
            serializer = self.get_serializer(instance)
            return Response({
                **serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: Full interview details unlocked'
            })
        
        # For non-admin users, check premium access for full content
        has_premium_access = False
        if request.user.is_authenticated:
            if check_interview_access(request.user)[0]:
                has_premium_access = True
        
        # For non-premium users, limit what they can see
        if not has_premium_access:
            # Only show partial answer or ask to upgrade
            partial_answer = instance.answer[:200] + "..." if len(instance.answer) > 200 else instance.answer
            instance.views_count += 1
            instance.save()
            serializer = self.get_serializer(instance)
            data = serializer.data
            data['answer'] = partial_answer
            data['premium_required'] = True
            data['upgrade_message'] = "Subscribe to premium to see the complete answer and access all interviews."
            data['upgrade_url'] = '/api/payments/plans/'
            return Response(data)
        
        # Premium user or interview already accessible
        instance.views_count += 1
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        featured = self.get_queryset().filter(is_featured=True)[:10]
        
        # ADMIN BYPASS: Admin users get all featured interviews
        if is_admin(request.user):
            serializer = InterviewListSerializer(featured, many=True, context={'request': request})
            return Response({
                'results': serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: All featured interviews unlocked'
            })
        
        serializer = InterviewListSerializer(featured, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if len(query) < 3:
            return Response({'error': 'Search query too short'}, status=400)
        
        results = self.get_queryset().filter(
            Q(question__icontains=query) | Q(answer__icontains=query)
        )[:20]
        
        # ADMIN BYPASS: Admin users get full search results
        if is_admin(request.user):
            serializer = InterviewListSerializer(results, many=True, context={'request': request})
            return Response({
                'results': serializer.data,
                'admin_bypass': True,
                'message': 'Admin access: Full search results unlocked'
            })
        
        # For non-admin users, limit results and show upgrade prompt
        has_premium_access = False
        if request.user.is_authenticated:
            if check_interview_access(request.user)[0]:
                has_premium_access = True
        
        if not has_premium_access:
            # Limit search results for non-premium users
            results = results[:5]
            serializer = InterviewListSerializer(results, many=True, context={'request': request})
            return Response({
                'results': serializer.data,
                'limited_results': True,
                'upgrade_message': 'Upgrade to premium to see all search results',
                'upgrade_url': '/api/payments/plans/'
            })
        
        serializer = InterviewListSerializer(results, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def full_content(self, request, pk=None):
        """Admin-only endpoint to get full interview content without restrictions"""
        if not is_admin(request.user):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            **serializer.data,
            'admin_bypass': True
        })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bookmark_interview(request, pk):
    interview = get_object_or_404(Interview, pk=pk)
    
    # Admin bypass - can bookmark any interview
    if is_admin(request.user):
        bookmark, created = InterviewBookmark.objects.get_or_create(
            user=request.user,
            interview=interview
        )
        
        if created:
            return Response({'status': 'bookmarked', 'admin_bypass': True}, status=201)
        else:
            bookmark.delete()
            return Response({'status': 'unbookmarked', 'admin_bypass': True}, status=200)
    
    bookmark, created = InterviewBookmark.objects.get_or_create(
        user=request.user,
        interview=interview
    )
    
    if created:
        return Response({'status': 'bookmarked'}, status=201)
    else:
        bookmark.delete()
        return Response({'status': 'unbookmarked'}, status=200)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_bookmarks(request):
    bookmarks = InterviewBookmark.objects.filter(user=request.user).select_related('interview')
    interviews = [b.interview for b in bookmarks]
    serializer = InterviewListSerializer(interviews, many=True, context={'request': request})
    
    # Admin bypass - admins see all bookmarks including admin flag
    if is_admin(request.user):
        return Response({
            'results': serializer.data,
            'admin_bypass': True,
            'count': len(interviews)
        })
    
    return Response(serializer.data)


@api_view(['POST'])
def contact_submit(request):
    serializer = ContactMessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'success', 'message': 'Message sent successfully'}, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
def site_stats(request):
    from django.db.models import Sum  # Add this import inside the function or at the top
    
    total_interviews = Interview.objects.count()
    total_products = Product.objects.filter(is_active=True).count()
    total_categories = Category.objects.count()
    
    # Admin users see additional stats
    if is_admin(request.user):
        return Response({
            'total_interviews': total_interviews,
            'total_products': total_products,
            'total_categories': total_categories,
            'featured_interviews': Interview.objects.filter(is_featured=True).count(),
            'admin_bypass': True,
            'detailed_stats': {
                'total_views': Interview.objects.aggregate(total=Sum('views_count'))['total'] or 0,
                'top_interview': Interview.objects.order_by('-views_count').first().question if Interview.objects.exists() else None
            }
        })
    
    return Response({
        'total_interviews': total_interviews,
        'total_products': total_products,
        'total_categories': total_categories,
        'featured_interviews': Interview.objects.filter(is_featured=True).count()
    })


# Additional admin-only endpoints
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_all_interviews(request):
    """Admin-only endpoint to get all interviews without any restrictions"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    interviews = Interview.objects.all().select_related('product', 'category')
    page = request.query_params.get('page', 1)
    page_size = request.query_params.get('page_size', 50)
    
    paginator = PageNumberPagination()
    paginator.page_size = page_size
    result_page = paginator.paginate_queryset(interviews, request)
    
    serializer = InterviewSerializer(result_page, many=True, context={'request': request})
    return paginator.get_paginated_response({
        'results': serializer.data,
        'admin_bypass': True,
        'total_count': interviews.count()
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_create_interview(request):
    """Admin-only endpoint to create new interviews"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = InterviewSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'message': 'Interview created successfully',
            'data': serializer.data,
            'admin_bypass': True
        }, status=201)
    return Response(serializer.errors, status=400)


@api_view(['PUT', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def admin_update_interview(request, pk):
    """Admin-only endpoint to update interviews"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        interview = Interview.objects.get(pk=pk)
    except Interview.DoesNotExist:
        return Response({'error': 'Interview not found'}, status=404)
    
    serializer = InterviewSerializer(interview, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'message': 'Interview updated successfully',
            'data': serializer.data,
            'admin_bypass': True
        })
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def admin_delete_interview(request, pk):
    """Admin-only endpoint to delete interviews"""
    if not is_admin(request.user):
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        interview = Interview.objects.get(pk=pk)
        interview.delete()
        return Response({
            'status': 'success',
            'message': 'Interview deleted successfully',
            'admin_bypass': True
        })
    except Interview.DoesNotExist:
        return Response({'error': 'Interview not found'}, status=404)