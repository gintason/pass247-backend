from django.contrib import admin
from .models import Post

class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'status', 'author', 'created_on', 'image')
    list_filter = ('status', 'author', 'created_on')
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'created_on'
    readonly_fields = ('created_on', 'updated_on')
    list_per_page = 20

admin.site.register(Post, PostAdmin)