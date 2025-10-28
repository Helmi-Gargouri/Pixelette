from django.contrib.auth.backends import BaseBackend
from Pixelette.models import Utilisateur

class UtilisateurBackend(BaseBackend):
    """
    Backend d'authentification pour le modèle Utilisateur custom
    """
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            user = Utilisateur.objects.get(email=email)
            from django.contrib.auth.hashers import check_password
            if check_password(password, user.password):
                return user
        except Utilisateur.DoesNotExist:
            return None
    
    def get_user(self, user_id):
        try:
            return Utilisateur.objects.get(pk=user_id)
        except Utilisateur.DoesNotExist:
            return None