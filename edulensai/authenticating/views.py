from django.shortcuts import render,redirect
from .forms import CreateUserForm,LoginForm

def homepage(request):

    return render(request,'auth/index.html')
def register(request):
    form = CreateUserForm()
    if request.method == 'POST':
        form = CreateUserForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('dashboard')
    
    context = {'registrationform':form}
    return render(request,'auth/register.html',context=context)
def login(request):
    return render(request,'auth/login.html')
def dashboard(request):
    return render(request,'auth/dashboard.html')