from django.shortcuts import redirect
from django.utils import timezone
from django.contrib import messages
from .models import Payment, UserPlanSubscription
from exams.models import FreeTrialUsage, QuestionBank
from users.models import UserProfile
import uuid
from functools import wraps


def is_admin_user(user):
    """
    Check if user is an admin (staff or superuser).

    Defensive against `user` being None - see the matching note in
    utils/admin_access.is_admin().
    """
    if user is None:
        return False
    if not getattr(user, 'is_authenticated', False):
        return False
    return bool(getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False))


def generate_reference():
    """Generates a unique reference ID for payment transactions."""
    return str(uuid.uuid4())


def get_active_subscriptions(user):
    """Return the user's currently-active, unexpired plan subscriptions."""
    return UserPlanSubscription.objects.filter(
        user=user,
        is_active=True,
        end_date__gte=timezone.now(),
    ).select_related('plan')


def _plan_covers(plan, *, exam_category=None, subject=None,
                 quiz_category=None, interview_product=None):
    """
    Does this plan's scope include the requested content?

    Backward-compatibility rule: an EMPTY scope M2M means "unrestricted" for
    that content type. So a plan that lists no subjects grants all subjects
    (this is how every existing plan behaved before tier scoping existed, and
    it means current subscribers don't lose access when this ships). A plan
    that lists one or more subjects grants only those.

    Only the dimension(s) relevant to the request are checked; a None argument
    is ignored. When several dimensions are supplied, all supplied ones must
    be covered.
    """
    if plan is None:
        return False

    checks = []

    if exam_category is not None:
        scoped = plan.exam_categories.all()
        checks.append(not scoped.exists() or scoped.filter(pk=exam_category.pk).exists())

    if subject is not None:
        scoped = plan.subjects.all()
        checks.append(not scoped.exists() or scoped.filter(pk=subject.pk).exists())

    if quiz_category is not None:
        scoped = plan.quiz_categories.all()
        checks.append(not scoped.exists() or scoped.filter(pk=quiz_category.pk).exists())

    if interview_product is not None:
        scoped = plan.interview_products.all()
        checks.append(not scoped.exists() or scoped.filter(pk=interview_product.pk).exists())

    # No dimension requested -> any active plan is sufficient.
    if not checks:
        return True
    return all(checks)


def has_covering_subscription(user, **scope):
    """
    True if the user has an active subscription whose plan covers `scope`.

    `scope` accepts exam_category / subject / quiz_category / interview_product.
    """
    for subscription in get_active_subscriptions(user):
        if _plan_covers(subscription.plan, **scope):
            return True
    return False


def subscription_required(view_func):
    """
    Decorator to restrict access if user has no active subscription or free trials.
    Admins are always allowed through.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # ============================================================
        # ADMIN BYPASS - Admins never need to pay
        # ============================================================
        if is_admin_user(request.user):
            return view_func(request, *args, **kwargs)
        
        # Check for active plan subscription
        has_plan = UserPlanSubscription.objects.filter(
            user=request.user,
            is_active=True,
            end_date__gte=timezone.now()
        ).exists()
        
        if has_plan:
            return view_func(request, *args, **kwargs)
        
        # Check legacy payment
        payment = Payment.objects.filter(
            user=request.user, 
            status='success', 
            verified=True
        ).order_by('-expiry_date').first()
        
        if payment and not payment.is_expired():
            return view_func(request, *args, **kwargs)
        
        # Check profile premium status
        try:
            profile = request.user.profile
            if profile.is_premium and profile.premium_expiry and profile.premium_expiry > timezone.now():
                return view_func(request, *args, **kwargs)
        except UserProfile.DoesNotExist:
            pass
        
        # Check free trials
        question_bank_id = kwargs.get('bank_id') or kwargs.get('pk')
        if question_bank_id:
            try:
                question_bank = QuestionBank.objects.get(id=question_bank_id, is_active=True)
                if question_bank.has_free_trial:
                    trial, created = FreeTrialUsage.objects.get_or_create(
                        user=request.user,
                        subject=question_bank.subject,
                        defaults={'questions_answered': 0}
                    )
                    if trial.questions_answered < question_bank.free_trial_questions:
                        return view_func(request, *args, **kwargs)
            except QuestionBank.DoesNotExist:
                pass
        
        messages.warning(request, 'You have exhausted your free trials. Please subscribe to continue.')
        return redirect("payments:pay")
    
    return wrapper


def premium_required(view_func):
    """
    Decorator for views that require premium access.
    Admins are always allowed through.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # ============================================================
        # ADMIN BYPASS
        # ============================================================
        if is_admin_user(request.user):
            return view_func(request, *args, **kwargs)
        
        has_access, message, data = check_user_access(request.user)
        
        if has_access:
            return view_func(request, *args, **kwargs)
        
        from django.http import JsonResponse
        return JsonResponse({
            'error': message,
            'requires_payment': True,
            'upgrade_url': '/api/payments/initialize/',
            'plans_url': '/api/payments/plans/',
            **data
        }, status=402)
    
    return wrapper


def check_user_access(user, question_bank=None, subject=None):
    """
    Unified access control check for EXAM content.
    ADMINS ALWAYS GET FULL ACCESS.
    Returns (has_access, message, data_dict)

    Tier scoping (finding H-1): a subscription only grants access to content
    its plan actually covers. Previously any active subscription unlocked
    everything, making the per-plan exam_categories/subjects fields
    decorative. An empty scope still means "unrestricted" (see _plan_covers),
    so pre-existing plans and subscribers are unaffected.
    """
    if not user.is_authenticated:
        return False, 'Please login to access content', {'login_required': True}

    # ADMIN BYPASS - admins never pay
    if is_admin_user(user):
        return True, 'Admin access granted', {'is_admin': True}

    # Determine the scope we're being asked about, from whichever of
    # question_bank / subject was supplied.
    scope_exam_category = None
    scope_subject = subject
    if question_bank is not None:
        scope_subject = scope_subject or getattr(question_bank, 'subject', None)
        scope_exam_category = getattr(question_bank, 'exam_category', None)

    # Free content short-circuits everything.
    if question_bank is not None and question_bank.is_free:
        return True, 'Free content', {'is_free': True}

    # Active plan subscription that COVERS this content.
    if has_covering_subscription(
        user, exam_category=scope_exam_category, subject=scope_subject
    ):
        return True, 'Active subscription', {'has_subscription': True}

    has_active_subscription = get_active_subscriptions(user).exists()

    # Legacy payment (pre-plan model). IMPORTANT: only payments with NO plan
    # attached count here. Every plan subscription is created by a verified,
    # unexpired Payment, so matching all successful payments would grant
    # unconditional access and silently defeat the scoping check above - the
    # tier-scoping test caught exactly this.
    payment = Payment.objects.filter(
        user=user, status='success', verified=True, plan__isnull=True
    ).order_by('-expiry_date').first()
    if payment and not payment.is_expired():
        return True, 'Active payment', {'has_payment': True}

    # Profile premium flag. Only consulted when the user has no plan
    # subscription at all - if they do, the scoped decision above is
    # authoritative and this cached flag must not override it. Also requires a
    # valid, unexpired timestamp (a True flag with no/expired premium_expiry
    # is the stale-flag bug and is deliberately not honoured).
    if not has_active_subscription:
        try:
            profile = user.profile
            if profile.is_premium and profile.premium_expiry and profile.premium_expiry > timezone.now():
                return True, 'Premium access', {'is_premium': True}
        except UserProfile.DoesNotExist:
            pass

    # Free trial for a specific question bank.
    if question_bank:
        if question_bank.has_free_trial:
            trial, _created = FreeTrialUsage.objects.get_or_create(
                user=user, subject=question_bank.subject,
                defaults={'questions_answered': 0}
            )
            remaining = question_bank.free_trial_questions - trial.questions_answered
            if remaining > 0:
                return True, f'{remaining} free trials remaining', {
                    'is_trial': True, 'remaining': remaining,
                    'total': question_bank.free_trial_questions,
                    'used': trial.questions_answered
                }
            return False, 'Free trials exhausted', {
                'trial_exhausted': True,
                'total': question_bank.free_trial_questions,
                'used': trial.questions_answered, 'requires_payment': True
            }

    # Free trial for a subject.
    if subject:
        banks = QuestionBank.objects.filter(subject=subject, has_free_trial=True)
        if banks.exists():
            trial, _created = FreeTrialUsage.objects.get_or_create(
                user=user, subject=subject, defaults={'questions_answered': 0}
            )
            total_free = sum(bank.free_trial_questions for bank in banks)
            remaining = total_free - trial.questions_answered
            if remaining > 0:
                return True, f'{remaining} free trials remaining', {
                    'is_trial': True, 'remaining': remaining,
                    'total': total_free, 'used': trial.questions_answered
                }
            return False, 'Free trials exhausted', {
                'trial_exhausted': True, 'total': total_free,
                'used': trial.questions_answered, 'requires_payment': True
            }

    if has_active_subscription:
        return False, 'Your plan does not include this content', {
            'requires_upgrade': True, 'out_of_scope': True
        }
    return False, 'Subscription required', {'requires_payment': True}


def check_quiz_access(user, quiz_category=None):
    """
    Access control for QUIZ content (findings H-2/H-3).

    quiz and untimed_quiz previously gated on the cached profile.is_premium
    flag with no expiry and no plan awareness, so access never lapsed. This
    evaluates live subscription state instead, scoped to the quiz category
    when one is supplied.

    Returns (has_access, message, data_dict).
    """
    if not getattr(user, 'is_authenticated', False):
        return False, 'Please login to access content', {'login_required': True}

    if is_admin_user(user):
        return True, 'Admin access granted', {'is_admin': True}

    if has_covering_subscription(user, quiz_category=quiz_category):
        return True, 'Active subscription', {'has_subscription': True}

    has_active_subscription = get_active_subscriptions(user).exists()

    # Legacy payment only - i.e. one with no plan attached. Plan-backed
    # payments must not grant access here or they would bypass the scoped
    # check above (every subscription is created by such a payment).
    payment = Payment.objects.filter(
        user=user, status='success', verified=True, plan__isnull=True
    ).order_by('-expiry_date').first()
    if payment and not payment.is_expired():
        return True, 'Active payment', {'has_payment': True}

    # Cached premium flag: only when there is no plan subscription to defer to,
    # and only when backed by a valid, unexpired timestamp.
    if not has_active_subscription:
        try:
            profile = user.profile
            if profile.is_premium and profile.premium_expiry and profile.premium_expiry > timezone.now():
                return True, 'Premium access', {'is_premium': True}
        except UserProfile.DoesNotExist:
            pass

    return False, 'Subscription required', {'requires_payment': True}


def check_interview_access(user, interview_product=None):
    """
    Access control for INTERVIEW content (findings H-2/H-3).

    Same rationale as check_quiz_access - evaluates live subscription state
    scoped to the interview product, rather than trusting the stale
    profile.is_premium flag.

    Returns (has_access, message, data_dict).
    """
    if not getattr(user, 'is_authenticated', False):
        return False, 'Please login to access content', {'login_required': True}

    if is_admin_user(user):
        return True, 'Admin access granted', {'is_admin': True}

    if has_covering_subscription(user, interview_product=interview_product):
        return True, 'Active subscription', {'has_subscription': True}

    has_active_subscription = get_active_subscriptions(user).exists()

    # Legacy payment only - i.e. one with no plan attached. Plan-backed
    # payments must not grant access here or they would bypass the scoped
    # check above (every subscription is created by such a payment).
    payment = Payment.objects.filter(
        user=user, status='success', verified=True, plan__isnull=True
    ).order_by('-expiry_date').first()
    if payment and not payment.is_expired():
        return True, 'Active payment', {'has_payment': True}

    # Cached premium flag: only when there is no plan subscription to defer to,
    # and only when backed by a valid, unexpired timestamp.
    if not has_active_subscription:
        try:
            profile = user.profile
            if profile.is_premium and profile.premium_expiry and profile.premium_expiry > timezone.now():
                return True, 'Premium access', {'is_premium': True}
        except UserProfile.DoesNotExist:
            pass

    return False, 'Subscription required', {'requires_payment': True}