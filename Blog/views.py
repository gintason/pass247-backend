from django.shortcuts import render
from django.views import generic
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Post
from .serializers import PostSerializer


# ── Existing Django template views (kept intact) ──────────────────────────────
def posts_view(request):
    post = Post.objects.all()
    context = {'posts': post}
    return render(request, 'blog/posts.html', context)


class PostDetail(generic.DetailView):
    model = Post
    template_name = 'blog/post_detail.html'


# ── New DRF API views ─────────────────────────────────────────────────────────
@api_view(['GET'])
def posts_api_view(request):
    posts = Post.objects.filter(status=1).order_by('-created_on')
    paginator = PageNumberPagination()
    paginator.page_size = 10
    page = paginator.paginate_queryset(posts, request)
    if page is not None:
        serializer = PostSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def post_detail_api_view(request, pk):
    try:
        post = Post.objects.get(pk=pk)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=404)
    serializer = PostSerializer(post, context={'request': request})
    return Response(serializer.data)