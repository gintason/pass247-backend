# payments/views_api.py
import hashlib
import hmac
from django.conf import settings
from django.http import JsonResponse
import json
from datetime import datetime, timedelta
from .models import Payment, SubscriptionPlan, UserPlanSubscription
from .pricing import validate_plan_price
import requests 
import random
import string
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.views.decorators.http import require_POST, require_GET
import logging
from django.utils import timezone
from exams.models import ExamCategory, Subject, QuestionBank
from utils.admin_access import admin_or_premium_required

logger = logging.getLogger(__name__)


def api_login_required(view_func):
    """
    JSON 401 for anonymous API calls. Django's @login_required answers with a
    302 to the login page, which axios follows and then reports as a confusing
    HTML/404 response instead of "please log in".
    """
    from functools import wraps

    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'code': 'login_required',
                'error': 'Please log in to continue.',
            }, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def _request_data(request):
    """Accept both JSON bodies and form posts (the React page sent FormData)."""
    content_type = (request.content_type or '').lower()
    if 'application/json' in content_type:
        try:
            data = json.loads(request.body or b'{}')
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ValueError('Request body is not valid JSON.')
        if not isinstance(data, dict):
            raise ValueError('Request body must be a JSON object.')
        return data
    return request.POST.dict()


def _allowed_frontend_origins():
    origins = {getattr(settings, 'FRONTEND_URL', '').rstrip('/')}
    origins.update(o.rstrip('/') for o in getattr(settings, 'CORS_ALLOWED_ORIGINS', []) or [])
    origins.update(o.rstrip('/') for o in getattr(settings, 'CSRF_TRUSTED_ORIGINS', []) or [])
    return {o for o in origins if o}


def _payment_callback_url(request, requested=None):
    """
    Where Paystack sends the student after paying: the React
    /payment/success page, which verifies the reference via
    /api/payments/verify/. A callback_url sent by the frontend is honoured
    only when its origin is one of our own frontends (no open redirect).
    """
    from urllib.parse import urlparse

    if requested:
        parsed = urlparse(str(requested))
        origin = f"{parsed.scheme}://{parsed.netloc}"
        if parsed.scheme in ('http', 'https') and origin in _allowed_frontend_origins():
            return str(requested)
        logger.warning("Ignoring callback_url with unexpected origin: %s", requested)

    frontend = (getattr(settings, 'FRONTEND_URL', '') or '').rstrip('/')
    if not frontend:
        frontend = request.build_absolute_uri('/').rstrip('/')
    return f"{frontend}/payment/success"


def _plan_charge_naira(plan):
    """Amount actually charged (discount applied), as whole Naira."""
    from decimal import Decimal, ROUND_HALF_UP
    amount = Decimal(str(plan.get_discounted_price())).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
    return validate_plan_price(int(amount))


def generate_reference():
    """Generate a unique reference for the transaction"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"PAS-{timestamp}-{random_str}"


@api_login_required
@require_GET
def api_subscription_status(request):
    """Check if user has an active plan subscription"""
    from payments.models import UserPlanSubscription  # Updated import
    
    active_subscription = UserPlanSubscription.objects.filter(
        user=request.user,
        is_active=True,
        end_date__gte=timezone.now()
    ).select_related('plan').first()
    
    if active_subscription:
        return JsonResponse({
            'success': True,
            'has_active_subscription': True,
            'subscription': {
                'id': active_subscription.id,
                'plan_name': active_subscription.plan.name,
                'plan_type': active_subscription.plan.plan_type,
                'price': active_subscription.plan.price,
                'start_date': active_subscription.start_date.isoformat(),
                'end_date': active_subscription.end_date.isoformat(),
                'days_remaining': active_subscription.days_remaining(),
                'is_active': active_subscription.is_active,
                'auto_renew': active_subscription.auto_renew
            }
        })
    else:
        return JsonResponse({
            'success': True,
            'has_active_subscription': False,
            'message': 'No active subscription. You have 5 free trials per subject.'
        })


@require_GET
def api_get_plans(request):
    """
    Subscription plans (public - the pricing page is shown before login).
    Previously behind @login_required, so logged-out visitors got a redirect
    and the page fell back to hard-coded plans with made-up ids, which then
    failed at /initialize/ with "Invalid subscription plan selected".
    """
    plans = SubscriptionPlan.objects.all().order_by('price')
    
    data = []
    for plan in plans:
        data.append({
            'id': plan.id,
            'name': plan.name,
            'plan_type': plan.plan_type,
            'price': plan.price,
            'duration_days': plan.duration_days,
            'description': plan.description,
            'features': plan.features,
            'is_popular': plan.is_popular,
            'discount_percentage': plan.discount_percentage,
            'discounted_price': plan.get_discounted_price()
        })
    
    return JsonResponse({
        'success': True,
        'plans': data
    })


@api_login_required
@require_POST
def api_initialize_payment(request):
    """
    Start a Paystack checkout for a subscription plan (React).

    Request (JSON or form): {"plan_id": 2, "callback_url": optional}
    Success: {"success": true, "authorization_url": "...", "access_code": "...",
              "reference": "PAS-...", "amount": 8500, "plan": {...}}
    Errors are {"success": false, "code": ..., "error": ...} with:
      400 invalid_request / plan_required / invalid_plan / email_required /
          invalid_price / admin_full_access
      404 plan_not_found
      409 already_subscribed
      502 paystack_error / paystack_unreachable
      503 payment_not_configured
    """
    def fail(code, message, http_status, **extra):
        body = {'success': False, 'code': code, 'error': message}
        body.update(extra)
        return JsonResponse(body, status=http_status)

    # Admins already have full access - nothing to buy.
    if request.user.is_staff or request.user.is_superuser:
        return fail('admin_full_access',
                    'Administrators do not need to subscribe. You already have full access.', 400)

    try:
        data = _request_data(request)
    except ValueError as exc:
        return fail('invalid_request', str(exc), 400)

    plan_id = data.get('plan_id') or data.get('plan')
    if plan_id in (None, ''):
        return fail('plan_required', 'Please choose a subscription plan.', 400)
    try:
        plan_id = int(plan_id)
    except (TypeError, ValueError):
        return fail('invalid_plan', 'Invalid plan selected.', 400)

    plan = SubscriptionPlan.objects.filter(id=plan_id).first()
    if plan is None:
        return fail('plan_not_found',
                    'That plan is no longer available. Please refresh the page and choose again.', 404)

    email = (request.user.email or '').strip()
    if not email:
        return fail('email_required',
                    'Add an email address to your profile before paying - Paystack sends your receipt there.',
                    400)

    active_subscription = UserPlanSubscription.objects.filter(
        user=request.user,
        is_active=True,
        end_date__gte=timezone.now()
    ).select_related('plan').first()
    if active_subscription:
        return fail('already_subscribed',
                    f'You already have an active {active_subscription.plan.name} plan until '
                    f'{active_subscription.end_date.strftime("%Y-%m-%d")}.', 409)

    try:
        amount_naira = _plan_charge_naira(plan)
    except ValueError as price_error:
        return fail('invalid_price', str(price_error), 400)

    secret_key = getattr(settings, 'PAYSTACK_LIVE_SECRET_KEY', '') or ''
    if not secret_key:
        logger.error("PAYSTACK_LIVE_SECRET_KEY is not set - cannot initialize payments")
        return fail('payment_not_configured',
                    'Online payment is temporarily unavailable. Please try again later.', 503)

    reference = generate_reference()
    payment = Payment.objects.create(
        user=request.user,
        amount=amount_naira,
        reference=reference,
        email=email,
        expiry_date=timezone.now() + timedelta(days=plan.duration_days),
        plan=plan,
        status='pending'
    )

    paystack_data = {
        "email": email,
        "amount": amount_naira * 100,  # Paystack expects an integer in kobo
        "currency": "NGN",
        "reference": reference,
        "callback_url": _payment_callback_url(request, data.get('callback_url')),
        "metadata": {
            "user_id": request.user.id,
            "plan_id": plan.id,
            "plan_name": plan.name,
        },
    }

    try:
        response = requests.post(
            settings.PAYSTACK_INITIALIZE_PAYMENT_URL,
            json=paystack_data,
            headers={
                "Authorization": f"Bearer {secret_key}",
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        response_data = response.json()
    except (requests.exceptions.RequestException, ValueError) as exc:
        logger.error("Paystack initialize request failed: %s", exc)
        payment.status = 'failed'
        payment.save(update_fields=['status'])
        return fail('paystack_unreachable',
                    'Could not reach the payment provider. Please try again in a moment.', 502)

    authorization_url = (response_data.get('data') or {}).get('authorization_url') \
        if isinstance(response_data, dict) else None
    if not (isinstance(response_data, dict) and response_data.get('status') and authorization_url):
        message = response_data.get('message') if isinstance(response_data, dict) else None
        logger.error("Paystack initialize rejected (%s): %s", response.status_code, message)
        payment.status = 'failed'
        payment.save(update_fields=['status'])
        return fail('paystack_error', message or 'Payment initialization failed. Please try again.', 502)

    return JsonResponse({
        'success': True,
        'authorization_url': authorization_url,
        'access_code': response_data['data'].get('access_code'),
        'reference': reference,
        'payment_id': payment.id,
        'amount': amount_naira,
        'currency': 'NGN',
        'plan': {'id': plan.id, 'name': plan.name, 'duration_days': plan.duration_days},
    })


@api_login_required
@require_GET
def api_verify_payment(request):
    """API endpoint to verify payment status (for React)"""
    reference = request.GET.get('reference')
    
    if not reference:
        return JsonResponse({
            'success': False,
            'error': 'Payment reference is required'
        }, status=400)
    
    try:
        # SECURITY: establish ownership BEFORE returning anything about this
        # payment. This check used to sit further down, below the
        # "already successful" early return, which meant an attacker who
        # guessed/obtained someone else's reference still received a 200 with
        # that payment's amount, dates and plan - reassignment was blocked but
        # the details leaked. Ownership is now the first thing evaluated.
        existing_payment = Payment.objects.filter(reference=reference).first()
        if existing_payment and existing_payment.user_id != request.user.id:
            logger.warning(
                f"User {request.user.id} attempted to verify a payment reference "
                f"({reference}) belonging to user {existing_payment.user_id}"
            )
            return JsonResponse({
                'success': False,
                'error': 'This payment reference does not belong to your account'
            }, status=403)

        # Local fast path: we already know this payment succeeded, and the
        # check above guarantees it belongs to the requesting user.
        if existing_payment and existing_payment.status == 'success':
            payment = existing_payment
            return JsonResponse({
                'success': True,
                'verified': True,
                'payment': {
                    'id': payment.id,
                    'amount': str(payment.amount),
                    'reference': payment.reference,
                    'status': payment.status,
                    'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
                    'expiry_date': payment.expiry_date.isoformat() if payment.expiry_date else None,
                    'plan': {
                        'id': payment.plan.id,
                        'name': payment.plan.name
                    } if payment.plan else None
                }
            })

        # If not found locally or not verified, check with Paystack
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_LIVE_SECRET_KEY}"
        }
        
        response = requests.get(
            f"{settings.PAYSTACK_VERIFY_URL}{reference}", 
            headers=headers,
            timeout=30
        )
        response_data = response.json()
        
        paid = response_data.get("status") and (response_data.get("data") or {}).get("status") == "success"
        if paid and existing_payment is not None:
            # Never activate a plan for less than its price (e.g. an amount
            # altered client-side before reaching Paystack).
            paid_kobo = int(response_data["data"].get("amount") or 0)
            expected_kobo = int(round(float(existing_payment.amount) * 100))
            if paid_kobo < expected_kobo:
                logger.warning("Underpaid reference %s: paid %s kobo, expected %s",
                               reference, paid_kobo, expected_kobo)
                existing_payment.status = 'failed'
                existing_payment.save(update_fields=['status'])
                return JsonResponse({
                    'success': False,
                    'verified': False,
                    'code': 'amount_mismatch',
                    'error': 'The amount paid does not match the plan price. Please contact support.'
                }, status=400)
        if paid:
            # Update or create payment record. update_or_create is now safe:
            # we've already confirmed above that any existing record for this
            # reference belongs to request.user (or no record exists yet).
            payment, created = Payment.objects.update_or_create(
                reference=reference,
                defaults={
                    'user': request.user,
                    'amount': response_data["data"]["amount"] / 100,
                    'email': response_data["data"]["customer"]["email"],
                    'verified': True,
                    'status': 'success',
                    'paid_at': timezone.now(),
                }
            )
            
            return JsonResponse({
                'success': True,
                'verified': True,
                'payment': {
                    'id': payment.id,
                    'amount': str(payment.amount),
                    'reference': payment.reference,
                    'status': payment.status,
                    'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
                    'expiry_date': payment.expiry_date.isoformat() if payment.expiry_date else None,
                    'plan': {
                        'id': payment.plan.id,
                        'name': payment.plan.name
                    } if payment.plan else None
                }
            })
        else:
            return JsonResponse({
                'success': True,
                'verified': False,
                'message': 'Payment not verified yet'
            })
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Payment verification error: {e}")
        return JsonResponse({
            'success': False,
            'error': 'Unable to verify payment at this time'
        }, status=500)


@login_required
@require_GET
def api_payment_history(request):
    """API endpoint to get user's payment history (for React)"""
    payments = Payment.objects.filter(
        user=request.user
    ).order_by('-created_at').select_related('plan')
    
    data = []
    for payment in payments:
        data.append({
            'id': payment.id,
            'amount': str(payment.amount),
            'reference': payment.reference,
            'status': payment.status,
            'verified': payment.verified,
            'plan_name': payment.plan.name if payment.plan else 'Premium',
            'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
            'expiry_date': payment.expiry_date.isoformat() if payment.expiry_date else None,
            'created_at': payment.created_at.isoformat()
        })
    
    return JsonResponse({
        'success': True,
        'payments': data,
        'total': len(data)
    })


@login_required
@require_POST
def api_cancel_subscription(request):
    """API endpoint to cancel auto-renewal of subscription (for React)"""
    try:
        data = json.loads(request.body)
        subscription_id = data.get('subscription_id')
        
        if not subscription_id:
            return JsonResponse({
                'success': False,
                'error': 'Subscription ID is required'
            }, status=400)
        
        subscription = UserPlanSubscription.objects.get(
            id=subscription_id, 
            user=request.user,
            is_active=True
        )
        
        subscription.auto_renew = False
        subscription.cancelled_at = timezone.now()
        subscription.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Auto-renewal cancelled successfully',
            'subscription': {
                'id': subscription.id,
                'auto_renew': subscription.auto_renew,
                'cancelled_at': subscription.cancelled_at.isoformat()
            }
        })
        
    except UserPlanSubscription.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Subscription not found'
        }, status=404)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid request data'
        }, status=400)
    except Exception as e:
        logger.error(f"Cancel subscription error: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required
@require_GET
def api_get_recommended_subjects(request):
    """API endpoint to get recommended subjects based on user's plan (for React)"""
    # Get user's active subscription
    active_subscription = UserPlanSubscription.objects.filter(
        user=request.user,
        is_active=True,
        end_date__gte=timezone.now()
    ).select_related('plan').first()
    
    recommended_subjects = []
    
    if active_subscription and active_subscription.plan:
        # Get subjects from the plan's exam categories
        subjects = Subject.objects.filter(
            exam_categories__in=active_subscription.plan.exam_categories.all(),
            is_active=True
        ).distinct()[:6]
        
        for subject in subjects:
            recommended_subjects.append({
                'id': subject.id,
                'name': subject.name,
                'code': subject.code,
                'description': subject.description,
                'question_count': subject.questions.count()
            })
    
    return JsonResponse({
        'success': True,
        'has_active_subscription': active_subscription is not None,
        'plan_name': active_subscription.plan.name if active_subscription else None,
        'subjects': recommended_subjects
    })


# NOTE: This endpoint is intentionally @csrf_exempt and stays that way.
# It's called server-to-server by Paystack, not from our own frontend, so
# there's no session/CSRF cookie to check here - it's authenticated instead
# via the HMAC signature verification below (X-Paystack-Signature).
@csrf_exempt
@require_POST
def api_paystack_webhook(request):
    """Handles Paystack webhook events (API version)"""
    payload = request.body.decode('utf-8')
    
    try:
        data = json.loads(payload)
        event = data.get("event")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)
    
    # Verify signature
    secret_key = settings.PAYSTACK_LIVE_SECRET_KEY.encode()
    signature = request.headers.get("X-Paystack-Signature")
    
    if signature:
        computed_signature = hmac.new(secret_key, request.body, hashlib.sha512).hexdigest()
        if signature != computed_signature:
            logger.warning(f"Invalid webhook signature for event: {event}")
            return JsonResponse({"error": "Invalid signature"}, status=400)
    else:
        logger.warning("Webhook received without signature")
        return JsonResponse({"error": "No signature provided"}, status=400)
    
    try:
        if event == "charge.success":
            reference = data["data"]["reference"]
            
            try:
                payment = Payment.objects.get(reference=reference)
                if not payment.verified:
                    payment.verified = True
                    payment.status = 'success'
                    payment.paid_at = timezone.now()
                    payment.save()
                    
                    logger.info(f"Payment verified via webhook: {reference}")
                    
                return JsonResponse({"message": "Payment verified successfully"}, status=200)
            except Payment.DoesNotExist:
                logger.error(f"Payment not found for webhook reference: {reference}")
                return JsonResponse({"error": "Payment not found"}, status=404)
                
        elif event == "charge.failed":
            reference = data["data"]["reference"]
            try:
                payment = Payment.objects.get(reference=reference)
                payment.status = 'failed'
                payment.save()
                logger.info(f"Payment failed via webhook: {reference}")
            except Payment.DoesNotExist:
                pass
                
        return JsonResponse({"message": "Event received"}, status=200)
        
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return JsonResponse({"error": "Internal server error"}, status=500)

@login_required
@require_GET
def api_trial_status(request):
    """Get comprehensive trial status for the user"""
    from payments.utils import get_user_trial_status
    
    trial_data = get_user_trial_status(request.user)
    
    # Check for active subscription
    from payments.models import UserPlanSubscription
    has_subscription = UserPlanSubscription.objects.filter(
        user=request.user,
        is_active=True,
        end_date__gte=timezone.now()
    ).exists()
    
    # Get total stats
    total_free_used = sum(t['questions_used'] for t in trial_data)
    total_free_available = sum(
        t['total_free_questions'] if t['questions_remaining'] == 'unlimited' else t['questions_remaining']
        for t in trial_data 
        if t['questions_remaining'] != 'unlimited'
    )
    
    return JsonResponse({
        'success': True,
        'has_subscription': has_subscription,
        'is_premium': request.user.profile.is_premium if hasattr(request.user, 'profile') else False,
        'is_admin': request.user.is_staff or request.user.is_superuser,
        'total_stats': {
            'total_free_used': total_free_used,
            'total_free_remaining': total_free_available,
        },
        'subjects': trial_data
    })


@login_required
@require_GET
def api_check_access(request):
    """Check if user can access a specific question bank"""
    from payments.utils import check_user_access
    
    bank_id = request.GET.get('bank_id')
    subject_id = request.GET.get('subject_id')
    
    question_bank = None
    subject = None
    
    if bank_id:
        try:
            question_bank = QuestionBank.objects.get(id=bank_id, is_active=True)
        except QuestionBank.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Question bank not found'
            }, status=404)
    
    if subject_id:
        try:
            from exams.models import Subject
            subject = Subject.objects.get(id=subject_id, is_active=True)
        except Subject.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Subject not found'
            }, status=404)
    
    has_access, message, data = check_user_access(
        request.user, 
        question_bank=question_bank, 
        subject=subject
    )
    
    return JsonResponse({
        'success': True,
        'has_access': has_access,
        'message': message,
        'access_data': data
    })