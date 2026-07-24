from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from datetime import timedelta
import secrets
import uuid


class EmailOTP(models.Model):
    """
    One-time code for verifying ownership of an email address at signup.

    Security notes:

    * The code is generated with `secrets`, not `random` — `random` is a
      predictable Mersenne Twister and must never be used for anything
      security-bearing.
    * Only a HASH of the code is stored. A 6-digit code has just 10^6
      possible values, so if plaintext codes leaked from the database an
      attacker could read live codes directly. Django's password hasher is
      deliberately slow, which also makes offline brute force impractical.
    * Codes are single-use (`consumed_at`), short-lived (`expires_at`) and
      attempt-limited, so an attacker cannot grind the 10^6 space online.
    """

    PURPOSE_SIGNUP = 'SIGNUP'
    PURPOSE_CHOICES = [(PURPOSE_SIGNUP, 'Signup email verification')]

    CODE_LENGTH = 6
    TTL_MINUTES = 10
    MAX_ATTEMPTS = 5

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_otps')
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default=PURPOSE_SIGNUP)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['user', 'purpose', 'consumed_at'])]

    def __str__(self):
        state = 'consumed' if self.consumed_at else ('expired' if self.is_expired() else 'active')
        return f'OTP for {self.user.username} ({state})'

    # -- state ------------------------------------------------------------

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def is_usable(self):
        return (
            self.consumed_at is None
            and not self.is_expired()
            and self.attempts < self.MAX_ATTEMPTS
        )

    # -- issuing ----------------------------------------------------------

    @classmethod
    def issue(cls, user, purpose=PURPOSE_SIGNUP):
        """
        Create a new code for `user`, invalidating any outstanding ones.

        Returns (instance, plaintext_code). The plaintext is returned once,
        for emailing, and is never persisted.
        """
        cls.objects.filter(
            user=user, purpose=purpose, consumed_at__isnull=True
        ).update(consumed_at=timezone.now())

        code = ''.join(secrets.choice('0123456789') for _ in range(cls.CODE_LENGTH))

        otp = cls.objects.create(
            user=user,
            purpose=purpose,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=cls.TTL_MINUTES),
        )
        return otp, code

    # -- verifying --------------------------------------------------------

    @classmethod
    def verify(cls, user, code, purpose=PURPOSE_SIGNUP):
        """
        Check `code` against the user's most recent outstanding OTP.

        Returns (ok, message). On success the OTP is consumed so it cannot
        be replayed. Every attempt is counted, whether or not it matches.
        """
        otp = cls.objects.filter(
            user=user, purpose=purpose, consumed_at__isnull=True
        ).order_by('-created_at').first()

        if otp is None:
            return False, 'No verification code was requested. Request a new one.'

        if otp.is_expired():
            return False, 'That code has expired. Request a new one.'

        if otp.attempts >= cls.MAX_ATTEMPTS:
            # Burn it so further guessing is pointless.
            otp.consumed_at = timezone.now()
            otp.save(update_fields=['consumed_at'])
            return False, 'Too many incorrect attempts. Request a new code.'

        otp.attempts += 1
        otp.save(update_fields=['attempts'])

        if not check_password(code, otp.code_hash):
            remaining = cls.MAX_ATTEMPTS - otp.attempts
            if remaining <= 0:
                otp.consumed_at = timezone.now()
                otp.save(update_fields=['consumed_at'])
                return False, 'Too many incorrect attempts. Request a new code.'
            return False, f'That code is not correct. {remaining} attempt(s) left.'

        otp.consumed_at = timezone.now()
        otp.save(update_fields=['consumed_at'])
        return True, 'Email verified.'


class PasswordReset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reset_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_when = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Password reset for {self.user.username} at {self.created_when}"


class UserProfile(models.Model):
    EXAM_TYPES = [
        ('JSS', 'JSSCE (Junior Secondary)'),
        ('WASSCE', 'WAEC/NECO (Senior Secondary)'),
        ('UTME', 'UTME/JAMB (University Entrance)'),
        ('POST_UTME', 'Post-UTME (University Screening)'),
        ('INTERVIEW', 'Interview Practice'),
    ]
    
    INTEREST_AREAS = [
        ('ACADEMIC', 'Academic Exams'),
        ('INTERVIEW', 'Job Interviews'),
        ('BOTH', 'Both'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    # Exam preferences
    preferred_exam_type = models.CharField(max_length=20, choices=EXAM_TYPES, blank=True)
    interest_area = models.CharField(max_length=20, choices=INTEREST_AREAS, default='ACADEMIC')
    
    # Tracking
    total_practices = models.PositiveIntegerField(default=0)
    total_questions_answered = models.PositiveIntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    total_points = models.PositiveIntegerField(default=0)  # ← ADD THIS LINE
    
    # Subscription info (will be linked to payments app)
    is_premium = models.BooleanField(default=False)
    premium_expiry = models.DateTimeField(null=True, blank=True)
    
    # Profile metadata
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def update_stats(self, score, questions_count):
        """Update user statistics after a practice session"""
        self.total_practices += 1
        self.total_questions_answered += questions_count
        # Recalculate average score
        total_score = self.average_score * (self.total_practices - 1) + score
        self.average_score = total_score / self.total_practices
        self.save()
    
    def add_points(self, points):
        """Add points to user's total"""
        self.total_points = (self.total_points or 0) + points
        self.save()
        return self.total_points


class UserExamProgress(models.Model):
    """Track user progress in specific exams"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_progress')
    exam_type = models.CharField(max_length=20, choices=UserProfile.EXAM_TYPES)
    subject = models.CharField(max_length=100)
    total_questions_attempted = models.PositiveIntegerField(default=0)
    total_correct = models.PositiveIntegerField(default=0)
    last_practiced = models.DateTimeField(auto_now=True)
    best_score = models.FloatField(default=0.0)
    
    class Meta:
        unique_together = ['user', 'exam_type', 'subject']
        verbose_name_plural = "User Exam Progress"

    def __str__(self):
        return f"{self.user.username} - {self.exam_type} - {self.subject}"

    def get_average_score(self):
        if self.total_questions_attempted > 0:
            return (self.total_correct / self.total_questions_attempted) * 100
        return 0


class UserActivity(models.Model):
    """Track user activities for analytics"""
    ACTIVITY_TYPES = [
        ('LOGIN', 'Login'),
        ('PRACTICE_START', 'Started Practice'),
        ('PRACTICE_COMPLETE', 'Completed Practice'),
        ('UPGRADE', 'Upgraded to Premium'),
        ('BOOKMARK', 'Bookmarked Question'),
        ('SHARE', 'Shared Result'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "User Activities"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.activity_type} - {self.created_at}"


# Signal to create user profile when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()