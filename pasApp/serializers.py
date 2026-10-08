from rest_framework import serializers
from .models import Category, Product, Interview, ContactMessage

class CategorySerializer(serializers.ModelSerializer):
    interview_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description', 'interview_count']
    
    def get_interview_count(self, obj):
        return obj.interviews.count()


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    interview_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'image', 'slug', 'category', 
                  'category_name', 'interview_count', 'is_active', 'order']
    
    def get_interview_count(self, obj):
        return obj.interviews.count()


class GatedAnswerMixin:
    """
    Hides `answer` beyond the free allowance (10 answers in total for users
    without a subscription). Applied in the serializer so every endpoint that
    returns interviews - lists, detail, search, featured, bookmarks - obeys it.
    """

    def to_representation(self, obj):
        data = super().to_representation(obj)
        request = self.context.get('request')
        if request is None:
            return data
        from .access import get_gate
        if get_gate(request).allows(obj.id):
            data['is_locked'] = False
        else:
            data['answer'] = None
            data['is_locked'] = True
        return data


class InterviewSerializer(GatedAnswerMixin, serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_bookmarked = serializers.SerializerMethodField()
    
    class Meta:
        model = Interview
        fields = ['id', 'product', 'product_name', 'question', 'answer', 
                  'category', 'category_name', 'difficulty', 'views_count',
                  'is_featured', 'is_bookmarked', 'created_at']
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False


class InterviewListSerializer(GatedAnswerMixin, serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_bookmarked = serializers.SerializerMethodField()
    
    class Meta:
        model = Interview
        fields = ['id', 'product', 'product_name', 'question', 'answer', 
                  'category', 'category_name', 'difficulty', 'views_count', 
                  'is_featured', 'is_bookmarked']
    
    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'subject', 'message', 'created_at']