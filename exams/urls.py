from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.ExamCategoryViewSet)
router.register(r'subjects', views.SubjectViewSet)
router.register(r'questions', views.QuestionViewSet)
router.register(r'question-banks', views.QuestionBankViewSet)
router.register(r'sessions', views.PracticeSessionViewSet, basename='session')
router.register(r'performance', views.UserPerformanceViewSet, basename='performance')
router.register(r'bookmarks', views.BookmarkViewSet, basename='bookmark')
router.register(r'trial', views.FreeTrialViewSet, basename='trial')

urlpatterns = [
    path('', include(router.urls)),

    # Bulk upload endpoints (admin only)
    path('bulk-upload/', views.bulk_upload_questions_api, name='bulk-upload-api'),
    path('auto-create-banks/', views.auto_create_banks_api, name='auto-create-banks-api'),
    path('download-template/', views.download_template_api, name='download-template-api'),

    # Auth endpoints
    path('csrf/', views.get_csrf_token, name='get-csrf-token'),
    path('login/', views.api_login, name='api-login'),
    path('logout/', views.api_logout, name='api-logout'),
    path('auth/status/', views.api_auth_status, name='api-auth-status'),
    path('profile/', views.api_get_profile, name='api-get-profile'),
    path('profile/update/', views.api_update_profile, name='api-update-profile'),
    path('stats/', views.api_user_stats, name='api-user-stats'),

    # Trial and access check endpoints
    path('trial-status/', views.trial_status_api, name='trial-status-api'),
    path('check-access/', views.check_access_api, name='check-access-api'),

    # Study Notes and Past Questions
    path('study-notes/<int:subject_id>/', views.get_study_notes, name='get-study-notes'),
    path('past-questions/<int:subject_id>/', views.get_past_questions, name='get-past-questions'),
]