from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication (HTML templates)
    path('register/', views.RegisterView, name='register'),
    path('login/', views.LoginView, name='login'),
    path('logout/', views.LogoutView, name='logout'),
    
    # Password reset (HTML templates)
    path('forgot-password/', views.ForgotPassword, name='forgot-password'),
    path('password-reset-sent/<str:reset_id>/', views.PasswordResetSent, name='password-reset-sent'),
    path('reset-password/<str:reset_id>/', views.ResetPassword, name='reset-password'),
    
    # User dashboard and profile (HTML templates)
    path('dashboard/', views.DashboardView, name='dashboard'),
    path('profile/', views.ProfileView, name='profile'),
    
    # Exam selection (HTML templates)
    path('exams/', views.ExamSelectionView, name='exam-selection'),
    path('exams/<str:exam_type>/subjects/', views.SubjectSelectionView, name='subject-selection'),
    
    # Upgrade (HTML templates)
    path('upgrade/', views.UpgradeToPremium, name='upgrade'),
    
    # ==================== API ENDPOINTS FOR REACT ====================
    # These are the endpoints your React frontend should use
    
    # Authentication APIs
    path('api/login/', views.api_login, name='api-login'),
    path('api/logout/', views.api_logout, name='api-logout'),
    path('api/auth/status/', views.api_auth_status, name='api-auth-status'),
    path('api/register/', views.api_register, name='api-register'),
    
    # User data APIs
    path('api/stats/', views.UserStatsAPI, name='user-stats-api'),
    path('api/profile/', views.ProfileView, name='api-profile'),  # If you have an API profile endpoint
]