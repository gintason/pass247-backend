from django.db import models
import uuid
import random
import string
import difflib

# Create your models here.

class BaseModel(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at=models.DateField(auto_now_add=True)
    updated_at= models.DateField(auto_now_add=True)

    class Meta:
        abstract=True

class Category(BaseModel):
    category_name=models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'categories'

    def __str__(self) -> str:
        return self.category_name

class Question(models.Model):
    id = models.AutoField(primary_key=True)
    category = models.ForeignKey(Category, related_name='questions', on_delete=models.CASCADE)
    question = models.TextField()
    correct_answers = models.TextField()  # Comma-separated essay answers or variations
    # Optional supplementary content (populated via bulk upload / admin).
    options = models.TextField(blank=True, default='', help_text="Optional choices/options, e.g. pipe- or comma-separated.")
    explanation = models.TextField(blank=True, default='', help_text="Optional explanation / answer details shown after submission.")

    def clean_text(self, text):
        text = text.lower().strip()
        text = text.translate(str.maketrans('', '', string.punctuation))  # remove punctuation
        return text

    def check_answer(self, user_answer, threshold=0.55):  # 50% match threshold
        user_clean = self.clean_text(user_answer)

        correct_list = [self.clean_text(ans) for ans in self.correct_answers.split(",") if ans.strip()]

        for correct in correct_list:
            similarity = difflib.SequenceMatcher(None, user_clean, correct).ratio()
            if similarity >= threshold:
                return True  # Accept answer if similarity is >= 85%
        return False
    

    def __str__(self):
        return self.question
   

 
