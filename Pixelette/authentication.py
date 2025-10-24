# Pixelette/authentication.py
from rest_framework import authentication, exceptions
from .token_adapter import get_utilisateur_from_token
from .models import Utilisateur

class UtilisateurTokenAuthentication(authentication.TokenAuthentication):
    """
    Authentification Token qui retourne un objet Utilisateur
    """
    def authenticate(self, request):
        print("=" * 50)
        print("🔍 UtilisateurTokenAuthentication.authenticate appelé")
        
        # Récupérer le header Authorization
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        print(f"📋 Authorization header: {auth_header[:50]}...")
        
        if not auth_header:
            print("❌ Pas de header Authorization")
            return None
        
        # Appeler la méthode parente pour extraire le token
        result = super().authenticate(request)
        print(f"🔑 Résultat authenticate parent: {result}")
        return result
    
    def authenticate_credentials(self, key):
        print(f"🔐 authenticate_credentials appelé avec key: {key[:10]}...")
        
        # Récupérer l'Utilisateur depuis le token
        user = get_utilisateur_from_token(key)
        
        print(f"👤 Utilisateur trouvé: {user}")
        
        if user is None:
            print("❌ Utilisateur non trouvé pour ce token")
            raise exceptions.AuthenticationFailed('Token invalide')
        
        if not user.is_active:
            print("❌ Utilisateur inactif")
            raise exceptions.AuthenticationFailed('Utilisateur inactif')
        
        print(f"✅ Auth OK: {user.email} (role: {user.role})")
        print("=" * 50)
        return (user, key)

class UtilisateurSessionAuthentication(authentication.SessionAuthentication):
    """
    Authentification Session qui retourne un objet Utilisateur
    """
    def authenticate(self, request):
        print("🍪 UtilisateurSessionAuthentication.authenticate appelé")
        
        # Récupérer l'user_id depuis la session
        user_id = request.session.get('user_id')
        print(f"📋 Session user_id: {user_id}")
        
        if not user_id:
            print("❌ Pas de user_id dans la session")
            return None
        
        try:
            user = Utilisateur.objects.get(id=user_id)
            if not user.is_active:
                print("❌ Utilisateur inactif (session)")
                return None
            print(f"✅ Auth Session OK: {user.email} (role: {user.role})")
            return (user, None)
        except Utilisateur.DoesNotExist:
            print("❌ Utilisateur non trouvé (session)")
            return None