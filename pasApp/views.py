from django.shortcuts import render
from .models import Product, Interview
from django.contrib.auth.decorators import login_required
from Blog.models import Post
from payments.models import Payment
from django.contrib import messages
from .forms import ContactForm
from django.shortcuts import render, redirect
from payments.utils import subscription_required  # Import the decorator
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json

# Create your views here.


def index(request):

    product = Product.objects.all()
    posts = Post.objects.filter(status=1).order_by('-created_on')[:20]
    context = {'products': product, 'posts':posts}


    return render(request, 'pasApp/index.html', context)

@login_required(login_url='users:login')
def interview_detail(request, pk):
    product = Product.objects.get(id=pk)
    interview = product.interview_set.all()[:2]

    # Store the product ID in the session before payment
    request.session['product_id'] = pk

    context = {'products': product, 'interview': interview}
    return render(request, 'pasApp/interview_detail.html', context)



@login_required(login_url='users:login')
@subscription_required
def full_interview(request, pk):
    product = Product.objects.get(id=pk)
    interview = product.interview_set.all()
    
    context = {'products': product, 'interview': interview}
    return render(request, 'pasApp/full_interviews.html', context)


@login_required(login_url='users:login')
def search_results(request):
    if request.method == "POST":
        searched = request.POST.get('searched', '').strip()  # Get and clean input
        
        if searched:
            products = Product.objects.filter(name__icontains=searched)
            if not products:  # If no products are found
                message = f'No results found for "{searched}".'
            else:
                message = None
        else:
            products = Product.objects.all()
            message = None  # No message if showing all products
        
        return render(request, 'pasApp/search_results.html', {
            'searched': searched, 
            'products': products, 
            'message': message
        })
    else:
        return render(request, 'pasApp/search_results.html', {})

    

@login_required(login_url='users:login')
def levels_view(request):
     product = Product.objects.all()
     context = {'products':product}
     
     return render(request, 'pasApp/interview_levels.html',  context)

def about_view(request):

    return render(request, 'pasApp/about.html')


def How_it_works_view(request):

    return render(request, 'pasApp/how_it_works.html')

def interview_mentoring_view(request):

    return render(request, 'pasApp/interview_mentoring.html')


def personal_coaching_view(request):

    return render(request, 'pasApp/personal_coaching.html')


def contact_view(request):

    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Your message has been sent successfully!")
            return redirect('pasApp:contact')  # Replace with the actual URL name for the contact page
    else:
        form = ContactForm()

    return render(request, 'pasApp/contact.html', {'form': form})
   

def cv_build_up_view(request):

    return render(request,'pasApp/cv_build_up.html')


def typing_skills_view(request):

    return render(request, "pasApp/typing_skills.html")


def remote_jobs_view(request):

    return render(request, "pasApp/remote_jobs.html")


@csrf_exempt
def api_test(request):
    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'message': 'API is working!',
            'user': str(request.user) if request.user.is_authenticated else 'Anonymous'
        })
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            return JsonResponse({
                'status': 'success',
                'received_data': data
            })
        except:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)