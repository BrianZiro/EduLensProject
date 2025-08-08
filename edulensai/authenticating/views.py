from django.shortcuts import render

def homepage(request):
    return render(request,'auth/index.html')
def register(request):
    return render(request,'auth/register.html')
def login(request):
    return render(request,'auth/login.html')
def dashboard(request):
    return render(request,'auth/dashboard.html')