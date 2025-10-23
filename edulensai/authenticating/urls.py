from django.urls import path
from .views import homepage,register,login,dashboard,logout,profile,student_prediction
from django.contrib.auth import views as auth_views

urlpatterns = [

    path('',homepage,name="homepage"),
    path('register',register,name="register"),
    path('login',login,name="log-in"),
    path('logout',logout,name="log-out"),
    path('dashboard',dashboard,name="dashboard"), 
    path('profile',profile,name="profile"), 
    path('reset_password/',auth_views.PasswordResetView.as_view(template_name="auth/password_reset.html"),name="reset_password"),
    path('reset_password_sent/',auth_views.PasswordResetDoneView.as_view(template_name="auth/password_reset_sent.html"),name="password_reset_done"),
    path('reset/<uidb64>/<token>/',auth_views.PasswordResetConfirmView.as_view(template_name="auth/password_reset_form.html"),name="password_reset_confirm"),
    path('reset_password_complete/',auth_views.PasswordResetCompleteView.as_view(template_name="auth/password_reset_done.html"),name="password_reset_complete"),
    # Add this line to the urlpatterns list
    path('predict/', student_prediction, name='predict'),
    
]
