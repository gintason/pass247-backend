"""
Minimal IP-based rate limiting for plain Django views.

DRF's DEFAULT_THROTTLE_CLASSES (see REST_FRAMEWORK in settings.py) only
apply to APIView/ViewSet-based endpoints. Several of our most attack-prone
endpoints - login, register, forgot-password - are plain function-based
views returning JsonResponse, so they need their own rate limiting.

This uses Django's configured cache backend (LocMemCache in dev, Redis in
production per CACHES in settings.py) rather than adding a new dependency
like django-ratelimit. Note: LocMemCache is per-process, so in a
multi-worker gunicorn deployment without Redis, limits are enforced
per-worker, not globally - fine for dev, but confirms production should
run with the Redis cache backend (which it already does when DEBUG=False).
"""
import time
from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse


def _client_ip(request):
    # Respect X-Forwarded-For if present (behind a proxy/load balancer),
    # otherwise fall back to REMOTE_ADDR.
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def rate_limit(key_prefix, limit, period_seconds):
    """
    Decorator: allow at most `limit` requests per `period_seconds`,
    keyed by client IP + key_prefix.

    Usage:
        @rate_limit('login', limit=10, period_seconds=300)
        def api_login(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            ip = _client_ip(request)
            cache_key = f'ratelimit:{key_prefix}:{ip}'
            now = time.time()

            history = cache.get(cache_key, [])
            # Drop timestamps outside the current window
            history = [t for t in history if now - t < period_seconds]

            if len(history) >= limit:
                return JsonResponse({
                    'success': False,
                    'message': 'Too many requests. Please try again later.'
                }, status=429)

            history.append(now)
            cache.set(cache_key, history, timeout=period_seconds)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
