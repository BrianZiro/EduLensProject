from django.urls import path
from .views import homepage,register,login,dashboard,logout

urlpatterns = [
    path('',homepage,name="homepage"),
    path('register',register,name="register"),
    path('login',login,name="log-in"),
    path('logout',logout,name="log-out"),
    path('dashboard',dashboard,name="dashboard"), 
]