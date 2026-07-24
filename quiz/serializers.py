from rest_framework import serializers
from .models import Category, Question
from pasApp.models import Product

class CategorySerializer(serializers.ModelSerializer):
    """
    NOTE ON THE `id` FIELD

    quiz.Category inherits BaseModel, whose primary key is
    `uid = UUIDField(primary_key=True)`. There is no `id` column, so
    declaring 'id' in Meta.fields raised
    ImproperlyConfigured: Field name `id` is not valid for model `Category`
    on every request - i.e. /api/quiz/categories/ returned HTTP 500 for all
    users, authenticated or not.

    We expose `uid` under the key `id` rather than renaming the field,
    because the frontend already reads `category.id` (InterviewDetail.jsx).
    Keeping the key stable avoids a breaking API change.
    """
    id = serializers.UUIDField(source='uid', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'category_name']


class QuestionSerializer(serializers.ModelSerializer):
    """
    Default serializer for quiz questions.

    SECURITY: `correct_answers` is deliberately NOT exposed. This serializer
    backs every question-listing endpoint (list, retrieve, random,
    category_questions), so including the answer key here meant any client
    could read the answers straight out of the API response before answering
    - the same bug previously fixed in the exams app.

    It is kept writable so admin create/update endpoints can still set the
    answers; `write_only` means the value can be sent in but never read back.
    Use QuestionAdminSerializer where the answers genuinely need to be shown
    (admin listings, post-submission review).
    """
    category_name = serializers.CharField(source='category.category_name', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'category', 'category_name', 'question', 'correct_answers']
        extra_kwargs = {
            'correct_answers': {'write_only': True},
        }


class QuestionAdminSerializer(serializers.ModelSerializer):
    """
    Full serializer INCLUDING correct_answers.

    Only use this behind an admin check (is_admin(request.user)) or after a
    user has submitted an answer and is reviewing results.
    """
    category_name = serializers.CharField(source='category.category_name', read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'category', 'category_name', 'question', 'correct_answers']


class QuizSubmissionSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    user_answer = serializers.CharField(max_length=1000)
    time_spent = serializers.IntegerField(required=False, default=0)


class QuizResultSerializer(serializers.Serializer):
    score = serializers.IntegerField()
    total = serializers.IntegerField()
    correct = serializers.IntegerField()
    wrong = serializers.IntegerField()
    percent = serializers.FloatField()
    time_taken = serializers.CharField(required=False)
    answers = serializers.ListField(child=serializers.DictField())