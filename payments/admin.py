from django.contrib import admin
from .models import Payment, SubscriptionPlan, UserPlanSubscription, PaymentWebhookLog


class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'amount', 'reference', 'plan', 'status', 'verified', 'created_at']
    list_filter = ['status', 'verified', 'plan']
    search_fields = ['user__username', 'user__email', 'reference']
    readonly_fields = ['created_at', 'paid_at', 'last_webhook_received']
    actions = ['mark_as_verified']

    def mark_as_verified(self, request, queryset):
        queryset.update(verified=True, status='success')
    mark_as_verified.short_description = "Mark selected payments as verified"


class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan_type', 'price', 'duration_days', 'is_popular', 'discount_percentage']
    list_filter = ['plan_type', 'is_popular']
    filter_horizontal = ['exam_categories', 'subjects', 'quiz_categories', 'interview_products']


class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'start_date', 'end_date', 'is_active', 'auto_renew']
    list_filter = ['is_active', 'auto_renew', 'plan']
    search_fields = ['user__username', 'user__email']


class PaymentWebhookLogAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'reference', 'verified', 'processed', 'created_at']
    list_filter = ['event_type', 'verified', 'processed']
    readonly_fields = ['payload']


admin.site.register(Payment, PaymentAdmin)
admin.site.register(SubscriptionPlan, SubscriptionPlanAdmin)
admin.site.register(UserPlanSubscription, UserSubscriptionAdmin)
admin.site.register(PaymentWebhookLog, PaymentWebhookLogAdmin)