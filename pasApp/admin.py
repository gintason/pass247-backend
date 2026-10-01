from django.contrib import admin
from .models import Interview, Category, Product, ContactMessage

# Register your models here. 

class InterviewAdmin(admin.ModelAdmin):
    list_display=['question', 'answer',]

class ProductAdmin(admin.ModelAdmin):
    list_display= ["name", "description", "image"]

class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'message']

admin.site.register(Interview, InterviewAdmin)
admin.site.register(Category)
admin.site.register(Product, ProductAdmin)
admin.site.register(ContactMessage, ContactMessageAdmin)
