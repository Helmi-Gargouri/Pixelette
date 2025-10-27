# Pixelette/authentication.py
from rest_framework import authentication, exceptions
from .token_adapter import get_utilisateur_from_token
from .models import Utilisateur

class UtilisateurTokenAuthentication(authentication.TokenAuthentication):
    """
    Authentification Token qui retourne un objet Utilisateur
    ✅ Ne bloque PAS les requêtes si pas de token (retourne None)
    """
    def authenticate(self, request):
        # Récupérer le header Authorization
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header:
            # ✅ Pas de token = pas d'erreur, juste None
            return None
        
        try:
            # Appeler la méthode parente
            result = super().authenticate(request)
            return result
        except exceptions.AuthenticationFailed:
            # ✅ Token invalide = None (pas d'erreur bloquante)
            return None
    
    def authenticate_credentials(self, key):
        # Récupérer l'Utilisateur depuis le token
        user = get_utilisateur_from_token(key)
        
        if user is None:
            raise exceptions.AuthenticationFailed('Token invalide')
        
        if not user.is_active:
            raise exceptions.AuthenticationFailed('Utilisateur inactif')
        
        return (user, key)

class UtilisateurSessionAuthentication(authentication.SessionAuthentication):
    """
    Authentification Session qui retourne un objet Utilisateur
    ✅ Ne bloque PAS les requêtes si pas de session (retourne None)
    """
    def authenticate(self, request):
        # Récupérer l'user_id depuis la session
        user_id = request.session.get('user_id')
        
        if not user_id:
            # ✅ Pas de session = pas d'erreur
            return None
        
        try:
            user = Utilisateur.objects.get(id=user_id)
            if not user.is_active:
                return None
            return (user, None)
        except Utilisateur.DoesNotExist:
            return None