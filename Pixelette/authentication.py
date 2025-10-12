from rest_framework import authentication, exceptions
from .models import Utilisateur  # Import ton modèle custom

class CustomSessionTokenAuthentication(authentication.BaseAuthentication):
    """
    Auth custom : vérifie le header 'Token <key>' contre la session.
    Si match, retourne l'utilisateur depuis session['user_id'].
    """
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None  # Pas de credentials, essaie d'autres backends (ex. SessionAuthentication)

        # Parse header : "Token <key>"
        try:
            auth = auth_header.split()
            if auth[0].lower() != 'token':
                return None
            token_key = auth[1]
        except IndexError:
            raise exceptions.AuthenticationFailed('Header Token invalide')

        # Vérif contre session (comme dans ton login/profile)
        stored_token = request.session.get('token')
        if not stored_token or stored_token != token_key:
            raise exceptions.AuthenticationFailed('Token invalide ou expiré')

        user_id = request.session.get('user_id')
        if not user_id:
            raise exceptions.AuthenticationFailed('Session utilisateur manquante')

        # Récupère l'utilisateur (ton modèle custom)
        try:
            user = Utilisateur.objects.get(id=user_id)
            # Vérif que l'utilisateur est actif (comme ta property)
            if not user.is_active:
                raise exceptions.AuthenticationFailed('Utilisateur inactif')
        except Utilisateur.DoesNotExist:
            raise exceptions.AuthenticationFailed('Utilisateur non trouvé')

        return (user, token_key)  # Set request.user et request.auth

    def authenticate_header(self, request):
        return 'Token'  # Pour header WWW-Authenticate en 401