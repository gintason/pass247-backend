"""
Free tier vs subscriber access - one place for the rules.

Free (signed-up) users:
  * 10 questions in total across Practice and Exams (all subjects together);
  * 10 interview questions & answers in total;
  * can SEE the Study Notes / Syllabus / Past Questions buttons, but the
    content needs a subscription;
  * no timed / untimed quizzes.
Subscribers (active paid plan, bank subscription, premium profile) and
admins get everything.

Locked content is answered with HTTP 402 and a body the frontend turns into
the "Upgrade" prompt:
    {"error": ..., "code": "subscription_required", "upgrade_url": "/payment-plans"}
"""
from rest_framework import status
from rest_framework.exceptions import APIException

from utils.admin_access import is_admin

FREE_QUESTION_LIMIT = 10
FREE_INTERVIEW_LIMIT = 10
UPGRADE_URL = '/payment-plans'

AREA_MESSAGES = {
    'exams': 'Subscribe to unlock Study Notes, Syllabuses, Past Questions and unlimited questions.',
    'quiz': 'Timed and untimed quizzes are for subscribers. Subscribe to unlock them.',
    'interview': 'Subscribe to unlock every interview question and answer.',
    'questions': f"You've used your {FREE_QUESTION_LIMIT} free questions. Subscribe for unlimited "
                 "practice, exams, notes, syllabuses and past questions.",
}


class SubscriptionRequired(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = 'subscription_required'
    default_detail = AREA_MESSAGES['exams']


def has_full_access(user, area='exams'):
    """True for admins and subscribers of the given area."""
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    if is_admin(user):
        return True
    if area == 'quiz':
        from payments.utils import check_quiz_access
        return bool(check_quiz_access(user)[0])
    if area == 'interview':
        from payments.utils import check_interview_access
        return bool(check_interview_access(user)[0])
    from exams.views import _get_user_full_access  # lazy: avoids an import cycle
    return bool(_get_user_full_access(user))


def subscription_payload(area='exams', message=None, **extra):
    body = {
        'error': message or AREA_MESSAGES.get(area, AREA_MESSAGES['exams']),
        'code': 'subscription_required',
        'upgrade_url': UPGRADE_URL,
    }
    body.update(extra)
    return body


def require_subscription(user, area='exams', message=None):
    """Raise a 402 (rendered by DRF) unless `user` has full access to `area`."""
    if not has_full_access(user, area):
        raise SubscriptionRequired(subscription_payload(area, message))


# ----------------------------------------------------------------------
# 10 free questions across Practice + Exams
# ----------------------------------------------------------------------
def _answered_questions(user):
    from exams.models import UserAnswer
    return (UserAnswer.objects.filter(session__user=user)
            .exclude(selected_answer__in=['SKIPPED', 'NOT_ANSWERED', ''])
            .values_list('question_id', flat=True).distinct())


def free_questions_used(user):
    if not user or not getattr(user, 'is_authenticated', False):
        return 0
    return _answered_questions(user).count()


def free_questions_remaining(user):
    return max(0, FREE_QUESTION_LIMIT - free_questions_used(user))


def can_answer_question(user, question_id):
    """
    Free users may answer a question if it is one of the questions they have
    already answered (re-tries never cost another free question) or if they
    still have free questions left.
    """
    if has_full_access(user, 'exams'):
        return True
    if _answered_questions(user).filter(question_id=question_id).exists():
        return True
    return free_questions_remaining(user) > 0


def free_question_status(user):
    full = has_full_access(user, 'exams')
    used = 0 if full else free_questions_used(user)
    return {
        'full_access': full,
        'free_questions_limit': None if full else FREE_QUESTION_LIMIT,
        'free_questions_used': used,
        'free_questions_remaining': None if full else max(0, FREE_QUESTION_LIMIT - used),
    }
