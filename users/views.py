from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone
from django.urls import reverse
from .models import *
from django.contrib.sessions.models import Session
from django.utils.timezone import now
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.urls import reverse
from django.contrib.auth import views as auth_views
from django.views import View
from django.contrib.auth.forms import PasswordResetForm
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from exams.models import PracticeSession, UserPerformance, FreeTrialUsage, QuestionBank, Subject
from utils.admin_access import is_admin

# Create your views here.

def RegisterView(request):
    if request.method == "POST":
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        username = request.POST.get('username').lower()
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        exam_interest = request.POST.get('exam_interest', 'ACADEMIC')

        user_data_has_error = False

        if User.objects.filter(username=username).exists():
            user_data_has_error=True
            messages.error(request, 'A User with this username already exists')
        
        if User.objects.filter(email=email).exists():
            user_data_has_error=True
            messages.error(request, "This email is already taken by another user")
        
        if len(password) < 5:
            user_data_has_error=True
            messages.error(request, 'Password is too short')
        
        if confirm_password != password:
            user_data_has_error = True
            messages.error(request, 'Passwords do not match!')
        
        if len(username) > 7:
            user_data_has_error=True
            messages.error(request, 'Please username should not be more than 7 characters')
        
        if not user_data_has_error:
            new_user = User.objects.create_user(
                first_name=first_name,
                last_name=last_name,
                email=email,
                username=username,
                password=password
            )
            
            # Update profile with exam interest
            profile = new_user.profile
            profile.interest_area = exam_interest
            profile.save()
            
            # Log user activity
            UserActivity.objects.create(
                user=new_user,
                activity_type='LOGIN',
                description='New user registration',
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            messages.success(request, 'Account created successfully. Please login.')
            return redirect('users:login')
        else:
            return render(request, 'users/register.html')
        
    return render(request, 'users/register.html')

def LoginView(request):
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request=request, username=username, password=password)
        if user is not None:
            login(request, user)
            
            # Log user activity
            UserActivity.objects.create(
                user=user,
                activity_type='LOGIN',
                description='User logged in',
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            # Check if user has any pending actions (like incomplete practice)
            next_url = request.GET.get('next')
            if next_url:
                return redirect(next_url)
            
            return redirect('pasApp:home')
        else:
            messages.error(request, 'Invalid username or password')
            return redirect('users:login')

    return render(request, 'users/login.html')

def LogoutView(request):
    if request.user.is_authenticated:
        # Log user activity
        UserActivity.objects.create(
            user=request.user,
            activity_type='LOGIN',
            description='User logged out',
            ip_address=request.META.get('REMOTE_ADDR')
        )
    
    logout(request)
    return redirect('users:login')


@login_required
def DashboardView(request):
    """User dashboard showing stats and progress"""
    user = request.user
    profile = user.profile
    
    # Get recent practice sessions
    recent_sessions = PracticeSession.objects.filter(
        user=user, 
        status='COMPLETED'
    ).order_by('-completed_at')[:5]
    
    # Get performance by subject
    performances = UserPerformance.objects.filter(user=user)
    
    # Get free trial status
    trials = FreeTrialUsage.objects.filter(user=user).select_related('subject')
    
    # Get total stats
    total_sessions = PracticeSession.objects.filter(user=user).count()
    total_questions = PracticeSession.objects.filter(user=user).aggregate(
        total=models.Sum('total_questions')
    )['total'] or 0
    
    context = {
        'profile': profile,
        'recent_sessions': recent_sessions,
        'performances': performances,
        'trials': trials,
        'total_sessions': total_sessions,
        'total_questions': total_questions,
        'average_score': profile.average_score,
        'is_premium': profile.is_premium,
    }
    
    return render(request, 'users/dashboard.html', context)


@login_required
def ProfileView(request):
    """View and edit user profile"""
    user = request.user
    profile = user.profile
    
    if request.method == "POST":
        # Update profile information
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.email = request.POST.get('email', user.email)
        user.save()
        
        profile.phone_number = request.POST.get('phone_number', profile.phone_number)
        profile.location = request.POST.get('location', profile.location)
        profile.bio = request.POST.get('bio', profile.bio)
        profile.preferred_exam_type = request.POST.get('preferred_exam_type', profile.preferred_exam_type)
        profile.save()
        
        messages.success(request, 'Profile updated successfully')
        return redirect('users:profile')
    
    # Get exam types for dropdown
    exam_types = UserProfile.EXAM_TYPES
    
    context = {
        'user': user,
        'profile': profile,
        'exam_types': exam_types,
    }
    
    return render(request, 'users/profile.html', context)


@login_required
def ExamSelectionView(request):
    """Select exam type to practice"""
    return render(request, 'users/exam_selection.html')


@login_required
def SubjectSelectionView(request, exam_type):
    """Select subject within an exam type"""
    from exams.models import Subject, QuestionBank
    
    # Get subjects available for this exam type
    subjects = Subject.objects.filter(
        exam_categories__name=exam_type.upper(),
        is_active=True
    ).distinct()
    
    # Get trial status for each subject
    trial_status = {}
    for subject in subjects:
        try:
            trial = FreeTrialUsage.objects.get(user=request.user, subject=subject)
            remaining = max(0, 5 - trial.questions_answered)
        except FreeTrialUsage.DoesNotExist:
            remaining = 5
        
        # Check if user has subscription for any question bank in this subject
        has_subscription = QuestionBank.objects.filter(
            subject=subject,
            subscriptions__user=request.user,
            subscriptions__is_active=True
        ).exists()
        
        trial_status[subject.id] = {
            'remaining': remaining,
            'has_subscription': has_subscription
        }
    
    context = {
        'exam_type': exam_type,
        'subjects': subjects,
        'trial_status': trial_status,
    }
    
    return render(request, 'users/subject_selection.html', context)


@login_required
def UpgradeToPremium(request):
    """Redirect to payment page for premium upgrade"""
    # This will be handled by the payments app
    return redirect('payments:plans')


@login_required
def UserStatsAPI(request):
    """API endpoint for user statistics (for React components)"""
    user = request.user
    
    # Get overall stats
    total_sessions = PracticeSession.objects.filter(user=user).count()
    completed_sessions = PracticeSession.objects.filter(user=user, status='COMPLETED').count()
    
    # Get subject performance
    performances = UserPerformance.objects.filter(user=user).values(
        'subject__name', 'average_score', 'total_practices'
    )
    
    # Get recent activity
    recent_activity = UserActivity.objects.filter(user=user)[:10].values(
        'activity_type', 'description', 'created_at'
    )
    
    data = {
        'username': user.username,
        'email': user.email,
        'is_premium': user.profile.is_premium,
        'stats': {
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'average_score': user.profile.average_score,
            'total_questions': user.profile.total_questions_answered,
        },
        'subject_performance': list(performances),
        'recent_activity': list(recent_activity),
    }
    
    return JsonResponse(data)


# ==================== API ENDPOINTS FOR REACT ====================

@csrf_exempt
@require_http_methods(["POST"])
def api_login(request):
    """API endpoint for user login (for React)"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            
            # Log activity
            UserActivity.objects.create(
                user=user,
                activity_type='LOGIN',
                description='User logged in via API',
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_premium': user.profile.is_premium if hasattr(user, 'profile') else False,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'is_admin': is_admin(user)
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid credentials'
            }, status=400)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid request data'
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_logout(request):
    """API endpoint for user logout (for React)"""
    if request.user.is_authenticated:
        UserActivity.objects.create(
            user=request.user,
            activity_type='LOGIN',
            description='User logged out via API',
            ip_address=request.META.get('REMOTE_ADDR')
        )
    logout(request)
    return JsonResponse({'success': True})


@login_required
def api_auth_status(request):
    """Check if user is authenticated (for React)"""
    user = request.user
    return JsonResponse({
        'is_authenticated': True,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_premium': user.profile.is_premium if hasattr(user, 'profile') else False,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_admin': is_admin(user)
        }
    })


@csrf_exempt
@require_http_methods(["POST"])
def api_register(request):
    """API endpoint for user registration (for React)"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').lower()
        email = data.get('email', '')
        password = data.get('password', '')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        exam_interest = data.get('exam_interest', 'ACADEMIC')
        
        # Validation
        errors = []
        
        if User.objects.filter(username=username).exists():
            errors.append('Username already exists')
        
        if User.objects.filter(email=email).exists():
            errors.append('Email already exists')
        
        if len(password) < 5:
            errors.append('Password must be at least 5 characters long')
        
        if errors:
            return JsonResponse({
                'success': False,
                'message': errors[0],
                'errors': errors
            }, status=400)
        
        # Create user
        new_user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Update profile with exam interest
        if hasattr(new_user, 'profile'):
            profile = new_user.profile
            profile.interest_area = exam_interest
            profile.save()
        
        # Log user activity
        UserActivity.objects.create(
            user=new_user,
            activity_type='LOGIN',
            description='New user registration via API',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Account created successfully. Please login.',
            'user': {
                'id': new_user.id,
                'username': new_user.username,
                'email': new_user.email
            }
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid request data'
        }, status=400)


# 🔹 Password Reset Views (keep your existing code)

def ForgotPassword(request):
    if request.method == "POST":
        email = request.POST.get('email')

        try:
            user = User.objects.get(email=email)
            new_password_reset = PasswordReset(user=user)
            new_password_reset.save()

            password_reset_url = reverse('users:reset-password', kwargs={'reset_id': new_password_reset.reset_id})
            full_password_reset_url = f'{request.scheme}://{request.get_host()}{password_reset_url}'

            email_body = f'Reset your password using the link below:\n\n\n{full_password_reset_url}'

            email_message = EmailMessage(
                'Reset your password',
                email_body,
                settings.EMAIL_HOST_USER,
                [email]
            )

            email_message.fail_silently = True
            email_message.send()

            return redirect('users:password-reset-sent', reset_id=new_password_reset.reset_id)

        except User.DoesNotExist:
            messages.error(request, f"No user with email '{email}' found")
            return redirect('users:forgot-password')

    return render(request, 'users/forgot_password.html')

def PasswordResetSent(request, reset_id):
    if PasswordReset.objects.filter(reset_id=reset_id).exists():
        return render(request, 'users/password_reset_sent.html')
    else:
        messages.error(request, 'Invalid reset id')
        return redirect('users:forgot-password')

def ResetPassword(request, reset_id):
    try:
        password_reset_id = PasswordReset.objects.get(reset_id=reset_id)

        if request.method == 'POST':
            password = request.POST.get('password')
            confirm_password = request.POST.get('confirm_password')

            passwords_have_error = False

            if password != confirm_password:
                passwords_have_error = True
                messages.error(request, 'Passwords do not match')

            if len(password) < 5:
                passwords_have_error = True
                messages.error(request, 'Password must be at least 5 characters long')

            expiration_time = password_reset_id.created_when + timezone.timedelta(minutes=10)

            if timezone.now() > expiration_time:
                passwords_have_error = True
                messages.error(request, 'Reset link has expired')
                password_reset_id.delete()

            if not passwords_have_error:
                user = password_reset_id.user
                user.set_password(password)
                user.save()
                
                # Log activity
                UserActivity.objects.create(
                    user=user,
                    activity_type='LOGIN',
                    description='Password reset completed'
                )

                password_reset_id.delete()
                messages.success(request, 'Password reset. Proceed to login')
                return redirect('users:login')
            else:
                return redirect('users:reset-password', reset_id=reset_id)

    except PasswordReset.DoesNotExist:
        messages.error(request, 'Invalid reset id')
        return redirect('users:forgot-password')
    
    return render(request, 'users/reset_password.html', {'reset_id': reset_id})