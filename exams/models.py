from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class ExamCategory(models.Model):
    """Main exam categories: JSSCE, WAEC/NECO, UTME/JAMB, Post-UTME"""
    EXAM_TYPES = [
        ('JSS', 'JSSCE'),
        ('WASSCE', 'WAEC/NECO'),
        ('UTME', 'UTME/JAMB'),
        ('POST_UTME', 'Post-UTME'),
        ('POST_UTME', 'Post-UTME'),
         ('APTITUDE', 'Aptitude Tests'),
        ('PROMOTION', 'Promotion Exams'),
        ('CIVIL', 'Civil Service Exams'),
    ]
    
    name = models.CharField(max_length=50, choices=EXAM_TYPES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, help_text="Font Awesome icon class", default="fa-book")
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Exam Categories"
        ordering = ['order', 'name']

        def __str__(self):
            return self.display_name


class Subject(models.Model):
    """Subjects like Mathematics, English, Physics, etc."""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    exam_categories = models.ManyToManyField(ExamCategory, related_name='subjects')
    icon = models.CharField(max_length=50, help_text="Font Awesome icon class", default="fa-calculator")
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class ExamYear(models.Model):
    """Year of examination"""
    year = models.PositiveIntegerField()
    exam_category = models.ForeignKey(ExamCategory, on_delete=models.CASCADE, related_name='years')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-year']
        unique_together = ['year', 'exam_category']

    def __str__(self):
        return f"{self.exam_category.display_name} - {self.year}"


class Question(models.Model):
    """Main question model"""
    DIFFICULTY_LEVELS = [
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    ]
    
    QUESTION_TYPES = [
        ('OBJECTIVE', 'Objective (Multiple Choice)'),
        ('THEORY', 'Theory'),
    ]
    
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='OBJECTIVE')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='questions')
    exam_category = models.ForeignKey(ExamCategory, on_delete=models.CASCADE, related_name='questions')
    exam_year = models.ForeignKey(ExamYear, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_LEVELS, default='MEDIUM')
    marks = models.PositiveIntegerField(default=1)
    time_limit_seconds = models.PositiveIntegerField(
        null=True, 
        blank=True,
        help_text="Time limit for this question in seconds (for theory/time-based questions)"
    )
    
    # For objective questions
    option_a = models.CharField(max_length=500, blank=True)
    option_b = models.CharField(max_length=500, blank=True)
    option_c = models.CharField(max_length=500, blank=True)
    option_d = models.CharField(max_length=500, blank=True)
    option_e = models.CharField(max_length=500, blank=True, null=True)
    
    # Correct answer for objective questions
    correct_answer = models.CharField(
        max_length=10, 
        choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D'), ('E', 'E')],
        blank=True
    )
    
    # For theory questions
    model_answer = models.TextField(blank=True, help_text="Model answer for theory questions")
    marking_guide = models.TextField(blank=True, help_text="Guide for marking theory questions")
    
    # Explanation and references
    explanation = models.TextField(blank=True, help_text="Explanation of the correct answer")
    reference = models.CharField(max_length=255, blank=True, help_text="Reference source")
    
    # Media attachments
    question_image = models.ImageField(upload_to='questions/images/', blank=True, null=True)
    question_audio = models.FileField(upload_to='questions/audio/', blank=True, null=True)
    
    # Metadata
    is_published = models.BooleanField(default=True)
    times_used = models.PositiveIntegerField(default=0, help_text="Number of times this question has been used in exams")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['subject', 'id']

    def __str__(self):
        return f"{self.subject.name}: {self.question_text[:50]}..."

    def get_correct_answer_display(self):
        if self.question_type == 'OBJECTIVE' and self.correct_answer:
            return getattr(self, f'option_{self.correct_answer.lower()}', '')
        return self.model_answer


class QuestionBank(models.Model):
    """Collection of questions for practice or exams"""
    name = models.CharField(max_length=200)
    description = models.TextField()
    exam_category = models.ForeignKey(ExamCategory, on_delete=models.CASCADE, related_name='question_banks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='question_banks')
    exam_year = models.ForeignKey(ExamYear, on_delete=models.SET_NULL, null=True, blank=True)
    questions = models.ManyToManyField(Question, related_name='question_banks')
    duration_minutes = models.PositiveIntegerField(default=60, help_text="Duration for full exam mode")
    total_marks = models.PositiveIntegerField(default=100)
    pass_mark = models.PositiveIntegerField(default=50, help_text="Minimum marks to pass")
    is_free = models.BooleanField(default=True, help_text="Is this question bank free or paid?")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Free trial settings
    free_trial_questions = models.PositiveIntegerField(default=5, help_text="Number of free questions available")
    has_free_trial = models.BooleanField(default=True, help_text="Whether this bank offers free trial questions")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject.name}"


class UserSubscription(models.Model):
    """Track user subscriptions to question banks"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    question_bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE, related_name='subscriptions')
    subscription_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    class Meta:
        unique_together = ['user', 'question_bank']
    
    def __str__(self):
        return f"{self.user.username} - {self.question_bank.name}"


class FreeTrialUsage(models.Model):
    """Track free trial usage per user per subject"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='free_trial_usage')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    questions_answered = models.PositiveIntegerField(default=0)
    last_answered_date = models.DateTimeField(auto_now=True)
    has_upgraded = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['user', 'subject']
    
    def __str__(self):
        return f"{self.user.username} - {self.subject.name}: {self.questions_answered}/5"


class PracticeSession(models.Model):
    """Track user practice sessions"""
    SESSION_TYPES = [
        ('PRACTICE', 'Practice Mode'),
        ('EXAM', 'Exam Mode'),
        ('TIMED', 'Timed Practice'),
    ]
    
    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('ABANDONED', 'Abandoned'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='practice_sessions')
    question_bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE, related_name='sessions')
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES, default='PRACTICE')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    
    # Practice mode settings
    show_explanation_on_wrong = models.BooleanField(default=True, help_text="Show explanation when answer is wrong")
    allow_review = models.BooleanField(default=True, help_text="Allow reviewing questions after answering")
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    
    # Results
    total_questions = models.PositiveIntegerField(default=0)
    answered_questions = models.PositiveIntegerField(default=0)
    correct_answers = models.PositiveIntegerField(default=0)
    wrong_answers = models.PositiveIntegerField(default=0)
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    percentage = models.FloatField(default=0.0)
    
    # For exam mode
    is_submitted = models.BooleanField(default=False)
    
    # Current question tracking
    current_question_index = models.PositiveIntegerField(default=0)
    questions_order = models.JSONField(default=list, blank=True, help_text="Ordered list of question IDs")
    
    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.username} - {self.question_bank.name} - {self.started_at.date()}"

    def calculate_score(self):
        """Calculate session score"""
        if self.total_questions > 0:
            # Count correct answers from UserAnswer records
            correct_count = self.answers.filter(is_correct=True).count()
            wrong_count = self.answers.filter(is_correct=False).count()
            
            self.correct_answers = correct_count
            self.wrong_answers = wrong_count
            self.answered_questions = self.answers.exclude(
                selected_answer__in=['SKIPPED', 'NOT_ANSWERED']
            ).count()
            
            self.percentage = (correct_count / self.total_questions) * 100
            self.score = correct_count
            self.save()

    def get_next_question(self):
        """Get the next question in the session"""
        if self.current_question_index < len(self.questions_order):
            question_id = self.questions_order[self.current_question_index]
            try:
                return Question.objects.get(id=question_id)
            except Question.DoesNotExist:
                return None
        return None

    def move_to_next_question(self):
        """Move to the next question"""
        if self.current_question_index < len(self.questions_order) - 1:
            self.current_question_index += 1
            self.save()
            return True
        return False


class UserAnswer(models.Model):
    """Store user answers for each question in a session"""
    session = models.ForeignKey(PracticeSession, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answer = models.CharField(max_length=500, blank=True)  # For objective: 'A', 'B', etc.; For theory: text
    is_correct = models.BooleanField(null=True, blank=True)
    points_earned = models.PositiveIntegerField(default=0)  # ← ADD THIS LINE
    
    # For practice mode with instant feedback
    feedback_shown = models.BooleanField(default=False, help_text="Whether feedback was shown to user")
    feedback_viewed_at = models.DateTimeField(null=True, blank=True)
    
    # Time tracking
    time_spent_seconds = models.PositiveIntegerField(default=0)
    answered_at = models.DateTimeField(auto_now_add=True)
    
    # For theory questions (to be graded later)
    teacher_grade = models.PositiveIntegerField(null=True, blank=True)
    teacher_feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_answers')
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['session', 'question']

    def __str__(self):
        return f"Answer for Q{self.question.id} in session {self.session.id}"


class UserPerformance(models.Model):
    """Track overall user performance per subject"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    exam_category = models.ForeignKey(ExamCategory, on_delete=models.CASCADE)
    
    # Statistics
    total_practices = models.PositiveIntegerField(default=0)
    total_questions_attempted = models.PositiveIntegerField(default=0)
    total_correct = models.PositiveIntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    best_score = models.FloatField(default=0.0)
    weakest_topics = models.JSONField(default=list, blank=True)
    strongest_topics = models.JSONField(default=list, blank=True)
    
    # Time tracking
    last_practiced = models.DateTimeField(null=True, blank=True)
    total_time_spent_minutes = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'subject', 'exam_category']
        ordering = ['-average_score']

    def __str__(self):
        return f"{self.user.username} - {self.subject.name} Performance"


class ExamResult(models.Model):
    """Store exam results and send via email"""
    session = models.OneToOneField(PracticeSession, on_delete=models.CASCADE, related_name='exam_result')
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Detailed breakdown
    subject_scores = models.JSONField(default=dict, blank=True)  # Score per subject
    topic_performance = models.JSONField(default=dict, blank=True)  # Performance by topic
    time_taken = models.CharField(max_length=50, blank=True)  # Formatted time
    
    # Certificate (if applicable)
    certificate_generated = models.BooleanField(default=False)
    certificate_url = models.URLField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Result for {self.session} - Score: {self.session.percentage}%"


class Bookmark(models.Model):
    """Allow users to bookmark questions for later review"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='bookmarked_by')
    notes = models.TextField(blank=True, help_text="Personal notes about this question")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'question']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} bookmarked Q{self.question.id}"

# Add these models at the end of exams/models.py

class StudyNotes(models.Model):
    """Study notes for each subject"""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='study_notes')
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, help_text="Main study content")
    topics = models.JSONField(default=list, blank=True, help_text="List of topics with descriptions and key points")
    formulas = models.JSONField(default=list, blank=True, help_text="List of important formulas")
    references = models.JSONField(default=list, blank=True, help_text="Recommended reference materials")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_study_notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Study Notes"
        ordering = ['subject', 'title']
        unique_together = ['subject', 'title']

    def __str__(self):
        return f"{self.subject.name} - {self.title}"


class PastQuestionCollection(models.Model):
    """Collection of past questions organized by subject and year"""
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='past_question_collections')
    exam_category = models.ForeignKey(ExamCategory, on_delete=models.CASCADE, related_name='past_question_collections')
    exam_year = models.ForeignKey(ExamYear, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=200, help_text="e.g., WAEC Mathematics 2020")
    description = models.TextField(blank=True)
    questions = models.ManyToManyField(Question, related_name='past_question_collections')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-exam_year__year', 'subject']
        unique_together = ['subject', 'exam_category', 'exam_year']

    def __str__(self):
        return f"{self.exam_category.display_name} {self.subject.name} {self.exam_year.year if self.exam_year else ''}"