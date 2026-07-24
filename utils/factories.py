"""
Shared fixture helpers for the test suite.

Deliberately plain functions rather than a factory library, so this adds no
new dependency to requirements.txt.

IMPORTANT - signal interactions these helpers work around:

1. `users.models.create_user_profile` (post_save on User) auto-creates a
   UserProfile, so tests never create one directly.

2. `payments.models.update_user_subscription` (post_save on Payment) fires
   when a Payment has status='success' AND verified=True. It sets
   profile.is_premium, creates a UserPlanSubscription, and logs a
   UserActivity. `make_active_subscription()` relies on this rather than
   hand-building rows, so tests exercise the real code path.

3. `payments.models.update_subscription_status` (post_save on
   UserPlanSubscription) deactivates a subscription whose end_date has
   passed and clears profile.is_premium if no other active subscription
   remains. This means you cannot simply create an "expired but active"
   row - see `make_expired_subscription()`.

4. `signals.admin_signals.set_admin_premium_on_login` (user_logged_in) sets
   is_premium=True for staff/superusers on login. Tests that log an admin in
   via the test client will see this happen.
"""

from datetime import timedelta

from django.contrib.auth.models import User
from django.utils import timezone

from exams.models import (
    ExamCategory,
    Subject,
    Question,
    QuestionBank,
)
from payments.models import Payment, SubscriptionPlan, UserPlanSubscription


# --------------------------------------------------------------------------
# Users
# --------------------------------------------------------------------------

def make_user(username='student', password='Testpass!2345', **kwargs):
    """Create a regular user (profile auto-created by signal)."""
    return User.objects.create_user(
        username=username,
        email=kwargs.pop('email', f'{username}@example.com'),
        password=password,
        **kwargs
    )


def make_admin(username='adminuser', password='Testpass!2345', superuser=False):
    """Create a staff (or super) user."""
    if superuser:
        return User.objects.create_superuser(
            username=username, email=f'{username}@example.com', password=password
        )
    user = User.objects.create_user(
        username=username, email=f'{username}@example.com', password=password
    )
    user.is_staff = True
    user.save()
    return user


# --------------------------------------------------------------------------
# Exam content
# --------------------------------------------------------------------------

def make_exam_category(name='WASSCE', display_name='WAEC/NECO'):
    """ExamCategory.name is unique and choice-constrained."""
    obj, _ = ExamCategory.objects.get_or_create(
        name=name, defaults={'display_name': display_name}
    )
    return obj


def make_subject(name='Mathematics', code='MTH', categories=None):
    subject, _ = Subject.objects.get_or_create(name=name, code=code)
    if categories:
        subject.exam_categories.set(categories)
    return subject


def make_question(subject, exam_category, correct_answer='A', **kwargs):
    return Question.objects.create(
        question_text=kwargs.pop('question_text', 'What is 2 + 2?'),
        subject=subject,
        exam_category=exam_category,
        option_a=kwargs.pop('option_a', '4'),
        option_b=kwargs.pop('option_b', '5'),
        option_c=kwargs.pop('option_c', '6'),
        option_d=kwargs.pop('option_d', '7'),
        correct_answer=correct_answer,
        explanation=kwargs.pop('explanation', 'Because it is.'),
        is_published=kwargs.pop('is_published', True),
        **kwargs
    )


def make_question_bank(subject, exam_category, questions=None, **kwargs):
    bank = QuestionBank.objects.create(
        name=kwargs.pop('name', 'Test Bank'),
        description=kwargs.pop('description', 'A bank for tests'),
        exam_category=exam_category,
        subject=subject,
        is_free=kwargs.pop('is_free', False),
        has_free_trial=kwargs.pop('has_free_trial', False),
        free_trial_questions=kwargs.pop('free_trial_questions', 0),
        is_active=kwargs.pop('is_active', True),
        **kwargs
    )
    if questions:
        bank.questions.set(questions)
    return bank


# --------------------------------------------------------------------------
# Plans & subscriptions
# --------------------------------------------------------------------------

def make_plan(name='Standard', price=1000, duration_days=30,
              exam_categories=None, subjects=None,
              quiz_categories=None, interview_products=None):
    """
    Create (or reuse) a SubscriptionPlan.

    Uses get_or_create because SubscriptionPlan.name is unique and a single
    test can build several subscriptions off the same default plan - calling
    this twice with the default name would otherwise raise IntegrityError.
    Plans are shared catalogue items in reality, so reuse matches production.

    The scope M2Ms (exam_categories / subjects / quiz_categories /
    interview_products) drive tier enforcement. Leaving one empty means
    "unrestricted" for that content type.
    """
    plan, _created = SubscriptionPlan.objects.get_or_create(
        name=name,
        defaults={'price': price, 'duration_days': duration_days},
    )
    if exam_categories is not None:
        plan.exam_categories.set(exam_categories)
    if subjects is not None:
        plan.subjects.set(subjects)
    if quiz_categories is not None:
        plan.quiz_categories.set(quiz_categories)
    if interview_products is not None:
        plan.interview_products.set(interview_products)
    return plan


def make_active_subscription(user, plan=None, days_remaining=30, reference=None):
    """
    Give `user` a genuinely active paid subscription.

    Creates a verified successful Payment and lets the post_save signal build
    the UserPlanSubscription, so this exercises the real payment path.
    Returns (payment, subscription).
    """
    plan = plan or make_plan()
    payment = Payment.objects.create(
        user=user,
        amount=plan.price,
        reference=reference or f'TEST-ACTIVE-{user.pk}-{plan.pk}',
        email=user.email or 'buyer@example.com',
        verified=True,
        status='success',
        plan=plan,
        expiry_date=timezone.now() + timedelta(days=days_remaining),
    )
    subscription = UserPlanSubscription.objects.filter(
        user=user, payment=payment
    ).first()
    return payment, subscription


def make_expired_subscription(user, plan=None, days_ago=5, reference=None):
    """
    Give `user` a subscription that has already lapsed.

    Note the ordering: the Payment post_save signal sets is_premium=True and
    creates the subscription, then saving the subscription with a past
    end_date triggers update_subscription_status, which deactivates it and
    clears is_premium. We therefore set end_date explicitly afterwards and
    re-save so the signal runs against the expired value.

    Returns (payment, subscription).
    """
    plan = plan or make_plan()
    past = timezone.now() - timedelta(days=days_ago)

    payment = Payment.objects.create(
        user=user,
        amount=plan.price,
        reference=reference or f'TEST-EXPIRED-{user.pk}-{plan.pk}',
        email=user.email or 'buyer@example.com',
        verified=True,
        status='success',
        plan=plan,
        expiry_date=past,
    )
    subscription = UserPlanSubscription.objects.filter(
        user=user, payment=payment
    ).first()
    if subscription:
        subscription.end_date = past
        subscription.is_active = True   # signal should flip this back to False
        subscription.save()
        subscription.refresh_from_db()
    return payment, subscription


def set_stale_premium_flag(user, expiry=None):
    """
    Force profile.is_premium=True without any valid subscription behind it.

    Simulates finding H-3: `is_premium` is a cached flag that is only reset
    when a UserPlanSubscription row happens to be saved again, and no
    periodic task exists to expire it. Content gated solely on this flag
    stays unlocked after a plan lapses.
    """
    profile = user.profile
    profile.is_premium = True
    profile.premium_expiry = expiry
    profile.save()
    return profile
