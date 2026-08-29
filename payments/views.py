import hashlib
import hmac
from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
import json
from datetime import datetime, timedelta
from django.contrib.auth.models import User
from .models import Payment, SubscriptionPlan, UserSubscription, PaymentWebhookLog
from .pricing import validate_plan_price
import requests 
import random
from django.contrib import messages
import string
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.views.decorators.http import require_POST, require_GET
import logging
from django.utils import timezone
from django.db.models import Q
from exams.models import ExamCategory, Subject, QuestionBank
from utils.admin_access import admin_or_premium_required, admin_or_login_required

logger = logging.getLogger(__name__)


def generate_reference():
    """Generate a unique reference for the transaction"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"PAS-{timestamp}-{random_str}"


@login_required
def payment_page(request):
    """Display available subscription plans"""
    plans = SubscriptionPlan.objects.all().order_by('price')
    
    # Check if user has active subscription
    active_subscription = UserSubscription.objects.filter(
        user=request.user,
        is_active=True,
        end_date__gte=timezone.now()
    ).first()
    
    # Get exam categories for filtering
    exam_categories = ExamCategory.objects.filter(is_active=True)
    
    context = {
        'plans': plans,
        'active_subscription': active_subscription,
        'exam_categories': exam_categories
    }
    
    return render(request, 'payments/payment_page.html', context)


@login_required
def initialize_payment(request):
    if request.method == "POST":
        plan_id = request.POST.get("plan_id")
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            messages.error(request, "Invalid subscription plan selected.")
            return redirect("payments:payment_page")

        # 🔒 Check if user already has ANY active verified subscription
        active_subscription = UserSubscription.objects.filter(
            user=request.user,
            is_active=True,
            end_date__gte=timezone.now()
        ).first()

        if active_subscription:
            messages.warning(
                request,
                f"🚫 You already have an active {active_subscription.plan.name} plan "
                f"until {active_subscription.end_date.strftime('%Y-%m-%d')}."
            )
            return redirect("exams:dashboard")

        # ✅ No active subscription → proceed with Paystack init
        # Defensive price validation before charging.
        try:
            amount = validate_plan_price(plan.price)  # in Naira
        except ValueError as price_error:
            messages.error(request, str(price_error))
            return redirect("payments:payment_page")
        email = request.user.email
        amount_in_kobo = amount * 100
        reference = generate_reference()

        # Expiry based on selected plan
        expiry_date = timezone.now() + timedelta(days=plan.duration_days)

        # Save payment with plan
        payment = Payment.objects.create(
            user=request.user,
            amount=amount,
            reference=reference,
            email=email,
            expiry_date=expiry_date,
            plan=plan,
            status='pending'
        )

        headers = {
            "Authorization": f"Bearer {settings.PAYSTACK_LIVE_SECRET_KEY}",
            "Content-Type": "application/json",
        }
        data = {
            "email": email,
            "amount": amount_in_kobo,
            "reference": reference,
            "callback_url": request.build_absolute_uri(reverse("payments:verify_payment")),
            "metadata": {
                "user_id": request.user.id,
                "plan_id": plan.id,
                "plan_name": plan.name
            }
        }

        try:
            response = requests.post(
                settings.PAYSTACK_INITIALIZE_PAYMENT_URL, 
                json=data, 
                headers=headers,
                timeout=30
            )
            response_data = response.json()

            if response_data.get("status"):
                return redirect(response_data["data"]["authorization_url"])
            else:
                payment.status = 'failed'
                payment.save()
                messages.error(request, "Payment initialization failed. Please try again.")
                return redirect("payments:payment_page")
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack request failed: {e}")
            payment.status = 'failed'
            payment.save()
            messages.error(request, "Network error. Please try again.")
            return redirect("payments:payment_page")

    return redirect("payments:payment_page")


@login_required
def verify_payment(request):
    reference = request.GET.get("reference")

    if not reference:
        messages.error(request, "No payment reference found.")
        return redirect("payments:cancelled")

    headers = {
        "Authorization": f"Bearer {settings.PAYSTACK_LIVE_SECRET_KEY}"
    }

    try:
        response = requests.get(
            f"{settings.PAYSTACK_VERIFY_URL}{reference}", 
            headers=headers,
            timeout=30
        )
        response_data = response.json()

        if response_data.get("status") and response_data["data"].get("status") == "success":
            try:
                payment = Payment.objects.get(reference=reference)
                payment.verified = True
                payment.status = "success"
                payment.paid_at = timezone.now()
                payment.save()
                
                messages.success(request, "Payment verified successfully! Your subscription is now active.")
                return redirect("payments:payment_success")
            except Payment.DoesNotExist:
                logger.error(f"Payment record not found for reference: {reference}")
                messages.error(request, "Payment record not found.")
                return redirect("payments:cancelled")
        else:
            # Try to update payment status
            try:
                payment = Payment.objects.get(reference=reference)
                payment.status = "failed"
                payment.save()
            except Payment.DoesNotExist:
                pass
                
            messages.error(request, "Payment verification failed. Please contact support.")
            return redirect("payments:cancelled")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Paystack verification failed: {e}")
        messages.error(request, "Unable to verify payment at this time. Please contact support.")
        return redirect("payments:cancelled")


@login_required
def payment_success(request):
    """Display payment success page"""
    # Get user's most recent successful payment
    payment = Payment.objects.filter(
        user=request.user,
        status='success',
        verified=True
    ).order_by('-created_at').first()
    
    # Get subscription details
    subscription = None
    if payment:
        subscription = UserSubscription.objects.filter(payment=payment).first()
    
    # Get recommended subjects/exams based on plan
    recommended_subjects = []
    if payment and payment.plan:
        # Get subjects from the plan's exam categories
        subjects = Subject.objects.filter(
            exam_categories__in=payment.plan.exam_categories.all(),
            is_active=True
        ).distinct()[:6]
        recommended_subjects = subjects
    
    context = {
        'payment': payment,
        'subscription': subscription,
        'recommended_subjects': recommended_subjects
    }
    
    return render(request, 'payments/success.html', context)


def payment_cancelled(request):
    """Handle cancelled payment"""
    return render(request, "payments/cancelled.html")


@csrf_exempt
@require_POST
def paystack_webhook(request):
    """Handles Paystack webhook events with security validation"""
    # Log the webhook for debugging
    payload = request.body.decode('utf-8')
    
    try:
        data = json.loads(payload)
        event = data.get("event")
        webhook_log = PaymentWebhookLog.objects.create(
            event_type=event,
            reference=data.get("data", {}).get("reference", "unknown"),
            payload=data,
            processed=False
        )
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON data"}, status=400)

    # Verify signature
    secret_key = settings.PAYSTACK_LIVE_SECRET_KEY.encode()
    signature = request.headers.get("X-Paystack-Signature")
    
    if signature:
        computed_signature = hmac.new(secret_key, request.body, hashlib.sha512).hexdigest()
        webhook_log.verified = (signature == computed_signature)
        webhook_log.save()
        
        if signature != computed_signature:
            logger.warning(f"Invalid webhook signature for event: {event}")
            return JsonResponse({"error": "Invalid signature"}, status=400)
    else:
        logger.warning("Webhook received without signature")
        return JsonResponse({"error": "No signature provided"}, status=400)

    try:
        if event == "charge.success":
            reference = data["data"]["reference"]
            
            # Update payment record
            try:
                payment = Payment.objects.get(reference=reference)
                if not payment.verified:  # Prevent duplicate verification
                    payment.verified = True
                    payment.status = 'success'
                    payment.paid_at = timezone.now()
                    payment.last_webhook_received = timezone.now()
                    payment.webhook_attempts += 1
                    payment.save()
                    
                    webhook_log.processed = True
                    webhook_log.save()
                    
                    logger.info(f"Payment verified via webhook: {reference}")
                    
                    # Send confirmation email
                    send_payment_confirmation_email(payment)
                    
                return JsonResponse({"message": "Payment verified successfully"}, status=200)
            except Payment.DoesNotExist:
                logger.error(f"Payment not found for webhook reference: {reference}")
                webhook_log.error_message = "Payment not found"
                webhook_log.save()
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
        webhook_log.error_message = str(e)
        webhook_log.save()
        return JsonResponse({"error": "Internal server error"}, status=500)


def send_payment_confirmation_email(payment):
    """Send payment confirmation email"""
    from django.core.mail import send_mail
    
    subject = f"Payment Confirmation - {payment.reference}"
    message = f"""
    Dear {payment.user.username},
    
    Thank you for your payment! Your subscription is now active.
    
    Payment Details:
    - Amount: ₦{payment.amount}
    - Plan: {payment.plan.name if payment.plan else 'Premium'}
    - Reference: {payment.reference}
    - Expiry Date: {payment.expiry_date.strftime('%Y-%m-%d')}
    
    You now have access to all premium features including:
    • Full question banks
    • Detailed explanations
    • Progress tracking
    • Mock exams
    
    Start practicing now: https://pass247.net/exams
    
    Best regards,
    The PAS Team
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [payment.email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {e}")

@admin_or_premium_required
@login_required
@require_GET
def subscription_status(request):
    """API endpoint to check subscription status (for React)"""
    active_subscription = UserSubscription.objects.filter(
        user=request.user,
        is_active=True,
        end_date__gte=timezone.now()
    ).select_related('plan').first()
    
    if active_subscription:
        return JsonResponse({
            'has_active_subscription': True,
            'subscription': {
                'plan_name': active_subscription.plan.name,
                'plan_type': active_subscription.plan.plan_type,
                'start_date': active_subscription.start_date.isoformat(),
                'end_date': active_subscription.end_date.isoformat(),
                'days_remaining': active_subscription.days_remaining(),
                'is_active': active_subscription.is_active,
                'auto_renew': active_subscription.auto_renew
            }
        })
    else:
        return JsonResponse({
            'has_active_subscription': False
        })


@login_required
def payment_history(request):
    """View payment history"""
    payments = Payment.objects.filter(user=request.user).order_by('-created_at')
    
    context = {
        'payments': payments
    }
    
    return render(request, 'payments/history.html', context)


@login_required
def cancel_subscription(request):
    """Cancel auto-renewal of subscription"""
    if request.method == "POST":
        subscription_id = request.POST.get('subscription_id')
        subscription = get_object_or_404(UserSubscription, id=subscription_id, user=request.user)
        
        subscription.auto_renew = False
        subscription.cancelled_at = timezone.now()
        subscription.save()
        
        messages.success(request, "Auto-renewal cancelled successfully.")
        
    return redirect('payments:payment_history')

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
    
    return JsonResponse(data, safe=False)


@login_required
@require_POST
@csrf_exempt
def api_initialize_payment(request):
    """API endpoint to initialize payment (for React)"""
    try:
        data = json.loads(request.body)
        plan_id = data.get('plan_id')
        
        plan = SubscriptionPlan.objects.get(id=plan_id)
        
        # Check for active subscription
        active_subscription = UserSubscription.objects.filter(
            user=request.user,
            is_active=True,
            end_date__gte=timezone.now()
        ).first()
        
        if active_subscription:
            return JsonResponse({
                'error': 'You already have an active subscription'
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
                'authorization_url': response_data["data"]["authorization_url"],
                'reference': reference
            })
        else:
            payment.status = 'failed'
            payment.save()
            return JsonResponse({
                'error': 'Payment initialization failed'
            }, status=400)
            
    except SubscriptionPlan.DoesNotExist:
        return JsonResponse({'error': 'Invalid plan'}, status=400)
    except Exception as e:
        logger.error(f"API payment initialization error: {e}")
        return JsonResponse({'error': str(e)}, status=500)