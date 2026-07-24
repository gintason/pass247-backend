from django.urls import path
from . import views_api

urlpatterns = [
    # Public endpoints
    path('categories/', views_api.UntimedCategoryViewSet.as_view({'get': 'list'}), name='untimed-categories'),
    path('categories/<int:pk>/questions/', views_api.UntimedCategoryViewSet.as_view({'get': 'questions'}), name='category-questions'),
    path('questions/', views_api.UntimedQuestionViewSet.as_view({'get': 'list'}), name='untimed-questions'),
    path('questions/random/', views_api.UntimedQuestionViewSet.as_view({'get': 'random'}), name='untimed-questions-random'),
    path('questions/<int:pk>/', views_api.UntimedQuestionViewSet.as_view({'get': 'retrieve'}), name='untimed-question-detail'),
    path('category/<int:category_id>/questions/', views_api.get_category_questions, name='category-questions'),
    path('submit/', views_api.submit_untimed_quiz, name='submit-untimed'),
    path('history/', views_api.get_user_quiz_history, name='quiz-history'),
    
    # Admin-only endpoints
    path('admin/questions/', views_api.admin_all_questions, name='admin-all-questions'),
    path('admin/questions/create/', views_api.admin_create_question, name='admin-create-question'),
    path('admin/questions/<int:pk>/update/', views_api.admin_update_question, name='admin-update-question'),
    path('admin/questions/<int:pk>/delete/', views_api.admin_delete_question, name='admin-delete-question'),
    path('admin/categories/create/', views_api.admin_create_category, name='admin-create-category'),
    path('admin/stats/', views_api.admin_untimed_stats, name='admin-untimed-stats'),
]