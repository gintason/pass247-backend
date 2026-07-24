from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

app_name = 'pasApp'

urlpatterns = [
    path('', views.index, name='home'),
    path('interview/<int:pk>/', views.interview_detail, name='interview_detail'),
    path('search/', views.search_results, name='search_results'),
    path('interview_levels/', views.levels_view, name='levels'),
    path('full_interview/<int:pk>/', views.full_interview, name='full_interview'),
    path('about/', views.about_view, name='about'),
    path('contact/', views.contact_view, name='contact'),
    path('how_it_works/', views.How_it_works_view, name='how_it_works'),
    path('interview_mentoring/', views.interview_mentoring_view, name='interview_mentoring'),
    path('personal_coaching/', views.personal_coaching_view, name='personal_coaching'),
    path('cv_build_up/', views.cv_build_up_view, name='cv_build_up'),
    path('typing_skills/', views.typing_skills_view, name='typing_skills'),
    path('remote_jobs/', views.remote_jobs_view, name='remote_jobs'),
    path('api/test/', views.api_test, name='api_test'),
    

]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)