from rest_framework.authtoken.models import Token as DRFToken
from Pixelette.models import Utilisateur
from django.contrib.auth.models import User as DjangoUser

def get_or_create_token(user):
    """
    Crée ou récupère un token DRF pour un utilisateur Utilisateur
    """
    print(f"🎫 get_or_create_token pour: {user.email}")
    
    # Essayer de trouver un User Django existant avec le même email
    try:
        django_user = DjangoUser.objects.get(username=user.email)
        print(f"✅ User Django trouvé: {django_user.username}")
    except DjangoUser.DoesNotExist:
        print(f"⚠️ User Django non trouvé, création...")
        # Créer un User Django fictif
        django_user = DjangoUser.objects.create_user(
            username=user.email,
            email=user.email,
            password='!',  # Password inutilisé
        )
        print(f"✅ User Django créé: {django_user.username}")
    
    # Créer ou récupérer le token DRF
    token, created = DRFToken.objects.get_or_create(user=django_user)
    
    if created:
        print(f"✅ Token créé: {token.key[:10]}...")
    else:
        print(f"✅ Token existant: {token.key[:10]}...")
    
    return token.key

def get_utilisateur_from_token(token_key):
    """
    Récupère l'Utilisateur depuis un token key
    """
    print(f"🔍 get_utilisateur_from_token: {token_key[:10]}...")
    
    try:
        token = DRFToken.objects.get(key=token_key)
        print(f"✅ Token DRF trouvé pour user Django: {token.user.username}")
        
        # Récupérer l'Utilisateur via l'email
        utilisateur = Utilisateur.objects.get(email=token.user.email)
        print(f"✅ Utilisateur trouvé: {utilisateur.email} (role: {utilisateur.role})")
        return utilisateur
        
    except DRFToken.DoesNotExist:
        print(f"❌ Token DRF non trouvé: {token_key[:10]}...")
        return None
    except Utilisateur.DoesNotExist:
        print(f"❌ Utilisateur non trouvé pour email: {token.user.email}")
        return None