from django.db import models
from django.contrib.auth.models import User
from datetime import timedelta, datetime
from django.utils.timezone import now
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import UserActivity  # This should be at the top of the file

# ✅ Default expiry fallback (90 days if no plan is chosen)
def get_default_expiry():
    return now() + timedelta(days=90)


class SubscriptionPlan(models.Model):
    PLAN_TYPES = [
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
        ('LIFETIME', 'Lifetime'),
    ]
    
    name = models.CharField(max_length=50, unique=True)
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='MONTHLY')
    price = models.PositiveIntegerField()  # price in Naira
    duration_days = models.PositiveIntegerField()  # e.g. 30, 90, 365
    description = models.TextField(blank=True)
    features = models.JSONField(default=list, blank=True)  # List of features
    is_popular = models.BooleanField(default=False)
    discount_percentage = models.PositiveIntegerField(default=0)
    exam_categories = models.ManyToManyField('exams.ExamCategory', blank=True, 
                                             help_text="Exam categories included in this plan")
    subjects = models.ManyToManyField('exams.Subject', blank=True,
                                      help_text="Subjects included in this plan")
    quiz_categories = models.ManyToManyField('quiz.Category', blank=True,
                                             help_text="Quiz categories included in this plan")
    interview_products = models.ManyToManyField('pasApp.Product', blank=True,
                                                help_text="Interview products included in this plan")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['price']

    def __str__(self):
        return f"{self.name} - ₦{self.price}"

    def get_discounted_price(self):
        if self.discount_percentage > 0:
            discount = (self.price * self.discount_percentage) / 100
            return self.price - discount
        return self.price


class Payment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, unique=True)
    email = models.EmailField()
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # ✅ expiry_date must point to a function, not an inline def
    expiry_date = models.DateTimeField(default=get_default_expiry)

    # ✅ link to subscription plan
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True
    )

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    # Payment metadata
    payment_method = models.CharField(max_length=50, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # For tracking
    last_webhook_received = models.DateTimeField(null=True, blank=True)
    webhook_attempts = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.amount} - Expires on {self.expiry_date}"

    def is_expired(self):
        return self.expiry_date and now() > self.expiry_date
    
    def save(self, *args, **kwargs):
        # ✅ If plan is chosen and no expiry → set expiry from plan
        if self.plan and not self.expiry_date:
            self.expiry_date = now() + timedelta(days=self.plan.duration_days)

        # ✅ If no plan and no expiry → fallback to 90 days
        if not self.plan and not self.expiry_date:
            self.expiry_date = get_default_expiry()

        # If payment is successful, set paid_at
        if self.status == 'success' and not self.paid_at:
            self.paid_at = now()

        super().save(*args, **kwargs)


class UserPlanSubscription(models.Model):  # RENAMED
    """Track active plan subscriptions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='plan_subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='plan_subscription')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    auto_renew = models.BooleanField(default=False)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Plan Subscription"
        verbose_name_plural = "Plan Subscriptions"

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"

    def is_valid(self):
        return self.is_active and now() <= self.end_date

    def days_remaining(self):
        if self.is_valid():
            return max(0, (self.end_date - now()).days)
        return 0


class PaymentWebhookLog(models.Model):
    """Log all webhook events for debugging"""
    event_type = models.CharField(max_length=100)
    reference = models.CharField(max_length=100, db_index=True)
    payload = models.JSONField()
    verified = models.BooleanField(default=False)
    processed = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} - {self.reference}"


@receiver(post_save, sender=Payment)
def update_user_subscription(sender, instance, created, **kwargs):
    """Update user profile and create subscription when payment is successful"""
    if instance.status == 'success' and instance.verified:
        profile = instance.user.profile
        profile.is_premium = True
        profile.premium_expiry = instance.expiry_date
        profile.save()
        
        # Create or update plan subscription
        subscription, created = UserPlanSubscription.objects.update_or_create(
            user=instance.user,
            payment=instance,
            defaults={
                'plan': instance.plan,
                'start_date': instance.paid_at or instance.created_at,
                'end_date': instance.expiry_date,
                'is_active': True
            }
        )
        
        # Log activity
        UserActivity.objects.create(
            user=instance.user,
            activity_type='UPGRADE',
            description=f'Upgraded to {instance.plan.name if instance.plan else "Premium"} plan',
            metadata={
                'plan': instance.plan.name if instance.plan else None,
                'amount': str(instance.amount),
                'reference': instance.reference
            }
        )


@receiver(post_save, sender=UserPlanSubscription)
def update_subscription_status(sender, instance, **kwargs):
    """Update user profile when subscription expires"""
    if not instance.is_valid() and instance.is_active:
        instance.is_active = False
        instance.save()
        
        has_other_active = UserPlanSubscription.objects.filter(
            user=instance.user,
            is_active=True,
            end_date__gt=now()
        ).exists()
        
        if not has_other_active:
            profile = instance.user.profile
            profile.is_premium = False
            profile.save()