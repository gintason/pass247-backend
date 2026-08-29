from django.db import models
from django.contrib.auth.models import User
from difflib import SequenceMatcher  # To compare similarity between two texts

class UntimedCategory(models.Model):
    """Model to store different question categories for the untimed quiz"""
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name


class UntimedQuestion(models.Model):
    """Model for untimed quiz questions"""
    category = models.ForeignKey(UntimedCategory, on_delete=models.CASCADE, related_name="untimed_questions")
    text = models.TextField()  # The question text
    hint = models.TextField(blank=True, null=True)  # A hint for the question
    correct_answer = models.TextField()  # The correct answer
    # Optional supplementary content (populated via bulk upload / admin).
    options = models.TextField(blank=True, default='', help_text="Optional choices/options, e.g. pipe- or comma-separated.")
    explanation = models.TextField(blank=True, default='', help_text="Optional explanation / answer details.")

    def __str__(self):
        return f"{self.category.name} - {self.text[:50]}"  # Show category & preview of the question


class UntimedUserResponse(models.Model):
    """Model to store user's answers in the untimed quiz"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # Link to the user
    question = models.ForeignKey(UntimedQuestion, on_delete=models.CASCADE)  # Link to the question
    user_answer = models.TextField()  # The user's answer
    is_correct = models.BooleanField(default=False)  # Whether the answer is correct

    def save(self, *args, **kwargs):
        """Check if user's answer is at least 50% similar to the correct answer"""
        similarity = self.calculate_similarity(self.user_answer, self.question.correct_answer)
        self.is_correct = similarity >= 0.5  # Mark as correct if similarity is 50% or more
        super().save(*args, **kwargs)

    @staticmethod
    def calculate_similarity(answer1, answer2):
        """Calculate similarity percentage between two answers"""
        return SequenceMatcher(None, answer1.lower().strip(), answer2.lower().strip()).ratio()

    def __str__(self):
        return f"{self.user.username} - {self.question.text[:50]} - {'Correct' if self.is_correct else 'Incorrect'}"
