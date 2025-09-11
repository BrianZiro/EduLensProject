from django.apps import AppConfig


class AuthenticatingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authenticating'

    def ready(self): 
        import authenticating.signals
