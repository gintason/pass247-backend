from rest_framework import serializers
from .models import *
from django.contrib.auth import get_user_model

User = get_user_model()

class ExamCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamCategory
        fields = '__all__'


class SubjectSerializer(serializers.ModelSerializer):
    exam_categories = ExamCategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Subject
        fields = '__all__'


class ExamYearSerializer(serializers.ModelSerializer):
    exam_category_name = serializers.CharField(source='exam_category.display_name', read_only=True)
    
    class Meta:
        model = ExamYear
        fields = '__all__'


class QuestionSerializer(serializers.ModelSerializer):
    """
    SECURITY: This serializer is used to send questions to users who have not
    yet answered them (question banks, listing, trial mode). correct_answer,
    model_answer, and marking_guide must NEVER be readable here, or any user
    can read the answer key straight from the API response before answering.
    They remain write_only so admin/staff creation & bulk-upload flows that
    rely on this serializer for writes are unaffected.
    """
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_category_name = serializers.CharField(source='exam_category.display_name', read_only=True)
    
    class Meta:
        model = Question
        fields = '__all__'
        extra_kwargs = {
            'correct_answer': {'write_only': True},
            'model_answer': {'write_only': True},
            'marking_guide': {'write_only': True},
        }


# Add this missing serializer
class QuestionBankSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_category_name = serializers.CharField(source='exam_category.display_name', read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionBank
        fields = '__all__'
    
    def get_question_count(self, obj):
        return obj.questions.count()


class QuestionBankListSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_category_name = serializers.CharField(source='exam_category.display_name', read_only=True)
    question_count = serializers.SerializerMethodField()
    free_trial_remaining = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    
    class Meta:
        model = QuestionBank
        fields = '__all__'
    
    def get_question_count(self, obj):
        return obj.questions.count()
    
    def get_free_trial_remaining(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                trial = FreeTrialUsage.objects.get(
                    user=request.user,
                    subject=obj.subject
                )
                remaining = max(0, obj.free_trial_questions - trial.questions_answered)
                return remaining
            except FreeTrialUsage.DoesNotExist:
                return obj.free_trial_questions
        return obj.free_trial_questions
    
    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserSubscription.objects.filter(
                user=request.user,
                question_bank=obj,
                is_active=True
            ).exists()
        return False


class TrialQuestionSerializer(serializers.ModelSerializer):
    """Serializer for free trial questions (without answers)"""
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'diagram_url', 'essay_paragraph',
                  'option_a', 'option_b', 'option_c', 
                  'option_d', 'option_e', 'question_type', 'difficulty', 
                  'subject', 'explanation', 'question_image']
        read_only_fields = fields


class UpgradePromptSerializer(serializers.Serializer):
    """Serializer for upgrade prompt after free trial"""
    message = serializers.CharField()
    subject = serializers.CharField()
    questions_attempted = serializers.IntegerField()
    upgrade_url = serializers.URLField()
    available_plans = serializers.ListField(child=serializers.DictField())
    

class PracticeSessionSerializer(serializers.ModelSerializer):
    question_bank_name = serializers.CharField(source='question_bank.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PracticeSession
        fields = '__all__'
        read_only_fields = ['user', 'started_at']


class UserAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    
    class Meta:
        model = UserAnswer
        fields = '__all__'
        read_only_fields = ['session', 'answered_at']


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_answer = serializers.CharField(max_length=500)
    time_spent_seconds = serializers.IntegerField(min_value=0)


class ExamResultSerializer(serializers.ModelSerializer):
    session_details = PracticeSessionSerializer(source='session', read_only=True)
    
    class Meta:
        model = ExamResult
        fields = '__all__'


class UserPerformanceSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_category_name = serializers.CharField(source='exam_category.display_name', read_only=True)
    
    class Meta:
        model = UserPerformance
        fields = '__all__'


class QuestionWithExplanationSerializer(serializers.ModelSerializer):
    """Serializer that includes explanation for feedback"""
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_category_name = serializers.CharField(source='exam_category.display_name', read_only=True)
    
    class Meta:
        model = Question
        fields = '__all__'
        # Don't show correct answer in practice mode until after answering
        extra_kwargs = {
            'correct_answer': {'write_only': True},
            'model_answer': {'write_only': True},
            'marking_guide': {'write_only': True},
        }


class CheckAnswerSerializer(serializers.Serializer):
    """Serializer for checking an answer"""
    question_id = serializers.IntegerField()
    selected_answer = serializers.CharField(max_length=500)
    time_spent_seconds = serializers.IntegerField(min_value=0, required=False, default=0)


class AnswerFeedbackSerializer(serializers.Serializer):
    """Serializer for providing feedback on an answer"""
    is_correct = serializers.BooleanField()
    correct_answer = serializers.CharField(allow_blank=True)
    explanation = serializers.CharField(allow_blank=True)
    feedback_message = serializers.CharField()
    next_question_available = serializers.BooleanField()
    question_id = serializers.IntegerField()


class PracticeSessionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for practice session with current question"""
    question_bank_name = serializers.CharField(source='question_bank.name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    current_question = serializers.SerializerMethodField()
    questions_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = PracticeSession
        fields = '__all__'
        read_only_fields = ['user', 'started_at']
    
    def get_current_question(self, obj):
        question = obj.get_next_question()
        if question:
            return QuestionWithExplanationSerializer(question, context=self.context).data
        return None
    
    def get_questions_remaining(self, obj):
        return len(obj.questions_order) - obj.current_question_index
    


# Add these serializers at the end of exams/serializers.py

class StudyNotesSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StudyNotes
        fields = '__all__'


class PastQuestionCollectionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_category_name = serializers.CharField(source='exam_category.display_name', read_only=True)
    exam_year_display = serializers.CharField(source='exam_year.year', read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PastQuestionCollection
        fields = '__all__'
    
    def get_question_count(self, obj):
        return obj.questions.count()


class PastQuestionSerializer(serializers.ModelSerializer):
    """Serializer for past questions with answers for practice.

    NOTE: correct_answer is intentionally readable here. Unlike live
    exam/quiz taking (where the answer must be hidden until submit), the past
    questions tab is a self-study review surface where the user checks their
    own answer client-side. If this serializer is ever reused for a graded
    flow, correct_answer must be gated.
    """
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    exam_category_name = serializers.CharField(source='exam_category.display_name', read_only=True)
    exam_year_display = serializers.CharField(source='exam_year.year', read_only=True, allow_null=True)
    # The frontend's year filter compares `q.exam_year` (and `q.year`) against a
    # parsed integer year. The raw FK id is meaningless there, so expose the
    # actual year value under both keys the component reads.
    exam_year = serializers.IntegerField(source='exam_year.year', read_only=True, allow_null=True)
    year = serializers.IntegerField(source='exam_year.year', read_only=True, allow_null=True)

    class Meta:
        model = Question
        fields = [
            'id', 'question_text', 'question_type', 'option_a', 'option_b',
            'option_c', 'option_d', 'option_e', 'correct_answer', 'explanation',
            'difficulty', 'subject_name', 'exam_category_name', 'exam_year_display',
            'exam_year', 'year', 'reference'
        ]