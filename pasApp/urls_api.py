from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_api

router = DefaultRouter()
router.register(r'categories', views_api.CategoryViewSet)
router.register(r'products', views_api.ProductViewSet)
router.register(r'interviews', views_api.InterviewViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('interviews/<int:pk>/bookmark/', views_api.bookmark_interview, name='interview-bookmark'),
    path('bookmarks/', views_api.get_bookmarks, name='bookmarks'),
    path('contact/', views_api.contact_submit, name='contact'),
    path('stats/', views_api.site_stats, name='stats'),
    
    # Admin-only endpoints
    path('admin/interviews/', views_api.admin_all_interviews, name='admin-all-interviews'),
    path('admin/interviews/create/', views_api.admin_create_interview, name='admin-create-interview'),
    path('admin/interviews/<int:pk>/update/', views_api.admin_update_interview, name='admin-update-interview'),
    path('admin/interviews/<int:pk>/delete/', views_api.admin_delete_interview, name='admin-delete-interview'),
    path('interviews/<int:pk>/full-content/', views_api.InterviewViewSet.as_view({'get': 'full_content'}), name='interview-full-content'),
]