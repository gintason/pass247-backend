"""
URL configuration for paswebsite project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
# debug_toolbar is a development-only dependency. Import it defensively:
# settings.py already guards its INSTALLED_APPS/MIDDLEWARE registration with
# try/except, but an unguarded import here would break ROOT_URLCONF entirely
# (i.e. take the whole site down with a 500) on any deployment that omits the
# package - which is the normal choice for a production image.
try:
    import debug_toolbar
except ImportError:
    debug_toolbar = None


# API Schema View for documentation
schema_view = get_schema_view(
    openapi.Info(
        title="PAS Exam Platform API",
        default_version='v1',
        description="API for Interview Management and Quiz/CBT Examination System",
        terms_of_service="https://www.pass247.net/terms/",
        contact=openapi.Contact(email="support@pass247.net"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    
    # API Endpoints (for React frontend)
    path('api/auth/', include('users.urls_api')),  # Authentication endpoints
    path('api/exams/', include('exams.urls')),  # New exams app API
    path('api/payments/', include('payments.urls_api')),  # Payment endpoints
    path('api/quiz/', include('quiz.urls_api')),  # Quiz endpoints
    path('api/untimed-quiz/', include('untimed_quiz.urls_api')),  # Untimed quiz endpoints
    path('api/blog/', include('Blog.urls')),  # Blog endpoints
    # Add to your existing urlpatterns
    path('api/interview/', include('pasApp.urls_api')),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('api/docs.json/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    # NOTE: 'api/quiz/' and 'api/untimed-quiz/' are already registered above.
    # Duplicate registrations of quiz.urls_api (same prefix) and a second
    # 'api/untimed/' prefix for untimed_quiz.urls_api were removed here -
    # Django resolves the first match, so they were dead entries that only
    # made the routing table misleading. The frontend uses the prefixes
    # declared above.
]

# ADDED: Debug Toolbar URLs (only in development, prepended to avoid route conflicts)
if settings.DEBUG and debug_toolbar is not None:
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns


# Serve media files in development
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# React frontend - catch all routes to serve React app
# This should be the LAST pattern
if not settings.DEBUG:
    # In production, serve React's index.html for all non-API routes
    urlpatterns += [
        re_path(r'^(?!api/|admin/|media/|static/).*$', 
                TemplateView.as_view(template_name='index.html'), 
                name='react-app'),
    ]
else:
    # In development, you might still want to serve Django templates
    # Keep your existing app URLs for backward compatibility during transition
    urlpatterns += [
        path('', include('pasApp.urls')),  # Original pasApp URLs (will be phased out)
    ]
    
    # Optional: Add a redirect from old quiz URLs to new API
    # This helps during transition
    from django.views.generic.base import RedirectView
    urlpatterns += [
        path('quiz/', RedirectView.as_view(url='/api/quiz/', permanent=False)),
        path('untimed_quiz/', RedirectView.as_view(url='/api/untimed-quiz/', permanent=False)),
    ]