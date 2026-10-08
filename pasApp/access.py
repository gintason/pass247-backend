"""Free users can read 10 interview answers in total; subscribers read all."""
from utils.access import FREE_INTERVIEW_LIMIT, has_full_access


class InterviewAnswerGate:
    """
    Decides, per request, which interview answers the user may see. Opening
    an answer the user has not seen before uses one of their free answers.
    """

    def __init__(self, user):
        from .models import InterviewAccess
        self.user = user
        self.signed_in = bool(user and user.is_authenticated)
        self.full = has_full_access(user, 'interview')
        self.unlocked = set()
        if self.signed_in and not self.full:
            self.unlocked = set(InterviewAccess.objects.filter(user=user)
                                .values_list('interview_id', flat=True))

    @property
    def remaining(self):
        if self.full:
            return None
        return max(0, FREE_INTERVIEW_LIMIT - len(self.unlocked)) if self.signed_in else 0

    def allows(self, interview_id):
        if self.full:
            return True
        if not self.signed_in:
            return False
        if interview_id in self.unlocked:
            return True
        if len(self.unlocked) < FREE_INTERVIEW_LIMIT:
            from .models import InterviewAccess
            InterviewAccess.objects.get_or_create(user=self.user, interview_id=interview_id)
            self.unlocked.add(interview_id)
            return True
        return False

    def summary(self):
        return {
            'full_access': self.full,
            'free_interviews_limit': None if self.full else FREE_INTERVIEW_LIMIT,
            'free_interviews_used': len(self.unlocked),
            'free_interviews_remaining': self.remaining,
            'upgrade_url': '/payment-plans',
        }


def get_gate(request):
    """One gate per request, shared by every serializer call."""
    gate = getattr(request, '_interview_gate', None)
    if gate is None:
        gate = InterviewAnswerGate(request.user)
        setattr(request, '_interview_gate', gate)
    return gate
