from django.urls import path
from .views import homepage,register,login,dashboard

urlpatterns = [
    path('',homepage,name="homepage"),
    path('register',register,name="register"),
    path('login',login,name="login"),
    path('dashboard',dashboard,name="dashboard"),
    
]