from rest_framework.decorators import action
from rest_framework.response import Response
from .utils.color_analysis import analyze_galerie_palette
from .utils.clustering import cluster_galeries
from .utils.spotify import generate_playlist_for_gallery, search_playlists_by_theme, get_spotify_oauth, create_playlist_in_user_account
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import viewsets
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique, GalerieInvitation, SavedStat
from .serializers import UtilisateurSerializer, OeuvreSerializer, GalerieSerializer, InteractionSerializer, StatistiqueSerializer, GalerieInvitationSerializer, SavedStatSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status 
from django.core.mail import send_mail
from rest_framework.decorators import action  
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny 
from django.contrib.auth.hashers import check_password  
from django.contrib.auth.tokens import default_token_generator  
from django.utils import timezone
from rest_framework.authtoken.models import Token
from django.contrib.auth import login  
from rest_framework.authtoken.models import Token
from django.core.cache import cache 
from rest_framework.decorators import action 
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth.hashers import make_password, check_password
from io import BytesIO
from rest_framework.decorators import api_view, permission_classes
from qrcode.constants import ERROR_CORRECT_L
from django.shortcuts import get_object_or_404
from .models import DemandeRole 
from .serializers import DemandeRoleSerializer  
from rest_framework.permissions import IsAuthenticated 
from rest_framework import permissions  
from .serializers import ResetPasswordSerializer
from django.conf import settings
from datetime import timedelta
import datetime
import secrets  
import hashlib
import base64
import pyotp
import base64
import qrcode
import random
import uuid
import requests
import io
from PIL import Image
from django.db.models import F


# AI helper: try OpenAI first, then fallback to Google Generative (Gemini) if configured.
def generate_ai_text(prompt, max_tokens=250, temperature=0.7, stop=None):
    """Return generated text from available AI provider or None on failure.

    Preference order:
    1. settings.OPENAI_API_KEY -> OpenAI Chat Completions (gpt-3.5-turbo style)
    2. settings.GEMINI_API_KEY_USER_1 or env GEMINI_API_KEY_USER_1 -> Google Generative API (text-bison)
    """
    try:
        openai_key = getattr(settings, 'OPENAI_API_KEY', None)
        if openai_key:
            headers = {'Authorization': f'Bearer {openai_key}', 'Content-Type': 'application/json'}
            data = {'model': 'gpt-3.5-turbo', 'messages': [{'role': 'user', 'content': prompt}], 'max_tokens': max_tokens, 'temperature': temperature}
            resp = requests.post('https://api.openai.com/v1/chat/completions', headers=headers, json=data, timeout=12)
            if resp.status_code == 200:
                jr = resp.json()
                return jr['choices'][0]['message']['content'].strip()

        # Fallback to Gemini/Google Generative API (text-bison-001)
        gemini_key = getattr(settings, 'GEMINI_API_KEY_USER_1', None) or __import__('os').environ.get('GEMINI_API_KEY_USER_1')
        if gemini_key:
            # Use text-bison model generate endpoint
            base_url = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate'
            payload = {
                'prompt': {'text': prompt},
                'temperature': temperature,
                'maxOutputTokens': int(max_tokens)
            }
            # Google supports simple API keys (AIza...) via ?key=YOUR_KEY; if the key looks like an API key use that
            if str(gemini_key).startswith('AIza'):
                url = f"{base_url}?key={gemini_key}"
                headers = {'Content-Type': 'application/json'}
            else:
                # For service-account / OAuth tokens, use Bearer
                url = base_url
                headers = {'Authorization': f'Bearer {gemini_key}', 'Content-Type': 'application/json'}
            resp = requests.post(url, headers=headers, json=payload, timeout=12)
            if resp.status_code == 200:
                jr = resp.json()
                # Google Generative responses usually carry candidates with 'content'
                cand = None
                if isinstance(jr.get('candidates'), list) and jr['candidates']:
                    cand = jr['candidates'][0].get('content')
                # Some versions use 'output' or 'candidates[].content'
                if not cand:
                    # Try nested 'output' -> 'content'
                    if isinstance(jr.get('output'), dict):
                        cand = jr['output'].get('content')
                if cand:
                    return str(cand).strip()

    except Exception:
        # Do not raise on AI failures; return None to allow fallbacks
        pass
    return None

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and hasattr(request.user, 'role') and request.user.role == 'admin'


class IsAdminOrSession(permissions.BasePermission):
    """Permission that accepts either a DRF-authenticated Utilisateur with role 'admin'
    or a session-based user_id pointing to an admin Utilisateur.
    This allows the frontend (which uses cookies/session) to be treated as admin
    even when request.user is not the custom Utilisateur instance.
    """
    def has_permission(self, request, view):
        # First, try the normal DRF request.user
        user = getattr(request, 'user', None)
        if user and hasattr(user, 'role') and user.role == 'admin':
            return True

        # Fallback: check session for our custom user_id
        uid = request.session.get('user_id')
        if not uid:
            return False
        try:
            u = Utilisateur.objects.get(id=uid)
            return getattr(u, 'role', None) == 'admin'
        except Utilisateur.DoesNotExist:
            return False
    
class CustomTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        
        return (
            str(user.pk) + str(timestamp) +
            str(user.email)  
        )

custom_token_generator = CustomTokenGenerator()

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [AllowAny]  

    def get_permissions(self):
        if self.action in ['create', 'login', 'profile', 'logout',  'generate_2fa', 'enable_2fa', 'verify_2fa', 'disable_2fa', 'get_2fa_qr', 'request_artist_role','reset_password_code','forgot_password','verify_code','request_password_reset', 'count']:
            permission_classes = [AllowAny]
        elif self.action == 'assign_role':
            permission_classes = [IsAuthenticated]  
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def count(self, request):
        """Compte le nombre total d'utilisateurs - accessible à tous"""
        total = Utilisateur.objects.count()
        return Response({'count': total})

    def perform_update(self, serializer):
        if self.request.user.id == serializer.instance.id:
            return super().perform_update(serializer)
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    def perform_destroy(self, instance):
        if self.request.user.id == instance.id:
            return super().perform_destroy(instance)
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def request_artist_role(self, request):
        # Vérif que c'est un user (pas déjà artiste/admin)
        if request.user.role != 'user':
            return Response({'error': 'Seuls les users peuvent demander ce rôle'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Récup admin email (hardcode pour dev, ou query Utilisateur.objects.filter(role='admin').first().email)
        admin_email = 'admin@pixelette.com'  # Remplace par ton superuser email
        
        subject = f'Demande de rôle Artiste pour {request.user.prenom} {request.user.nom}'
        message = f'L\'utilisateur {request.user.email} ({request.user.id}) demande à devenir Artiste. Vérifiez via /admin/ et assignez le rôle.'
        send_mail(
            subject,
            message,
            'no-reply@pixelette.com',
            [admin_email],
        )
        
        return Response({'message': 'Demande envoyée à l\'admin ! Vous serez notifié bientôt.'})

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def assign_role(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({'error': 'Seuls les admins peuvent assigner des rôles'}, status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role not in [choice[0] for choice in Utilisateur.ROLE_CHOICES]:
            return Response({'error': 'Rôle invalide (user, artiste, admin)'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_role = user.role
        user.role = new_role
        user.save()  # Déclenche le signal notif (étape 5)
        
        return Response({'message': f'Rôle changé de {old_role} à {new_role} pour {user.prenom} {user.nom}'})
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email et mot de passe requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = Utilisateur.objects.get(email=email)
            
            # Vérifier le mot de passe
            if not check_password(password, user.password):
                return Response({'error': 'Mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Si 2FA est activé, rediriger vers la page 2FA
            if user.is_two_factor_enabled:
                return Response({
                    'message': '2FA required',
                    'email': user.email,
                    'user_id': user.id
                }, status=status.HTTP_200_OK)
            
            # Si 2FA désactivé, connexion directe
            token = secrets.token_urlsafe(32)
            request.session['token'] = token
            request.session['user_id'] = user.id
            request.session.save()
            
            return Response({
                'message': 'Login réussi',
                'token': token,
                'user': UtilisateurSerializer(user, context={'request': request}).data
            })
            
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_401_UNAUTHORIZED)


    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_2fa(self, request):
        """
        Une seule route pour tout gérer :
        - Génère le QR si pas encore de secret
        - Vérifie le code et connecte
        """
        # DEBUG: Afficher ce qui arrive (SANS request.body)
        print("=" * 50)
        print("📌 verify_2fa appelé")
        print(f"Request data: {request.data}")
        print("=" * 50)
        
        email = request.data.get('email')
        token_code = request.data.get('token')
        
        print(f"Email extrait: {email}")
        print(f"Token extrait: {token_code}")
        
        if not email:
            print("❌ Email manquant!")
            return Response({'error': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = Utilisateur.objects.get(email=email)
            
            # Cas 1 : Pas de code fourni → Générer/retourner le QR code
            if not token_code:
                print("🔄 Génération du QR code...")
                # Si pas encore de secret, en créer un
                if not user.two_factor_secret:
                    temp_secret = pyotp.random_base32()
                    user.two_factor_temp_secret = temp_secret
                    user.save(update_fields=['two_factor_temp_secret'])
                    print(f"✅ Nouveau secret temporaire créé: {temp_secret[:10]}...")
                else:
                    temp_secret = user.two_factor_secret
                    print(f"✅ Utilisation du secret existant: {temp_secret[:10]}...")
                
                # Générer le QR code
                otp_auth_url = pyotp.totp.TOTP(temp_secret).provisioning_uri(
                    name=user.email,
                    issuer_name='Pixelette'
                )
                
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=ERROR_CORRECT_L,
                    box_size=10,
                    border=4
                )
                qr.add_data(otp_auth_url)
                qr.make(fit=True)
                
                img = qr.make_image(fill_color="black", back_color="white")
                buffer = BytesIO()
                img.save(buffer, format='PNG')
                qr_code_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                print("✅ QR code généré avec succès")
                return Response({
                    'qrCode': f"data:image/png;base64,{qr_code_data}",
                    'message': 'Scannez le QR code avec Google Authenticator'
                })
            
            # Cas 2 : Code fourni → Vérifier et connecter
            else:
                print("🔐 Vérification du code TOTP...")
                # Déterminer quel secret utiliser
                secret = user.two_factor_secret if user.two_factor_secret else user.two_factor_temp_secret
                
                print(f"Secret utilisé: {secret[:10] if secret else 'None'}...")
                print(f"Code reçu: {token_code}")
                
                if not secret:
                    print("❌ Aucun secret trouvé!")
                    return Response({'error': 'Générez d\'abord le QR code'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Vérifier le code TOTP
                totp = pyotp.TOTP(secret)
                is_valid = totp.verify(token_code, valid_window=1)
                
                print(f"Code valide ? {is_valid}")
                print(f"Code attendu actuellement: {totp.now()}")
                
                if not is_valid:
                    print("❌ Code invalide!")
                    return Response({'error': 'Code invalide. Vérifiez l\'heure de votre téléphone.'}, status=status.HTTP_400_BAD_REQUEST)
                
                print("✅ Code valide!")
                
                # Si c'était un secret temporaire, le rendre permanent
                if not user.two_factor_secret and user.two_factor_temp_secret:
                    print("🔄 Activation permanente du 2FA...")
                    user.two_factor_secret = user.two_factor_temp_secret
                    user.two_factor_temp_secret = None
                    user.save(update_fields=['two_factor_secret', 'two_factor_temp_secret'])
                
                # Connecter l'utilisateur
                token = secrets.token_urlsafe(32)
                request.session['token'] = token
                request.session['user_id'] = user.id
                request.session.save()
                
                print(f"✅ Utilisateur connecté avec token: {token[:20]}...")
                
                return Response({
                    'message': 'Authentification réussie !',
                    'token': token,
                    'user': UtilisateurSerializer(user, context={'request': request}).data
                })
            
        except Utilisateur.DoesNotExist:
            print("❌ Utilisateur non trouvé!")
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Erreur inattendue: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Erreur serveur: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def disable_2fa(self, request):
        """Désactive le 2FA depuis le profil"""
        user = request.user
        
        user.is_two_factor_enabled = False
        user.two_factor_secret = None
        user.two_factor_temp_secret = None
        user.save(update_fields=['is_two_factor_enabled', 'two_factor_secret', 'two_factor_temp_secret'])
        
        return Response({
            'message': '2FA désactivé ! Prochaine connexion sans 2FA.',
            'user': UtilisateurSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK)


    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def enable_2fa(self, request):
        """Réactive le 2FA depuis le profil"""
        user = request.user
        
        user.is_two_factor_enabled = True
        user.two_factor_secret = None  # Reset pour forcer nouveau QR
        user.two_factor_temp_secret = None
        user.save(update_fields=['is_two_factor_enabled', 'two_factor_secret', 'two_factor_temp_secret'])
        
        return Response({
            'message': '2FA activé ! Reconnectez-vous pour scanner le QR code.',
            'user': UtilisateurSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        session_token = request.session.get('token')
        auth_header = request.headers.get('Authorization', '')
        header_token = auth_header.split(' ')[1] if auth_header.startswith('Token ') else None
        if header_token != session_token:
            return Response({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(UtilisateurSerializer(request.user).data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Token '):
            header_token = auth_header.split(' ')[1]
            if header_token != request.session.get('token'):
                return Response({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
            cache.delete(f"token_{header_token}")
        
        request.session.flush()
        return Response({'message': 'Déconnecté avec succès'})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response({'message': 'Si l\'email existe, un code a été envoyé.'}, status=200)  

    
        reset_code = str(random.randint(10000, 99999))
        expires = timezone.now() + timezone.timedelta(minutes=10)
        user.reset_code = reset_code
        user.reset_code_expires = expires
        user.save(update_fields=['reset_code', 'reset_code_expires'])


        subject = 'Code de Réinitialisation Pixelette'
        message = f"Votre code de réinitialisation : {reset_code}\nIl expire dans 10 minutes."
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])

        return Response({'message': 'Code envoyé par email !'})

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_code(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        reset_code = serializer.validated_data['reset_code']
        try:
            user = Utilisateur.objects.get(email=email)
            if not user.reset_code or user.reset_code != reset_code or user.reset_code_expires < timezone.now():
                return Response({'error': 'Code invalide ou expiré.'}, status=400)
            return Response({'message': 'Code vérifié !'})
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Email non trouvé.'}, status=400)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password_code(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        new_password = serializer.validated_data['new_password']
        reset_code = request.data.get('reset_code')  
        try:
            user = Utilisateur.objects.get(email=email)
            if not user.reset_code or user.reset_code != reset_code or user.reset_code_expires < timezone.now():
                return Response({'error': 'Code invalide ou expiré.'}, status=400)

            user.password = make_password(new_password)
            user.reset_code = None
            user.reset_code_expires = None
            user.save(update_fields=['password', 'reset_code', 'reset_code_expires'])
            return Response({'message': 'Mot de passe réinitialisé !'})
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Email non trouvé.'}, status=400)
         
class OeuvreViewSet(viewsets.ModelViewSet):
    queryset = Oeuvre.objects.all()
    serializer_class = OeuvreSerializer
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        oeuvre = self.get_object()
        # increment views atomically
        try:
            Oeuvre.objects.filter(pk=oeuvre.pk).update(vues=F('vues') + 1)
            oeuvre.refresh_from_db(fields=['vues'])
        except Exception:
            pass
        serializer = self.get_serializer(oeuvre)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def predict_popularity(self, request, pk=None):
        """Predict a popularity score (estimated views) and provide tips.

        Uses a lightweight heuristic based on existing oeuvre averages, presence
        of image, description length, and optionally calls OpenAI to produce
        refined tips when OPENAI_API_KEY is set in settings.
        """
        try:
            oeuvre = self.get_object()
        except Exception:
            return Response({'error': 'Oeuvre not found'}, status=404)

        from django.db.models import Avg
        from django.db.models.functions import Coalesce

        try:
            avg_views = Oeuvre.objects.aggregate(avg=Coalesce(Avg('vues'), 0))['avg'] or 0
        except Exception:
            avg_views = 0

        # Base score
        base = max(int(avg_views), 1)

        # Features
        desc = (oeuvre.description or '')
        image_present = bool(getattr(oeuvre, 'image', None))
        desc_len = len(desc)

        # Heuristic multiplier
        mult = 1.0
        if image_present:
            mult += 0.25
        # longer descriptions -> slightly better discoverability
        mult += min(0.5, desc_len / 2000)
        # title length matters a bit
        title_len = len((oeuvre.titre or ''))
        mult += min(0.2, title_len / 200)

        predicted = int(base * mult)

        # Confidence roughly based on amount of information
        confidence = min(95, 40 + (desc_len / 1000) * 40 + (20 if image_present else 0))

        # Compose basic tips
        tips = []
        if not image_present:
            tips.append('Ajoutez une image haute résolution de l\'œuvre — la qualité visuelle augmente fortement l\'engagement.')
        if desc_len < 120:
            tips.append('Rédigez une description plus détaillée (contexte, inspiration, matériaux) pour améliorer le référencement et l\'attractivité.')
        if title_len < 5:
            tips.append('Choisissez un titre plus descriptif et évocateur.')
        # Promote tips
        tips.append('Partagez l\'œuvre sur les réseaux sociaux et dans des galeries thématiques pour attirer un public ciblé.')
        tips.append('Envisagez d\'utiliser des mots-clés pertinents et des balises pour améliorer la découverte.')

        # Optionally ask an AI provider (OpenAI or Gemini) to refine tips and provide a short narrative
        ai_advice = None
        try:
            prompt = (
                f"You are an art marketing assistant. Given the following artwork data, estimate a reasonable monthly view count and give 4 concise suggestions to improve visibility:\n"
                f"Title: {oeuvre.titre}\n"
                f"Description: {desc}\n"
                f"Image present: {image_present}\n"
                f"Typical platform average views: {avg_views}\n"
            )
            ai_text = generate_ai_text(prompt, max_tokens=250, temperature=0.7)
            if ai_text:
                ai_advice = ai_text
                tips.insert(0, ai_text)
        except Exception:
            ai_advice = None

        result = {
            'predicted_views': predicted,
            'confidence': int(confidence),
            'tips': tips,
            'ai_advice': ai_advice
        }

        return Response(result)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def generate_ai_image(self, request):
        """Générer une image via IA en utilisant Hugging Face API"""
        prompt = request.data.get('prompt')
        style = request.data.get('style', '')
        
        if not prompt:
            return Response({'error': 'Le prompt est requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Combiner le prompt avec le style
        full_prompt = f"{prompt}, {style}" if style else prompt
        
        # Configuration de l'API Hugging Face
        # Note: Vous devez obtenir un token gratuit sur https://huggingface.co/settings/tokens
        api_token = getattr(settings, 'HUGGINGFACE_API_TOKEN', None)
        
        if not api_token:
            # Utiliser une API gratuite alternative sans token (Pollinations.ai)
            try:
                # Pollinations.ai est une API gratuite sans clé requise
                pollinations_url = f"https://image.pollinations.ai/prompt/{requests.utils.quote(full_prompt)}"
                
                response = requests.get(pollinations_url, timeout=60)
                
                if response.status_code == 200:
                    # Sauvegarder l'image temporairement
                    image = Image.open(io.BytesIO(response.content))
                    
                    # Convertir en base64 pour l'envoyer au frontend
                    buffer = io.BytesIO()
                    image.save(buffer, format='PNG')
                    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    
                    return Response({
                        'image': f"data:image/png;base64,{image_base64}",
                        'prompt': full_prompt,
                        'message': 'Image générée avec succès'
                    })
                else:
                    return Response(
                        {'error': 'Erreur lors de la génération de l\'image'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except Exception as e:
                return Response(
                    {'error': f'Erreur: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Si un token Hugging Face est disponible, utiliser Stable Diffusion
        try:
            API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1"
            headers = {"Authorization": f"Bearer {api_token}"}
            
            payload = {
                "inputs": full_prompt,
                "parameters": {
                    "negative_prompt": "blurry, bad quality, distorted",
                    "num_inference_steps": 50
                }
            }
            
            response = requests.post(API_URL, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                image = Image.open(io.BytesIO(response.content))
                
                # Convertir en base64
                buffer = io.BytesIO()
                image.save(buffer, format='PNG')
                image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                return Response({
                    'image': f"data:image/png;base64,{image_base64}",
                    'prompt': full_prompt,
                    'message': 'Image générée avec succès'
                })
            else:
                error_msg = response.json().get('error', 'Erreur inconnue')
                return Response(
                    {'error': f'Erreur API: {error_msg}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GalerieViewSet(viewsets.ModelViewSet):
    queryset = Galerie.objects.all()
    serializer_class = GalerieSerializer
    permission_classes = [AllowAny]
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def palette(self, request, pk=None):
        """
        Analyse la palette de couleurs d'une galerie et suggère des harmonies.
        Réservé au propriétaire ou admin.
        """
        try:
            galerie = self.get_object()
            
            # Vérifie que l'utilisateur est le propriétaire ou admin
            if request.user != galerie.proprietaire and request.user.role != 'admin':
                return Response(
                    {'error': 'Vous devez être le propriétaire pour analyser cette galerie'},
                    status=403
                )
            
            result = analyze_galerie_palette(pk)
            return Response(result)
        except Galerie.DoesNotExist:
            return Response({'error': 'Galerie non trouvée'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticatedOrReadOnly])
    def clusters(self, request):
        num_clusters = int(request.query_params.get('num_clusters', 5))
        my_galleries = request.query_params.get('my', 'false').lower() == 'true'
        user = request.user if my_galleries and request.user.is_authenticated else None
        only_public = not my_galleries

        if my_galleries and not request.user.is_authenticated:
            return Response({'error': 'Authentication required for personal clusters'}, status=status.HTTP_401_UNAUTHORIZED)

        clusters = cluster_galeries(num_clusters=num_clusters, only_public=only_public, user=user)

        serialized_clusters = {}
        for label, galeries_ids in clusters.items():
            galeries_qs = Galerie.objects.filter(id__in=galeries_ids)
            serialized_clusters[label] = GalerieSerializer(galeries_qs, many=True).data

        return Response(serialized_clusters)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def generate_spotify_playlist(self, request, pk=None):
        """
        Génère une playlist Spotify basée sur le thème de la galerie.
        """
        try:
            galerie = self.get_object()
            
            # Génère la playlist
            result = generate_playlist_for_gallery(
                galerie_nom=galerie.nom,
                galerie_theme=galerie.theme or 'Art',
                galerie_description=galerie.description or ''
            )
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': result.get('message', 'Erreur lors de la génération de la playlist')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Galerie.DoesNotExist:
            return Response({'error': 'Galerie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {'error': f'Erreur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def search_spotify_playlists(self, request, pk=None):
        """
        Recherche des playlists Spotify existantes basées sur le thème de la galerie.
        """
        try:
            galerie = self.get_object()
            theme = galerie.theme or galerie.nom
            
            result = search_playlists_by_theme(theme, limit=10)
            
            if result['success']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': result.get('message', 'Erreur lors de la recherche')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Galerie.DoesNotExist:
            return Response({'error': 'Galerie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response(
                {'error': f'Erreur: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        galerie = self.get_object()

        # increment views atomically to avoid race conditions
        try:
            Galerie.objects.filter(pk=galerie.pk).update(vues=F('vues') + 1)
            # refresh instance so serializer returns updated value
            galerie.refresh_from_db(fields=['vues'])
        except Exception:
            # If incrementing fails, continue without blocking access
            pass

        # Si la galerie est publique, tout le monde peut y accéder
        if not galerie.privee:
            serializer = self.get_serializer(galerie)
            return Response(serializer.data)
        
        # Si la galerie est privée
        # Vérifier si l'utilisateur est connecté via la session
        user_id = request.session.get('user_id')
        if not user_id:
            return Response(
                {'error': 'Vous devez être connecté pour accéder à cette galerie privée'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            current_user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Le propriétaire a toujours accès
        if galerie.proprietaire == current_user:
            serializer = self.get_serializer(galerie)
            return Response(serializer.data)
        
        # Vérifier si l'utilisateur a une invitation acceptée
        has_valid_invitation = GalerieInvitation.objects.filter(
            galerie=galerie,
            utilisateur=current_user,
            acceptee=True
        ).exists()
        
        if has_valid_invitation:
            serializer = self.get_serializer(galerie)
            return Response(serializer.data)
        
        # Sinon, accès refusé
        return Response(
            {'error': 'Vous n\'avez pas accès à cette galerie privée'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def invite(self, request, pk=None):
        """Envoyer une invitation pour accéder à une galerie privée"""
        galerie = self.get_object()
        
        # Vérifier si l'utilisateur est connecté via la session
        user_id = request.session.get('user_id')
        if not user_id:
            return Response(
                {'error': 'Vous devez être connecté pour inviter des utilisateurs'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            current_user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Vérifier que l'utilisateur est le propriétaire
        if galerie.proprietaire != current_user:
            return Response(
                {'error': 'Vous devez être le propriétaire de la galerie pour inviter des utilisateurs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que la galerie est privée
        if not galerie.privee:
            return Response(
                {'error': 'Cette galerie est publique, les invitations ne sont pas nécessaires'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer l'utilisateur à inviter
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'L\'ID de l\'utilisateur est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            invited_user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Ne pas inviter le propriétaire lui-même
        if invited_user == request.user:
            return Response(
                {'error': 'Vous ne pouvez pas vous inviter vous-même'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer ou récupérer l'invitation
        invitation, created = GalerieInvitation.objects.get_or_create(
            galerie=galerie,
            utilisateur=invited_user,
            defaults={'date_expiration': timezone.now() + timedelta(days=30)}
        )
        
        if not created:
            # Si l'invitation existe déjà et est expirée, la réinitialiser
            if not invitation.is_valid():
                invitation.acceptee = False
                invitation.date_acceptation = None
                invitation.date_expiration = timezone.now() + timedelta(days=30)
                invitation.token = uuid.uuid4()
                invitation.save()
        
        # Construire l'URL d'accès
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        invitation_url = f"{frontend_url}/galeries/{galerie.id}/accept-invite/{invitation.token}"
        
        # Envoyer l'email
        subject = f"Invitation à voir la galerie '{galerie.nom}'"
        message = f"""Bonjour {invited_user.prenom},

{current_user.prenom} {current_user.nom} vous invite à découvrir sa galerie privée "{galerie.nom}".

{f'Description: {galerie.description}' if galerie.description else ''}
{f'Thème: {galerie.theme}' if galerie.theme else ''}

Pour accéder à cette galerie, cliquez sur le lien ci-dessous :
{invitation_url}

Cette invitation est valide pendant 30 jours.

Cordialement,
L'équipe Pixelette
        """
        
        try:
            send_mail(
                subject,
                message,
                'no-reply@pixelette.com',
                [invited_user.email],
                fail_silently=False,
            )
            
            return Response({
                'message': f'Invitation envoyée à {invited_user.email}',
                'invitation_id': invitation.id
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'envoi de l\'email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='accept-invite/(?P<token>[^/.]+)', permission_classes=[AllowAny])
    def accept_invite(self, request, pk=None, token=None):
        """Accepter une invitation et obtenir l'accès à la galerie"""
        galerie = self.get_object()
        
        # Vérifier si l'utilisateur est connecté via la session
        user_id = request.session.get('user_id')
        if not user_id:
            return Response(
                {'error': 'Vous devez être connecté pour accepter une invitation'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            current_user = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Utilisateur non trouvé'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            invitation = GalerieInvitation.objects.get(
                galerie=galerie,
                token=token
            )
        except GalerieInvitation.DoesNotExist:
            return Response(
                {'error': 'Invitation non trouvée ou invalide'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier que l'invitation est pour l'utilisateur connecté
        if invitation.utilisateur != current_user:
            return Response(
                {'error': 'Cette invitation n\'est pas pour vous'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Vérifier que l'invitation est valide
        if not invitation.is_valid():
            if invitation.acceptee:
                error_msg = 'Cette invitation a déjà été acceptée'
            else:
                error_msg = 'Cette invitation a expiré'
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
        # Marquer l'invitation comme acceptée
        invitation.acceptee = True
        invitation.date_acceptation = timezone.now()
        invitation.save()
        
        # Retourner les données de la galerie
        serializer = GalerieSerializer(galerie)
        return Response({
            'message': 'Invitation acceptée avec succès',
            'galerie': serializer.data
        }, status=status.HTTP_200_OK)

class InteractionViewSet(viewsets.ModelViewSet):
    queryset = Interaction.objects.all()
    serializer_class = InteractionSerializer

class StatistiqueViewSet(viewsets.ModelViewSet):
    queryset = Statistique.objects.all()
    serializer_class = StatistiqueSerializer


@method_decorator(csrf_exempt, name='dispatch')
class SavedStatViewSet(viewsets.ModelViewSet):
    queryset = SavedStat.objects.all()
    serializer_class = SavedStatSerializer

    def get_permissions(self):
        # Only admins can create/update/delete. Accept either a DRF-authenticated
        # admin or a session-authenticated admin (IsAdminOrSession) so the browser
        # session works for write operations too.
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrSession()]
        return [IsAdminOrSession()]

    @action(detail=True, methods=['get'], permission_classes=[IsAdminOrSession])
    def compute(self, request, pk=None):
        """Compute the aggregated data for this saved stat and return labels/values for the frontend chart."""
        try:
            stat = self.get_object()
        except Exception as e:
            return Response({'error': 'SavedStat not found or other error', 'detail': str(e)}, status=404)

        # Map subject to model
        mapping = {
            'utilisateur': Utilisateur,
            'oeuvre': Oeuvre,
            'galerie': Galerie,
        }

        Model = mapping.get(stat.subject)
        if not Model:
            return Response({'error': 'Subject model not supported'}, status=400)

        field = stat.subject_field

        # Basic safety: allow field names and related lookups using double underscores
        import re
        if not re.match(r'^[\w]+(?:__[\w]+)*$', field):
            return Response({'error': 'Invalid subject_field'}, status=400)

        # Build queryset and aggregation
        qs = Model.objects.all()

        # Apply filters from config if present (simple equality filters only)
        cfg = stat.config or {}
        filters = {}
        for k, v in (cfg.get('filters') or {}).items():
            # allow only simple keys
            if re.match(r'^[\w]+$', k):
                filters[k] = v
        if filters:
            qs = qs.filter(**filters)

        # Group by field and count
        try:
            from django.db.models import Count

            # helper to resolve nested attributes on a model instance
            def resolve_attr(obj, attr_path):
                parts = attr_path.split('__') if attr_path else []
                cur = obj
                for p in parts:
                    if cur is None:
                        return None
                    # if cur is a dict-like (from values())
                    if isinstance(cur, dict):
                        cur = cur.get(p)
                        continue
                    # otherwise getattr
                    cur = getattr(cur, p, None)
                return cur

            # allow callers to request a label_field in config to use for labels
            label_field = (stat.config or {}).get('label_field')

            # Special syntax: allow fields ending with '__count' to mean
            # "count related items per model instance", e.g. 'oeuvres__count'
            if field.endswith('__count'):
                rel = field[:-7]
                try:
                    # Annotate model instances with the related count
                    aggregation_qs = qs.annotate(_count=Count(rel)).order_by('-_count')
                except Exception as e:
                    return Response({'error': 'Invalid relation for __count', 'detail': str(e)}, status=400)

                labels = []
                values = []
                for obj in aggregation_qs:
                    if label_field:
                        val = resolve_attr(obj, label_field)
                        if val is None:
                            val = str(obj)
                    else:
                        val = str(obj)
                    labels.append(str(val))
                    values.append(int(getattr(obj, '_count', 0) or 0))
                return Response({'labels': labels, 'values': values})

            # Otherwise support related lookups like 'auteur__role' as well
            aggregation = qs.values(field).annotate(count=Count('id')).order_by('-count')

            # Calendar output: if the config requests a calendar and the grouping
            # field is a date (e.g. 'date_inscription__date'), return a contiguous
            # list of date/value points so the frontend can render a calendar heatmap.
            cfg_calendar = (stat.config or {}).get('calendar')
            if cfg_calendar and field.endswith('__date'):
                # Allow optional start/end query params (YYYY-MM-DD) to request a specific range
                start_str = request.query_params.get('start')
                end_str = request.query_params.get('end')
                start_date = None
                end_date = None
                try:
                    if start_str:
                        start_date = datetime.date.fromisoformat(start_str)
                    if end_str:
                        end_date = datetime.date.fromisoformat(end_str)
                except Exception:
                    return Response({'error': 'Invalid start/end date format. Use YYYY-MM-DD.'}, status=400)

                # If range provided, filter the queryset to that date range. We remove the trailing '__date' from
                # the grouping field to build the proper lookup for filtering.
                if start_date or end_date:
                    base_lookup = field[:-6]  # remove '__date'
                    # build the range tuple
                    if not start_date:
                        # pick a very early date
                        start_date = datetime.date(1970, 1, 1)
                    if not end_date:
                        end_date = datetime.date.today()
                    try:
                        qs = qs.filter(**{f"{base_lookup}__date__range": (start_date, end_date)})
                    except Exception as e:
                        return Response({'error': 'Failed to apply date range filter', 'detail': str(e)}, status=400)

                # re-run the aggregation with the possibly filtered queryset
                aggregation = qs.values(field).annotate(count=Count('id')).order_by('-count')

                counts = {}
                for row in aggregation:
                    k = row.get(field)
                    if isinstance(k, (datetime.date, datetime.datetime)):
                        date_str = k.strftime('%Y-%m-%d')
                    else:
                        date_str = str(k)
                    counts[date_str] = int(row.get('count', 0))

                # If a requested range was provided, use it to generate the contiguous points.
                if start_date and end_date:
                    min_date = start_date
                    max_date = end_date
                else:
                    if not counts:
                        return Response({'points': []})
                    min_date = min(datetime.datetime.fromisoformat(d).date() for d in counts.keys())
                    max_date = max(datetime.datetime.fromisoformat(d).date() for d in counts.keys())

                cur = min_date
                points = []
                while cur <= max_date:
                    ds = cur.strftime('%Y-%m-%d')
                    points.append({'date': ds, 'value': counts.get(ds, 0)})
                    cur += datetime.timedelta(days=1)

                return Response({'points': points})

            labels = []
            values = []
            for row in aggregation:
                # if label_field requested, try to resolve on the row dict or underlying objects
                if label_field:
                    # row is a dict from values()
                    val = row.get(label_field)
                    if val is None:
                        val = row.get(field)
                else:
                    val = row.get(field)
                label = val if val is not None else 'None'
                labels.append(str(label))
                values.append(int(row.get('count', 0)))

            return Response({'labels': labels, 'values': values})
        except Exception as e:
            # Return JSON error for frontend to display instead of a server 500
            return Response({'error': 'Aggregation failed', 'detail': str(e)}, status=400)

    def perform_create(self, serializer):
        # Automatically set the creator to the current user (admin)
        try:
            serializer.save(created_by=self.request.user)
        except Exception:
            # Fallback: save without created_by if something goes wrong
            serializer.save()

    def create(self, request, *args, **kwargs):
        # Support session-based creation: if DRF didn't authenticate (no header),
        # look for our custom session user_id and treat that user as the creator.
        user = None
        if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False):
            user = request.user
        else:
            uid = request.session.get('user_id')
            if uid:
                try:
                    user = Utilisateur.objects.get(id=uid)
                except Utilisateur.DoesNotExist:
                    user = None

        if not user or getattr(user, 'role', None) != 'admin':
            return Response({
                'detail': 'You must be logged in as an admin to create a saved stat.\n'
                          'Ensure you are authenticated via session (cookies) or provide a Token in the Authorization header.'
            }, status=401)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

class DemandeRoleViewSet(viewsets.ModelViewSet):
    queryset = DemandeRole.objects.all()
    serializer_class = DemandeRoleSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create': 
            return [IsAuthenticated()]  
        return [IsAdmin()]  

    def get_queryset(self):
        return DemandeRole.objects.filter(statut='pending') if self.request.user.role == 'admin' else DemandeRole.objects.none()

    def create(self, request):
        if request.user.role != 'user':
            return Response({'error': "Seuls les users peuvent demander"}, status=400)
        if DemandeRole.objects.filter(utilisateur=request.user, statut='pending').exists():
            return Response({'error': "Demande en cours"}, status=400)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(utilisateur=request.user, nouveau_role='artiste')  
        return Response({'message': 'Demande créée et envoyée à l\'admin !'})

    @action(detail=True, methods=['patch'])
    def approuver(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != 'pending':
            return Response({'error': 'Demande déjà traitée'}, status=400)
        demande.statut = 'approved'
        demande.save() 
        # ← FIX : Calcule le nom manuellement (sans serializer)
        nom_utilisateur = f"{demande.utilisateur.prenom} {demande.utilisateur.nom}"
        return Response({'message': f'Demande approuvée pour {nom_utilisateur} !'})

    @action(detail=True, methods=['patch'])
    def rejeter(self, request, pk=None):
        demande = self.get_object()
        if demande.statut != 'pending':
            return Response({'error': 'Demande déjà traitée'}, status=400)
        demande.statut = 'rejected'
        demande.save()
        # ← FIX : Même chose pour rejeter
        nom_utilisateur = f"{demande.utilisateur.prenom} {demande.utilisateur.nom}"
        return Response({'message': f'Demande rejetée pour {nom_utilisateur}.'})


# ===== VUES SPOTIFY OAUTH =====

from django.http import JsonResponse, HttpResponseRedirect, FileResponse
from django.views.decorators.csrf import csrf_exempt

@api_view(['POST'])
@permission_classes([AllowAny])
def spotify_create_playlist(request):
    """
    Crée une playlist dans le compte Spotify de l'utilisateur.
    Nécessite access_token, galerie_id, et track_uris.
    """
    try:
        access_token = request.data.get('access_token')
        galerie_id = request.data.get('galerie_id')
        track_uris = request.data.get('track_uris', [])
        
        if not access_token:
            return Response({'error': 'Access token manquant'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupère la galerie
        galerie = Galerie.objects.get(id=galerie_id)
        
        # Récupère l'user ID Spotify depuis le token
        import spotipy
        sp = spotipy.Spotify(auth=access_token)
        spotify_user = sp.current_user()
        
        # Crée la playlist
        result = create_playlist_in_user_account(
            access_token=access_token,
            user_id=spotify_user['id'],
            playlist_name=f"🎨 {galerie.nom}",
            track_uris=track_uris,
            description=f"Playlist générée pour la galerie '{galerie.nom}' - {galerie.theme or 'Art'}"
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response({'error': result['error']}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Galerie.DoesNotExist:
        return Response({'error': 'Galerie non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"❌ Erreur création playlist: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def spotify_auth_url(request):
    """
    Retourne l'URL d'autorisation Spotify OAuth.
    """
    try:
        galerie_id = request.GET.get('galerie_id')
        
        # Stocke l'ID dans la session ET dans le state OAuth
        request.session['spotify_galerie_id'] = galerie_id
        request.session.save()  # Force la sauvegarde de la session
        
        sp_oauth = get_spotify_oauth()
        # Utilise le paramètre state pour passer l'ID de la galerie
        auth_url = sp_oauth.get_authorize_url(state=galerie_id)
        
        return Response({'auth_url': auth_url}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def spotify_callback(request):
    """
    Callback après l'autorisation Spotify OAuth.
    """
    try:
        code = request.GET.get('code')
        state = request.GET.get('state')  # Récupère l'ID de la galerie depuis le state
        
        if not code:
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/galeries?error=spotify_auth_failed")
        
        sp_oauth = get_spotify_oauth()
        token_info = sp_oauth.get_access_token(code)
        
        if not token_info:
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/galeries?error=spotify_token_failed")
        
        # Récupère l'ID de la galerie depuis le state OAuth (prioritaire) ou la session
        galerie_id = state or request.session.get('spotify_galerie_id')
        
        if not galerie_id:
            return HttpResponseRedirect(f"{settings.FRONTEND_URL}/galeries?error=galerie_id_missing")
        
        # Redirige vers le frontend avec le token
        redirect_url = f"{settings.FRONTEND_URL}/galeries/{galerie_id}?spotify_token={token_info['access_token']}"
        
        print(f"✅ Redirection vers: {redirect_url}")
        
        return HttpResponseRedirect(redirect_url)
        
    except Exception as e:
        print(f"❌ Erreur callback Spotify: {str(e)}")
        import traceback
        traceback.print_exc()
        return HttpResponseRedirect(f"{settings.FRONTEND_URL}/galeries?error=spotify_callback_failed")


@api_view(['GET'])
@permission_classes([AllowAny])
def whoami(request):
    """Debug endpoint: returns DRF-authenticated user and session-derived user info.

    Use this from the browser or from the React app (with axios { withCredentials: true })
    to confirm that cookies/session are being sent and that the session maps to a
    `Utilisateur` with a role (e.g., 'admin').
    """
    drf_user = None
    if getattr(request, 'user', None) and getattr(request.user, 'is_authenticated', False):
        drf_user = {
            'id': getattr(request.user, 'id', None),
            'email': getattr(request.user, 'email', None),
            'role': getattr(request.user, 'role', None)
        }

    session_user = None
    session_uid = request.session.get('user_id')
    if session_uid:
        try:
            u = Utilisateur.objects.get(id=session_uid)
            session_user = {'id': u.id, 'email': u.email, 'role': u.role}
        except Utilisateur.DoesNotExist:
            session_user = {'id': session_uid, 'missing': True}

    return JsonResponse({
        'drf_user': drf_user,
        'session_user': session_user,
        'session_keys': list(request.session.keys()),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def users_by_date(request):
    """Return a simple list of users who registered on a given date (YYYY-MM-DD).
    Query param: date=YYYY-MM-DD
    """
    date_str = request.GET.get('date')
    if not date_str:
        return Response({'error': 'date param required (YYYY-MM-DD)'}, status=400)
    try:
        d = datetime.date.fromisoformat(date_str)
    except Exception:
        return Response({'error': 'invalid date format, use YYYY-MM-DD'}, status=400)

    # filter by date_inscription date portion
    users = Utilisateur.objects.filter(date_inscription__date=d)
    data = [{'id': u.id, 'nom': u.nom, 'prenom': u.prenom, 'email': u.email} for u in users]
    return Response({'date': date_str, 'count': users.count(), 'users': data})


@api_view(['POST'])
@permission_classes([IsAdminOrSession])
def generate_summary_pdf(request):
    """Generate a PDF summary of dashboard data and save it under MEDIA_ROOT/reports/.

    Returns JSON: { report_url: <url> }
    """
    import io, os, datetime
    from django.conf import settings
    from django.urls import reverse

    # Gather summary data
    galeries = list(Galerie.objects.all())
    oeuvres = list(Oeuvre.objects.all())

    galeries_pub = sum(1 for g in galeries if not g.privee)
    galeries_pri = sum(1 for g in galeries if g.privee)
    total_oeuvres = len(oeuvres)

    # Top galleries by vues
    top_galeries = Galerie.objects.order_by('-vues')[:10]
    top_oeuvres = Oeuvre.objects.order_by('-vues')[:10]

    # Views per artist (reuse logic)
    from django.db.models import Sum, F
    from django.db.models.functions import Coalesce
    artists_qs = Utilisateur.objects.annotate(
        total_oeuvre_views=Coalesce(Sum('oeuvres__vues'), 0),
        total_galerie_views=Coalesce(Sum('galeries__vues'), 0),
    ).annotate(total_views=F('total_oeuvre_views') + F('total_galerie_views')).order_by('-total_views')[:20]

    # Prepare textual summary
    summary_lines = []
    summary_lines.append(f"Rapport résumé — {datetime.datetime.utcnow().isoformat()}Z")
    summary_lines.append("")
    summary_lines.append(f"Galeries publiques: {galeries_pub}")
    summary_lines.append(f"Galeries privées: {galeries_pri}")
    summary_lines.append(f"Total œuvres: {total_oeuvres}")
    summary_lines.append("")
    summary_lines.append("Top Galeries (vues):")
    for g in top_galeries:
        summary_lines.append(f" - {g.nom} : {g.vues}")
    summary_lines.append("")
    summary_lines.append("Top Œuvres (vues):")
    for o in top_oeuvres:
        summary_lines.append(f" - {o.titre} : {o.vues}")
    summary_lines.append("")
    summary_lines.append("Top Artistes (vues totales):")
    for a in artists_qs:
        summary_lines.append(f" - {a.prenom} {a.nom} : {a.total_views}")

    # Ensure reports dir
    reports_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
    os.makedirs(reports_dir, exist_ok=True)

    # Filename
    filename_ts = datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    pdf_filename = f"dashboard_summary_{filename_ts}.pdf"
    pdf_path = os.path.join(reports_dir, pdf_filename)

    # Try to use reportlab to render a nicer PDF (with simple charts). If reportlab
    # is not installed or an error occurs, fallback to a plain text file.
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.lib.utils import ImageReader
        # Force a non-interactive backend to avoid Tkinter / GUI issues when
        # generating charts from a web thread/process (prevents the
        # "Starting a Matplotlib GUI outside of the main thread" warnings).
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
        except Exception:
            # If matplotlib can't be configured, fallback and continue; the
            # PDF generator will simply omit charts (text-only fallback remains).
            plt = None

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # tiny helper to wrap text
        def draw_wrapped_text(x, y, text, font_name='Helvetica', font_size=10, leading=14, max_width=width - 80):
            c.setFont(font_name, font_size)
            words = text.split()
            line = ''
            cur_y = y
            for w in words:
                test = (line + ' ' + w).strip()
                if c.stringWidth(test, font_name, font_size) > max_width:
                    c.drawString(x, cur_y, line)
                    cur_y -= leading
                    line = w
                else:
                    line = test
            if line:
                c.drawString(x, cur_y, line)
                cur_y -= leading
            return cur_y

        # sanitize text helper: normalize whitespace, fix stray punctuation and ensure short sentences
        def sanitize_text(t):
            if not t:
                return ''
            s = str(t)
            # Replace newlines and multiple spaces with single space
            s = ' '.join(s.replace('\r', ' ').replace('\n', ' ').split())
            # Normalize bullets and separators
            s = s.replace('•', ' • ')
            s = ' '.join(s.split())
            # Fix common typos like 'Vuezdada' or 'Vuez' by ensuring 'Vues:' token is present when a number exists
            # If pattern like 'Vues' followed by non-digit, remove the garbage
            s = s.replace('Vuezdada', '')
            # Ensure sentence ends with a period for nicer wrapping (only if short)
            if len(s) < 300 and not s.endswith('.') and not s.endswith('…'):
                s = s.rstrip() + '.'
            return s

        # Chart helpers using matplotlib -> return ImageReader
        def make_pie(pub_count, pri_count):
            try:
                fig, ax = plt.subplots(figsize=(3, 3), dpi=100)
                sizes = [pub_count, pri_count]
                labels = ['Publiques', 'Privées']
                colors_list = ['#4CAF50', '#FF7043']
                ax.pie(sizes, labels=labels, colors=colors_list, autopct='%1.0f%%', startangle=140, textprops={'fontsize': 9})
                ax.axis('equal')
                buf = io.BytesIO()
                plt.tight_layout()
                fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
                plt.close(fig)
                buf.seek(0)
                return ImageReader(buf)
            except Exception:
                return None

        def make_bar(names, values, title='', max_items=8):
            try:
                names = names[:max_items]
                values = values[:max_items]
                fig, ax = plt.subplots(figsize=(6, 3), dpi=100)
                y_pos = range(len(names))[::-1]
                ax.barh(range(len(names))[::-1], values, color='#1976D2')
                ax.set_yticks(range(len(names))[::-1])
                ax.set_yticklabels([n if len(n) < 30 else n[:27] + '...' for n in names])
                ax.set_xlabel('Vues')
                ax.set_title(title)
                plt.tight_layout()
                buf = io.BytesIO()
                fig.savefig(buf, format='png', bbox_inches='tight', dpi=150)
                plt.close(fig)
                buf.seek(0)
                return ImageReader(buf)
            except Exception:
                return None

        # Cover page
        c.setFillColor(colors.HexColor('#0f172a'))
        c.rect(0, 0, width, height, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont('Helvetica-Bold', 28)
        c.drawCentredString(width / 2, height - 120, 'Rapport résumé — Pixelette')
        c.setFont('Helvetica', 12)
        c.drawCentredString(width / 2, height - 145, f"Généré le: {datetime.datetime.utcnow().isoformat()}Z")
        c.setFont('Helvetica', 10)
        c.drawCentredString(width / 2, height - 165, f"Galeries publiques: {galeries_pub} • Galeries privées: {galeries_pri} • Œuvres: {total_oeuvres}")
        c.showPage()

        # Main content page
        y = height - 40
        c.setFillColor(colors.black)

        # --- Welcome top summary (big banner + metrics) ---
        c.setFont('Helvetica-Bold', 20)
        c.drawString(40, y, 'Bienvenue sur Pixelette 🎨')
        y -= 26
        c.setFont('Helvetica', 11)
        welcome_text = f"Votre plateforme de gestion d'œuvres d'art et de galeries. Actuellement, vous gérez {total_oeuvres} œuvres réparties dans {len(galeries)} galeries."
        y = draw_wrapped_text(40, y, welcome_text, font_size=11, leading=14, max_width=width - 80)
        y -= 8

        # Compute simple month-over-month deltas for display
        now = datetime.datetime.utcnow()
        delta_days = 30
        try:
            since = now - datetime.timedelta(days=delta_days)
            prev_since = now - datetime.timedelta(days=delta_days * 2)
            oeuvres_last = Oeuvre.objects.filter(date_creation__gte=since).count()
            oeuvres_prev = Oeuvre.objects.filter(date_creation__gte=prev_since, date_creation__lt=since).count()
            galeries_last = Galerie.objects.filter(date_creation__gte=since).count()
            galeries_prev = Galerie.objects.filter(date_creation__gte=prev_since, date_creation__lt=since).count()
            users_last = Utilisateur.objects.filter(date_inscription__gte=since).count()
            users_prev = Utilisateur.objects.filter(date_inscription__gte=prev_since, date_inscription__lt=since).count()
        except Exception:
            oeuvres_last = oeuvres_prev = galeries_last = galeries_prev = users_last = users_prev = 0

        def pct(new, old):
            try:
                if old == 0:
                    return None
                return round(((new - old) / old) * 100, 1)
            except Exception:
                return None

        oeuvres_delta = pct(oeuvres_last, oeuvres_prev)
        galeries_delta = pct(galeries_last, galeries_prev)
        users_delta = pct(users_last, users_prev)

        total_galeries = len(galeries)
        galeries_pub_count = galeries_pub
        avg_oeuvres_per_galerie = round((total_oeuvres / total_galeries) if total_galeries else 0, 1)

        # Draw metric cards (simple grid)
        box_x = 40
        box_w = (width - 80)
        card_h = 56
        # We'll draw four small cards stacked horizontally when space allows
        card_w = (box_w - 24) / 4

        metrics = [
            (str(total_oeuvres), f'Œuvres', oeuvres_delta),
            (str(total_galeries), f'Galeries', galeries_delta),
            (str(avg_oeuvres_per_galerie), f'Moyenne œuvres/galerie', None),
            (str(Utilisateur.objects.count()), f'Utilisateurs', users_delta),
        ]

        cx = box_x
        cy = y
        c.setFont('Helvetica-Bold', 18)
        for val, label, delta in metrics:
            # Card background
            c.setFillColor(colors.whitesmoke)
            c.rect(cx - 6, cy - card_h, card_w + 12, card_h, stroke=0, fill=1)
            c.setFillColor(colors.black)
            # Value
            c.setFont('Helvetica-Bold', 16)
            c.drawString(cx, cy - 18, val)
            # Label
            c.setFont('Helvetica', 9)
            c.drawString(cx, cy - 34, label)
            # Delta if available
            if delta is not None:
                try:
                    delta_text = f"{delta:+.1f}% ce mois"
                    c.setFont('Helvetica', 8)
                    c.setFillColor(colors.HexColor('#16a34a') if delta >= 0 else colors.red)
                    c.drawString(cx + card_w - 60, cy - 18, delta_text)
                    c.setFillColor(colors.black)
                except Exception:
                    pass

            cx += card_w + 8

        y = cy - card_h - 12

        # Small CTA line
        c.setFont('Helvetica-Bold', 11)
        c.drawString(40, y, 'Voir les œuvres')
        y -= 22

        # Continue with the rest of the synthese
        c.setFont('Helvetica-Bold', 16)
        c.drawString(40, y, 'Synthèse')
        y -= 22

        # AI or template summary
        ai_summary = None
        try:
            prompt_lines = [
                "Please write a short, friendly French summary (3-4 sentences) of the following dashboard data:",
                f"Galeries publiques: {galeries_pub}",
                f"Galeries privées: {galeries_pri}",
                f"Total œuvres: {total_oeuvres}",
                "Top galeries (name: views):",
            ]
            for g in top_galeries[:5]:
                prompt_lines.append(f"- {g.nom}: {g.vues}")
            prompt_lines.append("Top œuvres (name: views):")
            for o in top_oeuvres[:5]:
                prompt_lines.append(f"- {o.titre}: {o.vues}")

            prompt = '\n'.join(prompt_lines)
            ai_summary = generate_ai_text(prompt, max_tokens=250, temperature=0.7)
        except Exception:
            ai_summary = None

        if not ai_summary:
            # Local template fallback
            ai_summary = (
                f"Au total, cette période présente {galeries_pub} galeries publiques et {galeries_pri} galeries privées, "
                f"regroupant {total_oeuvres} œuvres. Les galeries les plus vues sont {', '.join([g.nom for g in top_galeries[:3]])}.")

        c.setFont('Helvetica', 11)
        y = draw_wrapped_text(40, y, ai_summary, font_size=11, leading=15)
        y -= 10

        # Insert pie chart for public/private
        pie_img = make_pie(galeries_pub, galeries_pri)
        if pie_img:
            c.drawImage(pie_img, width - 220, y - 160, width=160, height=160)

        # Top galleries bar chart
        gal_names = [g.nom for g in top_galeries]
        gal_vals = [int(g.vues) for g in top_galeries]
        gal_img = make_bar(gal_names, gal_vals, title='Top Galeries')
        if gal_img:
            c.drawImage(gal_img, 40, y - 200, width=width - 300, height=160)
            y -= 200
        else:
            # fallback textual list
            c.setFont('Helvetica-Bold', 12)
            c.drawString(40, y, 'Top Galeries (vues)')
            y -= 18
            c.setFont('Helvetica', 10)
            for g in top_galeries[:15]:
                c.drawString(50, y, f"- {g.nom} : {g.vues}")
                y -= 14
                if y < 80:
                    c.showPage()
                    y = height - 40

        # Per-item detailed paragraphs (top 5 galleries and top 5 oeuvres)
        def generate_item_summaries_for_galleries(galeries_list):
            summaries = []
            try:
                prompt = 'Génère pour chaque galerie ci-dessous une courte description en français (1-2 phrases) qui met en avant le thème, l\'ambiance et pourquoi elle attire des vues. Sépare chaque description par "###".\n\n'
                for g in galeries_list[:10]:
                    desc = g.description or ''
                    theme = g.theme or ''
                    owner = f"{g.proprietaire.prenom} {g.proprietaire.nom}" if getattr(g, 'proprietaire', None) else ''
                    prompt += f"Galerie: {g.nom}\nDescription: {desc}\nThème: {theme}\nPropriétaire: {owner}\nVues: {g.vues}\n---\n"
                text = generate_ai_text(prompt, max_tokens=800, temperature=0.7)
                if text:
                    parts = [p.strip() for p in text.split('###') if p.strip()]
                    for i, g in enumerate(galeries_list[:len(parts)]):
                        summaries.append(parts[i])
            except Exception:
                summaries = []

            # fallback to simple template for any missing summaries
            for i, g in enumerate(galeries_list[:5]):
                if i < len(summaries):
                    continue
                desc = g.description or 'Aucune description fournie.'
                theme = g.theme or 'Thème non spécifié.'
                owner = f"{g.proprietaire.prenom} {g.proprietaire.nom}" if getattr(g, 'proprietaire', None) else 'Propriétaire inconnu.'
                summaries.append(f"{g.nom} — {desc} Propriétaire: {owner}. Thème: {theme}. Vues: {g.vues}.")
            return summaries

        def generate_item_summaries_for_oeuvres(oeuvres_list):
            summaries = []
            try:
                prompt = 'Génère pour chaque œuvre ci-dessous une courte description en français (1-2 phrases) qui décrit l\'œuvre, le style et pourquoi elle attire des vues. Sépare chaque description par "###".\n\n'
                for o in oeuvres_list[:10]:
                    desc = o.description or ''
                    author = f"{o.auteur.prenom} {o.auteur.nom}" if getattr(o, 'auteur', None) else ''
                    prompt += f"Oeuvre: {o.titre}\nDescription: {desc}\nAuteur: {author}\nVues: {o.vues}\n---\n"
                text = generate_ai_text(prompt, max_tokens=800, temperature=0.7)
                if text:
                    parts = [p.strip() for p in text.split('###') if p.strip()]
                    for i, o in enumerate(oeuvres_list[:len(parts)]):
                        summaries.append(parts[i])
            except Exception:
                summaries = []

            for i, o in enumerate(oeuvres_list[:5]):
                if i < len(summaries):
                    continue
                desc = o.description or 'Aucune description fournie.'
                author = f"{o.auteur.prenom} {o.auteur.nom}" if getattr(o, 'auteur', None) else 'Auteur inconnu.'
                summaries.append(f"{o.titre} — {desc} Auteur: {author}. Vues: {o.vues}.")
            return summaries

        # Generate summaries
        gallery_summaries = generate_item_summaries_for_galleries(list(top_galeries))
        oeuvre_summaries = generate_item_summaries_for_oeuvres(list(top_oeuvres))

        # Détails des galeries: description + render as a two-column grid of cards
        y -= 10
        # Section description (sanitized)
        galeries_section_desc = sanitize_text(
            "Cette section présente les galeries les plus visibles de la plateforme. Chaque carte contient le propriétaire, le thème, le nombre de vues et une courte description pour mieux comprendre pourquoi la galerie attire des visiteurs."
        )
        c.setFont('Helvetica', 10)
        y = draw_wrapped_text(40, y, galeries_section_desc, font_size=10, leading=13, max_width=width - 80)
        y -= 8
        c.setFont('Helvetica-Bold', 12)
        c.drawString(40, y, 'Détails des galeries')
        y -= 18

        cols = 2
        gap = 12
        card_w = (width - 80 - gap) / cols
        card_h = 140
        x_start = 40

        c.setFont('Helvetica', 10)
        galeries_to_show = list(top_galeries[:12])
        for i, g in enumerate(galeries_to_show):
            col = i % cols
            row = i // cols
            x = x_start + col * (card_w + gap)
            y_row_top = y - row * (card_h + 16)

            # Start a new page if this row would overflow
            if y_row_top - card_h < 60:
                c.showPage()
                y = height - 40
                row = 0
                x = x_start + col * (card_w + gap)
                y_row_top = y - row * (card_h + 16)

            # Draw card border
            c.setStrokeColor(colors.lightgrey)
            c.rect(x, y_row_top - card_h, card_w, card_h, stroke=1, fill=0)

            # Thumbnail: use the first artwork image from the gallery if available
            thumb_w = 100
            thumb_h = 100
            thumb_x = x + 8
            thumb_y = y_row_top - 12 - thumb_h
            thumb = None
            try:
                first_oeuvre = g.oeuvres.first()
                if first_oeuvre and getattr(first_oeuvre, 'image', None) and getattr(first_oeuvre.image, 'path', None):
                    thumb = ImageReader(open(first_oeuvre.image.path, 'rb'))
            except Exception:
                thumb = None

            if thumb:
                try:
                    c.drawImage(thumb, thumb_x, thumb_y, width=thumb_w, height=thumb_h, preserveAspectRatio=True, anchor='sw')
                except Exception:
                    thumb = None

            # Text area
            text_x = x + thumb_w + 18 if thumb else x + 12
            text_y = y_row_top - 18
            title = (g.nom or 'Sans nom')
            owner = f"{g.proprietaire.prenom} {g.proprietaire.nom}" if getattr(g, 'proprietaire', None) else 'Propriétaire inconnu'
            theme = g.theme or 'Thème non spécifié'
            views = int(getattr(g, 'vues', 0) or 0)

            # Title (wrapped and sanitized)
            c.setFont('Helvetica-Bold', 11)
            title_text = sanitize_text(title)
            title_y = draw_wrapped_text(
                text_x,
                text_y,
                title_text,
                font_name='Helvetica-Bold',
                font_size=11,
                leading=13,
                max_width=(card_w - (thumb_w + 36)) if thumb else (card_w - 24),
            )

            # Metadata line: owner • theme • vues (wrapped)
            meta = f"Propriétaire: {owner} • Thème: {theme} • Vues: {views}"
            meta = sanitize_text(meta)
            c.setFont('Helvetica', 9)
            meta_y = draw_wrapped_text(
                text_x,
                title_y,
                meta,
                font_name='Helvetica',
                font_size=9,
                leading=11,
                max_width=(card_w - (thumb_w + 36)) if thumb else (card_w - 24),
            )

            # Description (use generated summary if available), sanitized and wrapped
            desc_idx = i if i < len(gallery_summaries) else None
            raw_desc = gallery_summaries[desc_idx] if desc_idx is not None else (g.description or 'Aucune description fournie.')
            desc_text = sanitize_text(raw_desc)
            c.setFont('Helvetica', 9)
            _ = draw_wrapped_text(
                text_x,
                meta_y,
                desc_text,
                font_name='Helvetica',
                font_size=9,
                leading=11,
                max_width=(card_w - (thumb_w + 36)) if thumb else (card_w - 24),
            )

        # Adjust y after grid
        rows_drawn = (len(galeries_to_show) + cols - 1) // cols
        y = y - rows_drawn * (card_h + 16) - 20

        # (Removed) per-œuvre paragraph list — to keep report concise we list top œuvres in the 'Top Œuvres' section below.

        # Next page: Top Œuvres displayed as a two-column grid of cards
        c.showPage()
        y = height - 40
        c.setFont('Helvetica-Bold', 14)
        c.drawString(40, y, 'Top Œuvres')
        y -= 24

        cols = 2
        gap = 12
        card_w = (width - 80 - gap) / cols
        card_h = 140
        x_start = 40

        c.setFont('Helvetica', 10)
        oeuvres_to_show = list(top_oeuvres[:12])
        for i, o in enumerate(oeuvres_to_show):
            col = i % cols
            row = i // cols
            x = x_start + col * (card_w + gap)
            y_row_top = y - row * (card_h + 16)

            # Start a new page if this row would overflow
            if y_row_top - card_h < 60:
                c.showPage()
                y = height - 40
                row = 0
                x = x_start + col * (card_w + gap)
                y_row_top = y - row * (card_h + 16)

            # Draw card border
            c.setStrokeColor(colors.lightgrey)
            c.rect(x, y_row_top - card_h, card_w, card_h, stroke=1, fill=0)

            # Thumbnail (left side)
            thumb_w = 100
            thumb_h = 100
            thumb_x = x + 8
            thumb_y = y_row_top - 12 - thumb_h
            thumb = None
            try:
                if getattr(o, 'image', None) and getattr(o.image, 'path', None):
                    thumb = ImageReader(open(o.image.path, 'rb'))
            except Exception:
                thumb = None

            if thumb:
                try:
                    c.drawImage(thumb, thumb_x, thumb_y, width=thumb_w, height=thumb_h, preserveAspectRatio=True, anchor='sw')
                except Exception:
                    thumb = None

            # Text area (right side)
            text_x = x + thumb_w + 18 if thumb else x + 12
            text_y = y_row_top - 18
            title = (o.titre or 'Sans titre')
            author = f"{o.auteur.prenom} {o.auteur.nom}" if getattr(o, 'auteur', None) else 'Auteur inconnu'
            views = int(getattr(o, 'vues', 0) or 0)

            c.setFont('Helvetica-Bold', 11)
            c.drawString(text_x, text_y, title[:60])
            text_y -= 14
            c.setFont('Helvetica', 9)
            c.drawString(text_x, text_y, f"Auteur: {author} • Vues: {views}")
            text_y -= 12

            # Description paragraph (use generated summaries if available)
            desc_idx = i if i < len(oeuvre_summaries) else None
            desc_text = oeuvre_summaries[desc_idx] if desc_idx is not None else (o.description or 'Aucune description fournie.')
            # Wrap description within card text area
            max_desc_width = card_w - (thumb_w + 36) if thumb else card_w - 24
            # Use a small helper to draw wrapped text at (text_x, text_y)
            def _draw_desc(xpos, ypos, text_val):
                nonlocal c
                c.setFont('Helvetica', 9)
                words = text_val.split()
                line = ''
                cur_y = ypos
                for w in words:
                    test = (line + ' ' + w).strip()
                    if c.stringWidth(test, 'Helvetica', 9) > max_desc_width:
                        c.drawString(xpos, cur_y, line)
                        cur_y -= 12
                        line = w
                    else:
                        line = test
                if line:
                    c.drawString(xpos, cur_y, line)
                    cur_y -= 12
                return cur_y

            _draw_desc(text_x, text_y, desc_text)

        # Move y down past the grid we just drew
        rows_drawn = (len(oeuvres_to_show) + cols - 1) // cols
        y = y - rows_drawn * (card_h + 16) - 20

        # Artists bar chart (kept below)
        artist_labels = [f"{a.prenom} {a.nom}" for a in artists_qs[:12]]
        artist_values = [int(getattr(a, 'total_views') or 0) for a in artists_qs[:12]]
        artist_img = make_bar(artist_labels, artist_values, title='Top Artistes', max_items=12)
        if artist_img:
            # Ensure we have space, otherwise new page
            if y - 240 < 60:
                c.showPage()
                y = height - 40
            c.drawImage(artist_img, 40, y - 220, width=width - 80, height=220)

        c.save()

        # write buffer to file
        with open(pdf_path, 'wb') as f:
            f.write(buffer.getvalue())

        # If caller requested immediate download, return file as attachment
        try_download = False
        try:
            # support both JSON body and form params
            try_download = bool(request.data.get('download'))
        except Exception:
            try_download = str(request.GET.get('download', '')).lower() in ('1', 'true', 'yes')

        if try_download:
            # stream the file back
            return FileResponse(open(pdf_path, 'rb'), as_attachment=True, filename=pdf_filename, content_type='application/pdf')

        # otherwise return an absolute URL so the frontend opens the correct backend host
        report_url = request.build_absolute_uri(settings.MEDIA_URL + 'reports/' + pdf_filename)
        return JsonResponse({'report_url': report_url})

    except Exception as e:
        # fallback: write text summary instead and return txt url
        txt_filename = f"dashboard_summary_{filename_ts}.txt"
        txt_path = os.path.join(reports_dir, txt_filename)
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(summary_lines))

        # If download requested, stream the text file
        try_download = False
        try:
            try_download = bool(request.data.get('download'))
        except Exception:
            try_download = str(request.GET.get('download', '')).lower() in ('1', 'true', 'yes')

        if try_download:
            return FileResponse(open(txt_path, 'rb'), as_attachment=True, filename=txt_filename, content_type='text/plain')

        report_url = request.build_absolute_uri(settings.MEDIA_URL + 'reports/' + txt_filename)
        return JsonResponse({'report_url': report_url, 'warning': str(e)})


@api_view(['GET'])
@permission_classes([AllowAny])
def views_by_artist(request):
    """Return aggregated views per artist (sum of their oeuvres.vues + galeries.vues).

    Query params:
      - top (int, default=10): return only top N artists by total views
      - artists_only (bool, default=true): restrict to users with role='artiste'
      - include_zero (bool, default=false): include artists with zero total views

    Response: { labels: [...], values: [...] }
    """
    try:
        top = int(request.query_params.get('top', 10))
    except Exception:
        top = 10
    artists_only = str(request.query_params.get('artists_only', 'true')).lower() in ('1', 'true', 'yes')
    include_zero = str(request.query_params.get('include_zero', 'false')).lower() in ('1', 'true', 'yes')

    from django.db.models import Sum, F
    from django.db.models.functions import Coalesce

    qs = Utilisateur.objects.all()
    if artists_only:
        qs = qs.filter(role='artiste')

    # Annotate sums of related vues and compute a total
    qs = qs.annotate(
        total_oeuvre_views=Coalesce(Sum('oeuvres__vues'), 0),
        total_galerie_views=Coalesce(Sum('galeries__vues'), 0),
    ).annotate(total_views=F('total_oeuvre_views') + F('total_galerie_views')).order_by('-total_views')

    if not include_zero:
        qs = qs.filter(total_views__gt=0)

    # Limit to top N
    qs = qs[:top]

    labels = []
    values = []
    for u in qs:
        labels.append(f"{u.prenom} {u.nom}")
        values.append(int(getattr(u, 'total_views') or 0))

    return Response({'labels': labels, 'values': values})