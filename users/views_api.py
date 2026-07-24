# users/views_api.py
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
import json
from exams.models import PracticeSession, UserPerformance, FreeTrialUsage
from .models import UserActivity, PasswordReset, EmailOTP
from utils.admin_access import is_admin
from utils.rate_limit import rate_limit


@rate_limit('login', limit=10, period_seconds=300)
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
            # authenticate() returns None for BOTH wrong credentials and
            # inactive accounts, which would leave a newly-registered user
            # staring at "Invalid credentials" with no idea they still need
            # to verify. Check for the unverified case explicitly — but only
            # after confirming the password is right, so this cannot be used
            # to enumerate which emails are registered.
            pending = User.objects.filter(username__iexact=username or '', is_active=False).first()
            if pending is None and username:
                pending = User.objects.filter(email__iexact=username, is_active=False).first()

            if pending is not None and pending.check_password(password or ''):
                return JsonResponse({
                    'success': False,
                    'requires_verification': True,
                    'email': pending.email,
                    'username': pending.username,
                    'message': 'Your email is not verified yet. Enter the code we sent you.',
                }, status=403)

            return JsonResponse({
                'success': False,
                'message': 'Invalid credentials'
            }, status=400)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid request data'
        }, status=400)


@require_http_methods(["POST", "GET"])
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


def api_auth_status(request):
    """Check if user is authenticated (for React) - Works for both logged in and logged out users"""
    if request.user.is_authenticated:
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
    else:
        return JsonResponse({
            'is_authenticated': False,
            'user': None
        })


@rate_limit('register', limit=5, period_seconds=3600)
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
        
        if not password:
            errors.append('Password is required')
        else:
            # Run the project's actual configured AUTH_PASSWORD_VALIDATORS
            # (similarity/common-password/numeric/min-length checks) instead
            # of just checking length - this was previously bypassed entirely.
            temp_user = User(
                username=username, email=email,
                first_name=first_name, last_name=last_name
            )
            try:
                validate_password(password, user=temp_user)
            except DjangoValidationError as e:
                errors.extend(e.messages)
        
        if errors:
            return JsonResponse({
                'success': False,
                'message': errors[0],
                'errors': errors
            }, status=400)
        
        # Create the user INACTIVE. Django's ModelBackend refuses to
        # authenticate is_active=False accounts, so this is what actually
        # enforces email verification — it is not merely a UI gate.
        new_user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=False,
        )
        
        # Update profile with exam interest
        if hasattr(new_user, 'profile'):
            profile = new_user.profile
            profile.interest_area = exam_interest
            profile.save()
        
        send_signup_otp(new_user)

        return JsonResponse({
            'success': True,
            'requires_verification': True,
            'message': 'Account created. Enter the 6-digit code we emailed you to finish signing up.',
            'email': new_user.email,
            'username': new_user.username,
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid request data'
        }, status=400)


@login_required
def api_user_stats(request):
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
        'is_premium': user.profile.is_premium if hasattr(user, 'profile') else False,
        'is_admin': is_admin(user),
        'stats': {
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'average_score': user.profile.average_score if hasattr(user, 'profile') else 0,
            'total_questions': user.profile.total_questions_answered if hasattr(user, 'profile') else 0,
        },
        'subject_performance': list(performances),
        'recent_activity': list(recent_activity),
    }
    
    return JsonResponse(data)


@login_required
def api_get_profile(request):
    """Get user profile data"""
    user = request.user
    profile = user.profile if hasattr(user, 'profile') else None
    
    return JsonResponse({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'phone_number': profile.phone_number if profile else '',
        'location': profile.location if profile else '',
        'bio': profile.bio if profile else '',
        'preferred_exam_type': profile.preferred_exam_type if profile else '',
        'profile_picture': profile.profile_picture.url if profile and profile.profile_picture else None,
        'is_premium': profile.is_premium if profile else False,
        'is_admin': is_admin(user),
        'total_practices': profile.total_practices if profile else 0,
        'total_questions': profile.total_questions_answered if profile else 0,
        'average_score': profile.average_score if profile else 0
    })


@login_required
@require_http_methods(["POST", "PUT"])
def api_update_profile(request):
    """Update user profile"""
    user = request.user
    profile = user.profile if hasattr(user, 'profile') else None
    
    try:
        # For JSON requests
        if request.content_type == 'application/json':
            data = json.loads(request.body)
            user.first_name = data.get('first_name', user.first_name)
            user.last_name = data.get('last_name', user.last_name)
            user.email = data.get('email', user.email)
            user.save()
            
            if profile:
                profile.phone_number = data.get('phone_number', profile.phone_number)
                profile.location = data.get('location', profile.location)
                profile.bio = data.get('bio', profile.bio)
                profile.preferred_exam_type = data.get('preferred_exam_type', profile.preferred_exam_type)
                profile.save()
        else:
            # For form data
            user.first_name = request.POST.get('first_name', user.first_name)
            user.last_name = request.POST.get('last_name', user.last_name)
            user.email = request.POST.get('email', user.email)
            user.save()
            
            if profile:
                profile.phone_number = request.POST.get('phone_number', profile.phone_number)
                profile.location = request.POST.get('location', profile.location)
                profile.bio = request.POST.get('bio', profile.bio)
                profile.preferred_exam_type = request.POST.get('preferred_exam_type', profile.preferred_exam_type)
                
                # Handle profile picture
                if 'profile_picture' in request.FILES:
                    profile.profile_picture = request.FILES['profile_picture']
                
                profile.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)


@rate_limit('forgot-password', limit=5, period_seconds=3600)
@require_http_methods(["POST"])
def api_forgot_password(request):
    """API endpoint to request a password reset link (for React)"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether the email exists - respond the same way either way
            return JsonResponse({
                'success': True,
                'message': 'If an account exists for that email, a reset link has been sent.'
            })

        new_password_reset = PasswordReset.objects.create(user=user)

        frontend_url = getattr(settings, 'FRONTEND_URL', '')
        reset_url = f'{frontend_url}/reset-password/{new_password_reset.reset_id}'

        email_body = f'Reset your password using the link below:\n\n\n{reset_url}\n\nThis link expires in 10 minutes.'

        try:
            email_message = EmailMessage(
                'Reset your password',
                email_body,
                None,  # Django falls back to settings.DEFAULT_FROM_EMAIL
                [email]
            )
            email_message.fail_silently = False  # see note in send_signup_otp
            email_message.send()
        except Exception as e:
            # Don't fail the request just because email delivery had an issue -
            # log it, the reset record still exists and support can assist.
            import logging
            logging.getLogger(__name__).error(f"Password reset email failed to send: {e}")

        return JsonResponse({
            'success': True,
            'message': 'If an account exists for that email, a reset link has been sent.'
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid request data'
        }, status=400)


@rate_limit('reset-password', limit=10, period_seconds=3600)
@require_http_methods(["POST"])
def api_reset_password(request, reset_id):
    """API endpoint to reset password using a reset link (for React)"""
    try:
        data = json.loads(request.body)
        password = data.get('password', '')

        try:
            password_reset = PasswordReset.objects.get(reset_id=reset_id)
        except (PasswordReset.DoesNotExist, ValueError):
            return JsonResponse({
                'success': False,
                'message': 'Invalid or expired reset link'
            }, status=400)

        expiration_time = password_reset.created_when + timezone.timedelta(minutes=10)
        if timezone.now() > expiration_time:
            password_reset.delete()
            return JsonResponse({
                'success': False,
                'message': 'Reset link has expired. Please request a new one.'
            }, status=400)

        if not password:
            return JsonResponse({
                'success': False,
                'message': 'Password is required'
            }, status=400)

        try:
            validate_password(password, user=password_reset.user)
        except DjangoValidationError as e:
            return JsonResponse({
                'success': False,
                'message': e.messages[0],
                'errors': e.messages
            }, status=400)

        user = password_reset.user
        user.set_password(password)
        user.save()

        UserActivity.objects.create(
            user=user,
            activity_type='LOGIN',
            description='Password reset completed'
        )

        password_reset.delete()

        return JsonResponse({
            'success': True,
            'message': 'Password reset successful. Please login.'
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid request data'
        }, status=400)

# ---------------------------------------------------------------------------
# Email verification (signup OTP)
# ---------------------------------------------------------------------------

def send_signup_otp(user):
    """
    Issue a fresh signup OTP and email it.

    Email failures are logged, not raised: the account and code already
    exist, so failing the whole request would leave the user unable to
    retry. They can use "resend code" instead.
    """
    import logging

    otp, code = EmailOTP.issue(user, purpose=EmailOTP.PURPOSE_SIGNUP)

    body = (
        f"Hi {user.first_name or user.username},\n\n"
        f"Your PAS verification code is:\n\n"
        f"    {code}\n\n"
        f"It expires in {EmailOTP.TTL_MINUTES} minutes. "
        f"If you did not create a PAS account, you can ignore this email.\n"
    )

    try:
        message = EmailMessage(
            'Your PAS verification code',
            body,
            None,  # Django falls back to settings.DEFAULT_FROM_EMAIL
            [user.email],
        )
        # fail_silently MUST be False. With True, Django swallows SMTP
        # errors internally, send() never raises, and the except block below
        # never runs — so a misconfigured mail server produces complete
        # silence. Letting it raise here means the error is logged, while the
        # except still stops a mail failure from breaking signup.
        message.fail_silently = False
        message.send()
        logging.getLogger(__name__).info(
            f"Signup OTP email sent to user {user.pk} <{user.email}>"
        )
    except Exception as exc:
        logging.getLogger(__name__).error(
            f"Signup OTP email FAILED for user {user.pk} <{user.email}>: "
            f"{type(exc).__name__}: {exc}"
        )
    return otp


def _resolve_user_for_verification(identifier):
    """Find an unverified account by email or username."""
    if not identifier:
        return None
    return (
        User.objects.filter(email__iexact=identifier, is_active=False).first()
        or User.objects.filter(username__iexact=identifier, is_active=False).first()
    )


@rate_limit('verify-otp', limit=20, period_seconds=900)
@require_http_methods(["POST"])
def api_verify_email_otp(request):
    """Verify a signup code, activate the account and sign the user in."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid request data'}, status=400)

    identifier = (data.get('email') or data.get('username') or '').strip()
    code = (data.get('code') or data.get('otp') or '').strip()

    if not identifier or not code:
        return JsonResponse(
            {'success': False, 'message': 'Email and verification code are required'},
            status=400,
        )

    user = _resolve_user_for_verification(identifier)
    if user is None:
        # Deliberately vague: do not reveal which accounts exist or are
        # already verified.
        return JsonResponse(
            {'success': False, 'message': 'That code is not valid. Request a new one.'},
            status=400,
        )

    ok, message = EmailOTP.verify(user, code, purpose=EmailOTP.PURPOSE_SIGNUP)
    if not ok:
        return JsonResponse({'success': False, 'message': message}, status=400)

    user.is_active = True
    user.save(update_fields=['is_active'])

    UserActivity.objects.create(
        user=user,
        activity_type='LOGIN',
        description='Email verified and account activated',
        ip_address=request.META.get('REMOTE_ADDR'),
    )

    # Backend must be specified because authenticate() was bypassed.
    login(request, user, backend='django.contrib.auth.backends.ModelBackend')

    return JsonResponse({
        'success': True,
        'message': 'Email verified. Welcome to PAS.',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        },
    })


@rate_limit('resend-otp', limit=5, period_seconds=900)
@require_http_methods(["POST"])
def api_resend_email_otp(request):
    """Send a fresh signup code. Always reports success, to avoid disclosure."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid request data'}, status=400)

    identifier = (data.get('email') or data.get('username') or '').strip()
    user = _resolve_user_for_verification(identifier)
    if user is not None:
        send_signup_otp(user)

    return JsonResponse({
        'success': True,
        'message': 'If that account is awaiting verification, a new code is on its way.',
    })
