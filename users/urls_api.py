# users/urls_api.py
from django.urls import path
from . import views_api  # Change this to import views_api instead of views

app_name = 'users_api'

urlpatterns = [
    # API endpoints for React
    path('status/', views_api.api_auth_status, name='api-auth-status'),
    path('login/', views_api.api_login, name='api-login'),  # Changed to views_api
    path('logout/', views_api.api_logout, name='api-logout'),
    path('register/', views_api.api_register, name='api-register'),
    path('stats/', views_api.api_user_stats, name='user-stats-api'),  # Changed to views_api
    path('profile/', views_api.api_get_profile, name='api-get-profile'),
    path('profile/update/', views_api.api_update_profile, name='api-update-profile'),
    path('forgot-password/', views_api.api_forgot_password, name='api-forgot-password'),
    path('reset-password/<uuid:reset_id>/', views_api.api_reset_password, name='api-reset-password'),

    # Signup email verification
    path('verify-otp/', views_api.api_verify_email_otp, name='api-verify-otp'),
    path('resend-otp/', views_api.api_resend_email_otp, name='api-resend-otp'),
]