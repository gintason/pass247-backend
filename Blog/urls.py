from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    # Template views (only detail kept, if you still need it)
    path('details/<int:pk>/', views.PostDetail.as_view(), name='post_detail'),

    # API views
    path('posts/', views.posts_api_view, name='posts'),
    path('api/posts/', views.posts_api_view, name='posts-api'),
    path('api/posts/<int:pk>/', views.post_detail_api_view, name='post-detail-api'),
]