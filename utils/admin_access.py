from functools import wraps
from django.http import JsonResponse

def is_admin(user):
    """
    Check if user is staff or superuser.

    Defensive against `user` being None. DRF can hand views a None user if
    UNAUTHENTICATED_USER is overridden to None (see the note in settings.py),
    and some code paths pass a raw user object that may be unset. Treat any
    falsy/anonymous user as "not admin" rather than raising AttributeError.
    """
    if user is None:
        return False
    if not getattr(user, 'is_authenticated', False):
        return False
    return bool(getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False))

def admin_or_login_required(view_func):
    """
    Replaces @login_required for views that admins can access freely.
    Admins bypass login. Regular users must be authenticated.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Admin bypass - allow access without login check
        if is_admin(request.user):
            return view_func(request, *args, **kwargs)
        
        # For non-admin users, require authentication
        if request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        
        return JsonResponse({'error': 'Login required'}, status=401)
    return wrapper


def admin_or_premium_required(view_func):
    """
    Replaces subscription checks.
    Admins bypass payment. Regular users need is_premium=True.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Admin bypass - allow access without any subscription checks
        if is_admin(request.user):
            return view_func(request, *args, **kwargs)
        
        # For non-admin users, require authentication
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Login required'}, status=401)
        
        # Check if regular user has premium subscription
        if not hasattr(request.user, 'profile'):
            return JsonResponse({
                'error': 'User profile not found',
                'upgrade_url': '/api/payments/plans/'
            }, status=402)
        
        if not request.user.profile.is_premium:
            return JsonResponse({
                'error': 'Subscription required',
                'upgrade_url': '/api/payments/plans/'
            }, status=402)
        
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_bypass_all_checks(view_func):
    """
    Completely bypass all authentication and subscription checks for admin users.
    Useful for API endpoints that should be fully accessible to admins.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Add admin bypass flag to request for use in views
        if is_admin(request.user):
            request.is_admin_bypass = True
            return view_func(request, *args, **kwargs)
        
        # For non-admin users, proceed normally
        request.is_admin_bypass = False
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_free_trial_bypass(view_func):
    """
    Bypass free trial limits for admin users.
    Regular users are subject to free trial limits.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Add admin bypass flag for free trial views
        if is_admin(request.user):
            request.bypass_free_trial = True
            return view_func(request, *args, **kwargs)
        
        request.bypass_free_trial = False
        return view_func(request, *args, **kwargs)
    return wrapper


def auto_set_admin_premium(view_func):
    """
    Automatically set is_premium=True for admin users when they access premium content.
    This ensures admin users always have premium access without manual setup.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Auto-set admin as premium when they access any view with this decorator
        if is_admin(request.user):
            if hasattr(request.user, 'profile') and not request.user.profile.is_premium:
                request.user.profile.is_premium = True
                request.user.profile.save()
        
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_or_owner_required(model_class, owner_field='user'):
    """
    Allows access to admin users or the owner of the object.
    Useful for views where users should only access their own data,
    but admins can access everything.
    
    Usage:
        @admin_or_owner_required(PracticeSession, 'user')
        def session_detail(request, pk):
            session = get_object_or_404(PracticeSession, pk=pk)
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Admin bypass - allow access to any object
            if is_admin(request.user):
                return view_func(request, *args, **kwargs)
            
            # For non-admin users, check if they own the object
            if not request.user.is_authenticated:
                return JsonResponse({'error': 'Login required'}, status=401)
            
            # Get the object ID from kwargs (supports 'pk' or 'id')
            obj_id = kwargs.get('pk') or kwargs.get('id')
            if not obj_id:
                return view_func(request, *args, **kwargs)
            
            try:
                obj = model_class.objects.get(id=obj_id)
                obj_owner = getattr(obj, owner_field)
                
                # Check if the current user is the owner
                if obj_owner == request.user:
                    return view_func(request, *args, **kwargs)
                
                return JsonResponse({'error': 'Permission denied'}, status=403)
                
            except model_class.DoesNotExist:
                return JsonResponse({'error': 'Object not found'}, status=404)
        
        return wrapper
    return decorator


# Helper functions for use in views
def get_admin_bypass_context():
    """Returns context for templates to show admin bypass mode"""
    return {
        'is_admin_bypass_active': True,
        'admin_bypass_message': 'Admin mode: All features unlocked'
    }


def ensure_admin_premium(user):
    """Ensure admin user has premium status"""
    if is_admin(user) and hasattr(user, 'profile'):
        if not user.profile.is_premium:
            user.profile.is_premium = True
            user.profile.save()
            return True
    return False