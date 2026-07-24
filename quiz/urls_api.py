from django.urls import path
from . import views_api

urlpatterns = [
    path('categories/', views_api.CategoryViewSet.as_view({'get': 'list'}), name='quiz-categories'),
    # NOTE: Category's primary key is BaseModel.uid (a UUID), so this must be
    # <uuid:pk>. With <int:pk> the route could never match and always 404'd.
    # quiz.Question, by contrast, does define id = AutoField, so the question
    # routes below correctly use <int:pk>.
    path('categories/<uuid:pk>/questions/', views_api.CategoryViewSet.as_view({'get': 'questions'}), name='category-questions'),
    path('questions/', views_api.QuestionViewSet.as_view({'get': 'list'}), name='quiz-questions'),
    path('questions/random/', views_api.QuestionViewSet.as_view({'get': 'random'}), name='quiz-questions-random'),
    path('questions/category/', views_api.QuestionViewSet.as_view({'get': 'category_questions'}), name='quiz-questions-by-category'),
    path('questions/<int:pk>/', views_api.QuestionViewSet.as_view({'get': 'retrieve'}), name='quiz-question-detail'),
    path('product/<int:product_id>/questions/', views_api.get_product_questions, name='product-questions'),
    path('submit-timed/', views_api.submit_timed_quiz, name='submit-timed'),
    
    # Admin-only endpoints
    path('admin/questions/', views_api.admin_all_questions, name='admin-all-questions'),
    path('admin/questions/create/', views_api.admin_create_question, name='admin-create-question'),
    path('admin/questions/<int:pk>/update/', views_api.admin_update_question, name='admin-update-question'),
    path('admin/questions/<int:pk>/delete/', views_api.admin_delete_question, name='admin-delete-question'),
    path('admin/stats/', views_api.admin_quiz_stats, name='admin-quiz-stats'),
]