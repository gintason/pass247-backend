"""
Admin bypass utilities - Allows admin users to access all features without restrictions.
This is a non-disruptive addition that only affects admin/staff users.
"""
from functools import wraps
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied


def admin_bypass_required(view_func):
    """
    Decorator that bypasses authentication for admin/staff users.
    Non-admin users must be authenticated.
    
    Usage:
        @admin_bypass_required
        def my_view(request):
            ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check if user is admin/staff
        if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            # Admin bypass - allow access without any checks
            return view_func(request, *args, **kwargs)
        
        # For non-admin users, require authentication
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Login required'}, status=401)
        
        # Regular authenticated user
        return view_func(request, *args, **kwargs)
    
    return wrapper


def admin_premium_bypass(view_func):
    """
    Decorator that bypasses premium/subscription checks for admin users.
    Non-admin users must have active subscription.
    
    Usage:
        @admin_premium_bypass
        def premium_view(request):
            ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Admin/staff bypass all premium checks
        if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            return view_func(request, *args, **kwargs)
        
        # Require authentication for non-admin
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Login required'}, status=401)
        
        # Check if regular user has premium subscription
        if not hasattr(request.user, 'profile') or not request.user.profile.is_premium:
            return JsonResponse({
                'error': 'Premium subscription required',
                'upgrade_url': '/api/payments/plans/'
            }, status=402)
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def admin_free_trial_bypass(view_func):
    """
    Decorator that bypasses free trial limits for admin users.
    Non-admin users are subject to free trial limits.
    
    Usage:
        @admin_free_trial_bypass
        def trial_view(request, question_bank_id):
            ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Add admin flag to request for views to check
        if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            request.is_admin_bypass = True
        else:
            request.is_admin_bypass = False
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def is_admin_user(user):
    """
    Helper function to check if user is admin/staff.

    Defensive against `user` being None - see the matching note in
    utils/admin_access.is_admin().
    """
    if user is None:
        return False
    if not getattr(user, 'is_authenticated', False):
        return False
    return bool(getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False))


def get_admin_bypass_context():
    """Returns context for templates to show admin bypass mode"""
    return {
        'is_admin_bypass_active': True,
        'admin_bypass_message': 'Admin mode: All features unlocked'
    }