from rest_framework import serializers
from .models import UntimedCategory, UntimedQuestion, UntimedUserResponse

class UntimedCategorySerializer(serializers.ModelSerializer):
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = UntimedCategory
        fields = ['id', 'name', 'question_count']
    
    def get_question_count(self, obj):
        return obj.untimed_questions.count()


class UntimedQuestionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = UntimedQuestion
        fields = ['id', 'category', 'category_name', 'text', 'hint', 'correct_answer']


class UntimedQuestionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer without correct answer for quiz taking"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = UntimedQuestion
        fields = ['id', 'category', 'category_name', 'text', 'hint']


class UntimedSubmissionSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    user_answer = serializers.CharField(max_length=1000)


class UntimedUserResponseSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    correct_answer = serializers.CharField(source='question.correct_answer', read_only=True)
    
    class Meta:
        model = UntimedUserResponse
        fields = ['id', 'question', 'question_text', 'user_answer', 'is_correct', 'correct_answer']