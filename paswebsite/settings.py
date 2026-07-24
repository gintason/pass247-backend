import os
from pathlib import Path
import environ
import dj_database_url
import pymysql
import cloudinary
import cloudinary.uploader
import cloudinary.api

# -------------------------------------------------
# Base directory and environment setup
# -------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False)
)
environ.Env.read_env(BASE_DIR / ".env")

pymysql.install_as_MySQLdb()

# -------------------------------------------------
# Basic Project Settings
# -------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DEBUG")

# Add more development-friendly hosts
ALLOWED_HOSTS = ["pas.com.ng", "www.pas.com.ng", "localhost", "127.0.0.1"]

# -------------------------------------------------
# Installed Apps src/components/Interview/InterviewLevels.jsx

# src/components/pages/Careers.jsx
# -------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Your apps
    "pasApp",
    "users",
    "Blog",
    "payments",
    "quiz",
    "untimed_quiz",
    "exams",

    # Third-party apps
    "rest_framework",
    "rest_framework.authtoken",  # For token authentication
    "drf_yasg",
    "django_filters",
    "corsheaders",

    # UI/UX helpers
    "crispy_forms",
    "crispy_bootstrap5",
    "bootstrap5",
    "widget_tweaks",
    "import_export",

    # Cloudinary
    "cloudinary",
    "cloudinary_storage",
]

# -------------------------------------------------
# Middleware
# -------------------------------------------------
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # CORS middleware at the top
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "middleware.admin_bypass_middleware.AdminBypassMiddleware",
]

# -------------------------------------------------
# CORS Settings for React Development
# -------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React default dev port
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default dev port
    "http://127.0.0.1:5173",
    "http://localhost:8000",  # Django default port
    "http://127.0.0.1:8000",
]

# Allow credentials (cookies, authorization headers)
CORS_ALLOW_CREDENTIALS = True

# Allow all necessary methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Allow these additional headers if needed
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Preflight request cache duration (in seconds)
CORS_PREFLIGHT_MAX_AGE = 86400

# -------------------------------------------------
# CSRF Settings for React Integration
# -------------------------------------------------
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript to read the token (CRITICAL for React)
CSRF_COOKIE_SAMESITE = 'Lax'  # Required for cross-origin requests
# CSRF_COOKIE_SECURE is set conditionally below, in the Security Settings section
CSRF_COOKIE_PATH = '/'
CSRF_USE_SESSIONS = False  # Store CSRF token in cookie, not session
CSRF_TRUSTED_ORIGINS = [
    "https://www.pas.com.ng",
    "https://pas.com.ng",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# -------------------------------------------------
# Session Settings
# -------------------------------------------------
SESSION_COOKIE_NAME = 'sessionid'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
# SESSION_COOKIE_SECURE is set conditionally below, in the Security Settings section
SESSION_COOKIE_PATH = '/'
SESSION_COOKIE_AGE = 1209600  # 2 weeks in seconds
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_SAVE_EVERY_REQUEST = True  # Refresh session on each request
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# -------------------------------------------------
# URL & WSGI Configuration
# -------------------------------------------------
ROOT_URLCONF = "paswebsite.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "paswebsite.wsgi.application"

# -------------------------------------------------
# REST Framework settings
# -------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
    'DATETIME_FORMAT': '%Y-%m-%d %H:%M:%S',
    # NOTE: do NOT set UNAUTHENTICATED_USER / UNAUTHENTICATED_TOKEN to None.
    # DRF's Request._not_authenticated() does:
    #     if api_settings.UNAUTHENTICATED_USER:
    #         self.user = api_settings.UNAUTHENTICATED_USER()
    #     else:
    #         self.user = None
    # so overriding these with None makes request.user None (instead of
    # AnonymousUser) for every anonymous request. Any view that then calls
    # request.user.is_authenticated - which includes is_admin() and most of
    # the quiz/interview viewsets - raises AttributeError and returns a 500.
    # Because IsAuthenticatedOrReadOnly permits anonymous GETs, this broke
    # public pages (e.g. /interview/<slug>) for every logged-out visitor.
    # Leaving these unset keeps DRF's default AnonymousUser behaviour.
    # Rate limiting: this covers every ViewSet/@api_view-based endpoint
    # (exam sessions, question banks, quiz submit endpoints, etc.) with no
    # per-view code needed. Plain Django JsonResponse views (login/register/
    # forgot-password) aren't APIViews, so they're rate-limited separately -
    # see utils/rate_limit.py.
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '2000/hour',
    },
}

# -------------------------------------------------
# Database - Use local database for development
# -------------------------------------------------
# Using SQLite for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# MySQL configuration (commented out for now)
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.mysql",
#         "NAME": env("DB_NAME", default="pas_local_db"),
#         "USER": env("DB_USER", default="root"),
#         "PASSWORD": env("DB_PASSWORD", default=""),
#         "HOST": env("DB_HOST", default="localhost"),
#         "PORT": env("DB_PORT", default="3306"),
#         "OPTIONS": {
#             "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
#         },
#     }
# }

# Production database config (commented out for now)
# DATABASES = {
#     "default": dj_database_url.config(
#         default=env("DATABASE_URL"),
#         conn_max_age=600,
#         ssl_require=True,
#     )
# }

# -------------------------------------------------
# Password Validators
# -------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -------------------------------------------------
# Internationalization
# -------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Lagos"
USE_I18N = True
USE_TZ = True

# -------------------------------------------------
# Static & Media Files
# -------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# For development, use local static files
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# React build files location (for production)
REACT_APP_DIR = BASE_DIR / "frontend" / "build"
if REACT_APP_DIR.exists():
    STATICFILES_DIRS.append(REACT_APP_DIR / "static")

# Static files storage
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

# Cloudinary for media uploads
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": env("CLOUDINARY_API_KEY"),
    "API_SECRET": env("CLOUDINARY_API_SECRET"),
}

DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# -------------------------------------------------
# Crispy Forms
# -------------------------------------------------
CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"
CRISPY_TEMPLATE_PACK = "bootstrap5"

# -------------------------------------------------
# Authentication
# -------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
# Must be a literal path, not a URL name. This was "login", but the only
# urlpattern named 'login' lives in users/urls.py, which is never include()d
# in paswebsite/urls.py. @login_required reverses LOGIN_URL to build its
# redirect, so an unauthenticated request to any plain-Django @login_required
# view raised NoReverseMatch -> HTTP 500 instead of redirecting. That affected
# 12 live endpoints, including every payment endpoint. '/login/' is the React
# route that actually serves the login page.
LOGIN_URL = "/login"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"

# -------------------------------------------------
# Paystack Configuration
# -------------------------------------------------
PAYSTACK_LIVE_SECRET_KEY = env("PAYSTACK_LIVE_SECRET_KEY")
PAYSTACK_LIVE_PUBLIC_KEY = env("PAYSTACK_LIVE_PUBLIC_KEY")
PAYSTACK_INITIALIZE_PAYMENT_URL = env("PAYSTACK_INITIALIZE_PAYMENT_URL")
PAYSTACK_VERIFY_URL = env("PAYSTACK_VERIFY_URL")

# -------------------------------------------------
# Email Configuration - Use console backend for development
# -------------------------------------------------

APP_DISPLAY_NAME = env("APP_DISPLAY_NAME", default="PAS")

# NOTE ON EMAIL_HOST: this must match a name on the mail server's TLS
# certificate, or Python rejects the connection with
# SSLCertVerificationError: Hostname mismatch.
# mail.pass247.net presents a certificate for da34.host-ww.net ONLY (no
# wildcard), so EMAIL_HOST must be the server hostname even though the
# mailbox is @pass247.net. That combination is normal on shared hosting.
# Verify with:
#   openssl s_client -connect <host>:465 </dev/null 2>/dev/null \
#     | openssl x509 -noout -subject -ext subjectAltName
EMAIL_HOST = env("EMAIL_HOST", default="da34.host-ww.net")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
EMAIL_USE_SSL = env.bool("EMAIL_USE_SSL", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="noreply@pass247.net")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env(
    "DEFAULT_FROM_EMAIL",
    default=f"{APP_DISPLAY_NAME} <{EMAIL_HOST_USER or 'noreply@pass247.net'}>",
)
SERVER_EMAIL = EMAIL_HOST_USER or "noreply@pass247.net"
# Kept well below a request-timeout budget: a hung mail server should not
# hold a worker open on every signup.
EMAIL_TIMEOUT = env.int("EMAIL_TIMEOUT", default=20)

# Falls back to the console backend when no password is configured, so a
# fresh checkout without credentials still runs - the mail prints to the
# terminal instead of erroring. With EMAIL_HOST_PASSWORD set (as in .env),
# real SMTP is used in every environment, including local development.
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default=("django.core.mail.backends.smtp.EmailBackend" if EMAIL_HOST_PASSWORD
             else "django.core.mail.backends.console.EmailBackend"),
)


# -------------------------------------------------
# Celery (optional) - Disable for development if not needed
# -------------------------------------------------
# CELERY_BROKER_URL = "redis://localhost:6379/0"
# CELERY_ACCEPT_CONTENT = ["json"]
# CELERY_TASK_SERIALIZER = "json"

# -------------------------------------------------
# Security Settings - environment-conditional
# -------------------------------------------------
# Previously these were hardcoded to False/0 with a "disable for development"
# comment, but nothing actually varied them by environment - meaning a
# production deployment of this exact settings.py would have served
# session/CSRF cookies over plain HTTP with no HSTS. DEBUG should always be
# False in production (see README/deployment docs), so we key off it here.
if DEBUG:
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    SECURE_CONTENT_TYPE_NOSNIFF = False
    SECURE_BROWSER_XSS_FILTER = False
else:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    # If you deploy behind a reverse proxy/load balancer that terminates TLS
    # (nginx, Render, Railway, Heroku-style platforms) and forwards plain HTTP
    # to gunicorn, Django needs this to correctly detect the original request
    # was HTTPS - without it, SECURE_SSL_REDIRECT can cause a redirect loop.
    # Remove this line if you terminate TLS directly in front of gunicorn
    # without a proxy setting this header.
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# -------------------------------------------------
# Django Debug Toolbar (optional - for development)
# -------------------------------------------------
if DEBUG:
    try:
        import debug_toolbar
        INSTALLED_APPS.append('debug_toolbar')
        MIDDLEWARE.append('debug_toolbar.middleware.DebugToolbarMiddleware')
        INTERNAL_IPS = ['127.0.0.1']
    except ImportError:
        pass

# -------------------------------------------------
# Logging Configuration
# -------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'exams': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
if not LOGS_DIR.exists():
    LOGS_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------
# Custom Settings for React Integration
# -------------------------------------------------
# Base URL for API (useful for React environment variables)
API_BASE_URL = '/api'

# Frontend URL (for email links, etc.)
if DEBUG:
    FRONTEND_URL = 'http://localhost:3000'
else:
    FRONTEND_URL = 'https://pas.com.ng'

# -------------------------------------------------
# Cache settings (optional)
# -------------------------------------------------
if DEBUG:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': 'redis://127.0.0.1:6379/1',
        }
    }