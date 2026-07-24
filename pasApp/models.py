from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    icon = models.CharField(max_length=50, default='fa-briefcase')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']
  
    def __str__(self): 
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.name.lower().replace(' ', '-')
        super().save(*args, **kwargs)


class Product(models.Model):
    name = models.CharField(max_length=225)
    description = models.CharField(max_length=255)
    image = models.ImageField(upload_to='products/')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    slug = models.SlugField(unique=True, blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.name.lower().replace(' ', '-').replace('/', '-')
        super().save(*args, **kwargs)


class Interview(models.Model):
    DIFFICULTY_CHOICES = [
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
        ('EXPERT', 'Expert'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='interviews')
    question = models.CharField(max_length=500)
    answer = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='interviews')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='INTERMEDIATE')
    views_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']
  
    def __str__(self):
        return self.question


class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Message from {self.name}"


class InterviewBookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interview_bookmarks')
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'interview']

    def __str__(self):
        return f"{self.user.username} - {self.interview.question[:50]}"