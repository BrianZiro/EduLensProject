from django.shortcuts import render,redirect
from .forms import CreateUserForm,LoginForm,UserUpdateForm, ProfileUpdateForm
from django.contrib.auth.models import auth
from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from .ml_utils import predict_student_outcome

def homepage(request):
    return render(request,'auth/homepage.html')

def register(request):
    form = CreateUserForm()
    if request.method == 'POST':
        form = CreateUserForm(request.POST)
        if form.is_valid():
            user = form.save()
            auth.login(request,user)
            return redirect('dashboard')
    
    context = {'registrationform':form}
    return render(request,'auth/register.html',context=context)

def login(request):
    form = LoginForm()
    if request.method == 'POST':
        form = LoginForm(request,data=request.POST)
        if form.is_valid():
            username = request.POST.get('username')
            password = request.POST.get('password')

            user = authenticate(request,username=username,password=password)
            if user is not None:
                auth.login(request,user)
                return redirect('dashboard')

    context = {'loginform':form}
    return render(request,'auth/login.html',context=context)

def logout(request):
    auth.logout(request)
    return redirect('log-in')

@login_required(login_url='log-in')
def dashboard(request):
    return render(request,'auth/edu.html')

@login_required
def profile(request):
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST,
                                   request.FILES,
                                   instance=request.user.profile)
        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            return redirect('profile')
    else:
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=request.user.profile)

    context = {
        'u_form': u_form,
        'p_form': p_form
    }
    return render(request, 'auth/profile.html', context=context)

           
def student_prediction(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            attendance = float(data.get("attendance"))
            test_score = float(data.get("test_score")) 
            parental_involvement = int(data.get("parental_involvement"))
            discipline_count = int(data.get("discipline_count"))
            
            print(f"Received prediction request: attendance={attendance}, test_score={test_score}, parental_involvement={parental_involvement}, discipline_count={discipline_count}")
            
            # Use your real XGBoost model
            result = predict_student_outcome(attendance, test_score, parental_involvement, discipline_count)
            print(f"XGBoost model prediction result: {result}")
            
            # Determine risk level based on model output
            if result >= 0.7:
                risk_level = "High"
            elif result >= 0.4:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            print(f"Final risk level: {risk_level}")
            
            return JsonResponse({
                'success': True,
                'prediction': float(result),
                'risk_level': risk_level,
                'confidence': float(result),
                'model_used': 'XGBoost',
                'debug_info': {
                    'raw_prediction': float(result)
                }
            })
        except Exception as e:
            print(f"Error in student_prediction: {e}")
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)