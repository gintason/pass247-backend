"""
Auto-set admin users as premium on login
"""
from django.db.models.signals import post_save
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.contrib.auth.models import User


@receiver(user_logged_in)
def set_admin_premium_on_login(sender, request, user, **kwargs):
    """Auto-set admin/staff users as premium when they login"""
    if user.is_authenticated and (user.is_staff or user.is_superuser):
        if hasattr(user, 'profile'):
            if not user.profile.is_premium:
                user.profile.is_premium = True
                user.profile.save()