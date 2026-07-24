# payments/views_api.py
import hashlib
import hmac
from django.conf import settings
from django.http import JsonResponse
import json
from datetime import datetime, timedelta
from .models import Payment, SubscriptionPlan, UserPlanSubscription
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


def generate_reference():
    """Generate a unique reference for the transaction"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"PAS-{timestamp}-{random_str}"


@login_required
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


@login_required
@require_GET
def api_get_plans(request):
    """API endpoint to get subscription plans (for React)"""
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


@login_required
@require_POST
def api_initialize_payment(request):
    """API endpoint to initialize payment (for React)"""
    # ============================================================
    # ADMIN BYPASS - Admins don't need to pay
    # ============================================================
    if request.user.is_staff or request.user.is_superuser:
        return JsonResponse({
            'success': False,
            'error': 'Administrators do not need to subscribe. You already have full access.'
        }, status=400)
    try:
        data = json.loads(request.body)
        plan_id = data.get('plan_id')
        
        if not plan_id:
            return JsonResponse({
                'success': False,
                'error': 'Plan ID is required'
            }, status=400)
        
        plan = SubscriptionPlan.objects.get(id=plan_id)
        
        # Check for active subscription
        active_subscription = UserPlanSubscription.objects.filter(
            user=request.user,
            is_active=True,
            end_date__gte=timezone.now()
        ).first()
        
        if active_subscription:
            return JsonResponse({
                'success': False,
                'error': f'You already have an active {active_subscription.plan.name} plan until {active_subscription.end_date.strftime("%Y-%m-%d")}'
            }, status=400)
        
        # Initialize payment
        reference = generate_reference()
        expiry_date = timezone.now() + timedelta(days=plan.duration_days)
        
        payment = Payment.objects.create(
            user=request.user,
            amount=plan.price,
            reference=reference,
            email=request.user.email,
            expiry_date=expiry_date,
            plan=plan,
            status='pending'
        )
        
        # Prepare Paystack request
        amount_in_kobo = plan.price * 100
        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_LIVE_SECRET_KEY}",
            "Content-Type": "application/json",
        }
        
        paystack_data = {
            "email": request.user.email,
            "amount": amount_in_kobo,
            "reference": reference,
            "callback_url": request.build_absolute_uri(reverse('payments:verify_payment')),
            "metadata": {
                "user_id": request.user.id,
                "plan_id": plan.id,
                "plan_name": plan.name
            }
        }
        
        response = requests.post(
            settings.PAYSTACK_INITIALIZE_PAYMENT_URL,
            json=paystack_data,
            headers=headers,
            timeout=30
        )
        
        response_data = response.json()
        
        if response_data.get("status"):
            return JsonResponse({
                'success': True,
                'authorization_url': response_data["data"]["authorization_url"],
                'reference': reference,
                'payment_id': payment.id
            })
        else:
            payment.status = 'failed'
            payment.save()
            return JsonResponse({
                'success': False,
                'error': response_data.get('message', 'Payment initialization failed')
            }, status=400)
            
    except SubscriptionPlan.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Invalid subscription plan selected'
        }, status=400)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid request data'
        }, status=400)
    except Exception as e:
        logger.error(f"API payment initialization error: {e}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required
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
        
        if response_data.get("status") and response_data["data"].get("status") == "success":
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