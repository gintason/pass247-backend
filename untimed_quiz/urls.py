
from django.urls import path
from .views import untimed_quiz_view
from .import views

app_name = 'untimed_quiz'

urlpatterns = [

     path("quiz2/", views.quiz2_page, name="quiz2_page"), # Category selection page
     path("quiz2/results/", views.quiz2_result, name="quiz2_result"),
     path("quiz2/start/<int:category_id>/", views.start_quiz2, name="start_quiz2"),  # Start quiz with category
     # Add these to your urlpatterns

]

   
