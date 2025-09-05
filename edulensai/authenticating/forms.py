from django.contrib.auth.forms import UserCreationForm,AuthenticationForm

from django.contrib.auth.models import User

from django import forms

from django.forms.widgets import PasswordInput,TextInput

from .models import Profile


class CreateUserForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username','first_name','last_name','email','password1','password2']

class LoginForm(AuthenticationForm): 

    username = forms.CharField(widget=TextInput())
    password = forms.CharField(widget=PasswordInput())

class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username','email']

class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Profile
        fields = ['image']