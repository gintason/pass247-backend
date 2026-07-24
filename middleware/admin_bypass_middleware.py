"""
Middleware to inject admin bypass information into requests
"""
from utils.admin_bypass import is_admin_user


class AdminBypassMiddleware:
    """
    Middleware that adds admin_bypass flag to request for easy access in views
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Add admin_bypass attribute to request
        request.is_admin_bypass = is_admin_user(request.user)
        
        response = self.get_response(request)
        return response