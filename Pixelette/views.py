from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .utils.color_analysis import analyze_galerie_palette
from .utils.clustering import cluster_galeries
from .utils.spotify import generate_playlist_for_gallery, search_playlists_by_theme, get_spotify_oauth, create_playlist_in_user_account
from .utils.content_moderation import moderate_text, filter_bad_words
from .utils.ai_comment_generator import generate_ai_comment, generate_multiple_ai_comments
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import viewsets
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique, GalerieInvitation, SavedStat, Suivi
from .serializers import UtilisateurSerializer, OeuvreSerializer, GalerieSerializer, InteractionSerializer, StatistiqueSerializer, GalerieInvitationSerializer, SavedStatSerializer, SuiviSerializer, InteractionCreateSerializer
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
from django.db import models
from django.db.models import Count, Q
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
import logging
from rest_framework.authtoken.models import Token 
logger = logging.getLogger(__name__)


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

from .utils.score_artiste import calculer_score_artiste, calculer_suggestions_amelioration
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.conf import settings
from .models import ConsultationOeuvre, PartageOeuvre, ContactArtiste, Utilisateur
from .serializers import ConsultationOeuvreSerializer, PartageOeuvreSerializer, ContactArtisteSerializer
from .utils.recommendations_oeuvres import get_recommendations_for_user
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TempAuthStorage
from django.utils import timezone
import uuid
from Pixelette.token_adapter import get_or_create_token

class TempAuthStorageView(APIView):
    permission_classes = [permissions.AllowAny] 

    def post(self, request):
        try:
            token = request.data.get('token')
            user_data = request.data.get('user')
            if not token or not user_data:
                return Response(
                    {'error': 'Token et données utilisateur requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            temp_auth = TempAuthStorage.objects.create(
                token=token,
                user_data=user_data,
            )
            print(f"[POST /api/auth/store_temp/] Stored with temp_id: {temp_auth.id}")
            return Response({'temp_id': str(temp_auth.id)}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"[POST /api/auth/store_temp/] Error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request, temp_id):
        try:
            temp_auth = TempAuthStorage.objects.get(id=temp_id)
            if temp_auth.is_expired():
                temp_auth.delete()
                return Response(
                    {'error': 'Données temporaires expirées'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            data = {
                'token': temp_auth.token,
                'user': temp_auth.user_data,
            }
            temp_auth.delete()
            print(f"[GET /api/auth/get_temp/{temp_id}/] Retrieved and deleted temp_id: {temp_id}")
            return Response(data, status=status.HTTP_200_OK)
        except TempAuthStorage.DoesNotExist:
            return Response(
                {'error': 'Identifiant temporaire invalide'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"[GET /api/auth/get_temp/{temp_id}/] Error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class IsTokenAuthenticated:
    def has_permission(self, request, view):
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Token '):
            token = auth_header.split(' ')[1]
            session_token = request.session.get('token')
            if token != session_token:
                return False
            
            user_id = request.session.get('user_id')
            if not user_id:
                return False
            
            try:
                user = Utilisateur.objects.get(id=user_id)
                request.user = user
                return True
            except Utilisateur.DoesNotExist:
                return False
        return False
    
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and hasattr(request.user, 'role') and request.user.role == 'admin'


class IsAdminOrSession(permissions.BasePermission):
    """Permission that accepts either a DRF-authenticated Utilisateur with role 'admin' or 'artiste'
    or a session-based user_id pointing to an admin or artiste Utilisateur.
    This allows the frontend (which uses cookies/session) to be treated as admin/artiste
    even when request.user is not the custom Utilisateur instance.
    """
    def has_permission(self, request, view):
        print(f"🔍 IsAdminOrSession.has_permission appelé")
        
        # First, try the normal DRF request.user
        user = getattr(request, 'user', None)
        print(f"📋 request.user: {user}")
        print(f"📋 request.user type: {type(user)}")
        
        if user and hasattr(user, 'role'):
            print(f"📋 user.role: {user.role}")
            # ✅ Autoriser admin ET artiste
            if user.role in ['admin', 'artiste']:
                print(f"✅ {user.role} détecté via request.user")
                return True

        # Fallback: check session for our custom user_id
        uid = request.session.get('user_id')
        print(f"📋 Session user_id: {uid}")
        
        if not uid:
            print("❌ Pas de user_id dans la session")
            return False
            
        try:
            u = Utilisateur.objects.get(id=uid)
            print(f"📋 Utilisateur trouvé: {u.email} (role: {u.role})")
            # ✅ Autoriser admin ET artiste
            is_allowed = getattr(u, 'role', None) in ['admin', 'artiste']
            print(f"📋 Accès autorisé: {is_allowed}")
            return is_allowed
        except Utilisateur.DoesNotExist:
            print(f"❌ Utilisateur {uid} non trouvé")
            return False
        except Exception as e:
            print(f"❌ Erreur dans IsAdminOrSession: {str(e)}") 
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
        """
        Définir les permissions selon l'action
        """
        print(f"🔍 get_permissions appelé pour action: {self.action}")
        
        # ✅ Actions PUBLIQUES (pas d'authentification requise)
        public_actions = [
            'create',           # Inscription
            'login',            # Connexion
            'logout',           # Déconnexion
            'generate_2fa',     # Génération 2FA
            'enable_2fa',       # Activation 2FA
            'verify_2fa',       # Vérification 2FA
            'disable_2fa',      # Désactivation 2FA
            'get_2fa_qr',       # QR code 2FA
            'forgot_password',  # Mot de passe oublié
            'verify_code',      # Vérification code reset
            'reset_password_code',  # Reset password
            'request_password_reset',
            'count',            # Compteur utilisateurs
            'artistes',         # Liste des artistes
            'restore_session',  # Restauration session
            'demander_artiste', # Demande rôle artiste
            'statut_demande',   # Statut demande
            'list',             # ✅ AJOUT : Liste des utilisateurs (publique)
        ]
        
        if self.action in public_actions:
            permission_classes = [AllowAny]
            print(f"✅ Permission AllowAny pour {self.action}")
        
        # ✅ Actions ADMIN UNIQUEMENT
        elif self.action in ['assign_role', 'recalculer_tous_scores', 'dashboard_artiste_potential']:
            permission_classes = [IsAdmin]
            print(f"✅ Permission IsAdmin pour {self.action}")
        
        # ✅ Actions AUTHENTIFIÉES (utilisateurs connectés)
        elif self.action in [
            'profile',
            'mon_score_artiste',
            'retrieve',         # Détail utilisateur
            'update',           # Modifier utilisateur
            'partial_update',   # Modifier partiellement
            'destroy',          # Supprimer utilisateur
            'request_artist_role',
        ]:
            permission_classes = [IsAuthenticated]
            print(f"✅ Permission IsAuthenticated pour {self.action}")
        
        # ✅ Défaut : Admin ou Session (pour actions non listées)
        else:
            permission_classes = [IsAdminOrSession]
            print(f"⚠️ Permission IsAdminOrSession pour {self.action}")
        
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def count(self, request):
        """Compte le nombre total d'utilisateurs - accessible à tous"""
        total = Utilisateur.objects.count()
        return Response({'count': total})

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()
        return Response({'message': 'Utilisateur supprimé avec succès'}, status=status.HTTP_204_NO_CONTENT)

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

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def demander_artiste(self, request):
        """
        Permettre à un utilisateur de demander à devenir artiste
        POST /api/utilisateurs/demander_artiste/
        """
        if request.user.role != 'user':
            return Response({'error': 'Seuls les utilisateurs peuvent demander à devenir artiste'}, status=400)
        
        # Vérifier s'il n'y a pas déjà une demande en cours
        if DemandeRole.objects.filter(utilisateur=request.user, statut='pending').exists():
            return Response({'error': 'Vous avez déjà une demande en cours'}, status=400)
        
        # Créer la demande
        demande = DemandeRole.objects.create(
            utilisateur=request.user,
            nouveau_role='artiste',
            statut='pending'
        )
        
        return Response({
            'message': 'Demande créée avec succès ! Vous serez notifié de la réponse.',
            'demande_id': demande.id,
            'statut': 'pending'
        })

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def statut_demande(self, request):
        """
        Permettre à un utilisateur de voir le statut de sa demande d'artiste
        GET /api/utilisateurs/statut_demande/
        """
        if request.user.role != 'user':
            return Response({'error': 'Seuls les utilisateurs peuvent voir leur statut de demande'}, status=400)
        
        # Récupérer la dernière demande de l'utilisateur
        try:
            demande = DemandeRole.objects.filter(utilisateur=request.user).latest('date_creation')
            return Response({
                'demande_id': demande.id,
                'statut': demande.statut,
                'date_creation': demande.date_creation,
                'message': self._get_statut_message(demande.statut)
            })
        except DemandeRole.DoesNotExist:
            return Response({
                'statut': 'aucune',
                'message': 'Aucune demande trouvée'
            })

    def _get_statut_message(self, statut):
        """Messages selon le statut de la demande"""
        messages = {
            'pending': '⏳ Votre demande est en cours d\'examen par l\'administrateur',
            'approved': '✅ Félicitations ! Votre demande a été approuvée. Vous êtes maintenant artiste !',
            'rejected': '❌ Votre demande a été refusée. Vous pouvez faire une nouvelle demande plus tard.'
        }
        return messages.get(statut, 'Statut inconnu')

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
        user.save()  
        
        return Response({'message': f'Rôle changé de {old_role} à {new_role} pour {user.prenom} {user.nom}'})
    

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
        user.two_factor_secret = None  
        user.two_factor_temp_secret = None
        user.save(update_fields=['is_two_factor_enabled', 'two_factor_secret', 'two_factor_temp_secret'])
        
        return Response({
            'message': '2FA activé ! Reconnectez-vous pour scanner le QR code.',
            'user': UtilisateurSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK)
    

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email et mot de passe requis'}, status=400)
        
        try:
            user = Utilisateur.objects.get(email=email)
            
            if not check_password(password, user.password):
                return Response({'error': 'Mot de passe incorrect'}, status=401)
            
            # 2FA check
            if user.is_two_factor_enabled:
                return Response({
                    'message': '2FA required',
                    'email': user.email,
                    'user_id': user.id,
                    'role': user.role
                }, status=200)
            
            # ✅ Utiliser l'adaptateur pour créer le token
            token_key = get_or_create_token(user)
            
            # Créer la session (pour backoffice)
            request.session['token'] = token_key
            request.session['user_id'] = user.id
            request.session.save()
            
            print(f"✅ Login: {user.email} - Token: {token_key[:10]}...")
            
            return Response({
                'message': 'Login réussi',
                'token': token_key,
                'user': UtilisateurSerializer(user, context={'request': request}).data,
                'role': user.role
            })
            
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=401)  
        
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_2fa(self, request):
        email = request.data.get('email')
        token_code = request.data.get('token')
        
        if not email:
            return Response({'error': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = Utilisateur.objects.get(email=email)
            
            # --- Étape 1 : Génération du QR code ---
            if not token_code:
                if not user.two_factor_secret:
                    temp_secret = pyotp.random_base32()
                    user.two_factor_temp_secret = temp_secret
                    user.save(update_fields=['two_factor_temp_secret'])
                else:
                    temp_secret = user.two_factor_secret
                
                otp_auth_url = pyotp.totp.TOTP(temp_secret).provisioning_uri(
                    name=user.email,
                    issuer_name='Pixelette'
                )
                
                qr = qrcode.QRCode(version=1, error_correction=ERROR_CORRECT_L, box_size=10, border=4)
                qr.add_data(otp_auth_url)
                qr.make(fit=True)
                
                img = qr.make_image(fill_color="black", back_color="white")
                buffer = BytesIO()
                img.save(buffer, format='PNG')
                qr_code_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
                
                return Response({
                    'qrCode': f"data:image/png;base64,{qr_code_data}",
                    'message': 'Scannez le QR code avec Google Authenticator'
                })
            
            # --- Étape 2 : Vérification du code ---
            secret = user.two_factor_secret if user.two_factor_secret else user.two_factor_temp_secret
            
            if not secret:
                return Response({'error': "Générez d'abord le QR code"}, status=status.HTTP_400_BAD_REQUEST)
            
            totp = pyotp.TOTP(secret)
            is_valid = totp.verify(token_code, valid_window=1)
            
            if not is_valid:
                return Response({'error': 'Code invalide'}, status=400)
            
            # --- Étape 3 : Enregistrement définitif du secret ---
            if not user.two_factor_secret and user.two_factor_temp_secret:
                user.two_factor_secret = user.two_factor_temp_secret
                user.two_factor_temp_secret = None
                user.save(update_fields=['two_factor_secret', 'two_factor_temp_secret'])
            
            # --- Étape 4 : Génération du token d'authentification ---
            token_key = get_or_create_token(user)
            
            # Session pour backoffice
            request.session['token'] = token_key
            request.session['user_id'] = user.id
            request.session.save()
            
            return Response({
                'message': 'Authentification réussie !',
                'token': token_key,
                'user': UtilisateurSerializer(user, context={'request': request}).data,
                'role': user.role
            })

        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def restore_session(self, request):
        token = request.data.get('token')
        user_id = request.data.get('user_id')
        
        if not token or not user_id:
            return Response({'error': 'Token et user_id requis'}, status=400)
        
        try:
            user = Utilisateur.objects.get(id=user_id)
            print(f"🔍 RESTORE: Utilisateur trouvé: {user.email} (role: {user.role})")
            
            # ✅ Utiliser le système de token existant avec Utilisateur personnalisé
            # Vérifier que le token existe dans authtoken_token
            try:
                # Utiliser get_or_create pour éviter l'erreur "Must be User instance"
                from django.contrib.auth.models import User as DjangoUser
                django_user, created = DjangoUser.objects.get_or_create(
                    username=user.email,
                    defaults={'email': user.email, 'password': '!'}
                )
                
                drf_token, token_created = Token.objects.get_or_create(
                    user=django_user,
                    defaults={'key': token}
                )
                
                if token_created:
                    print(f"⚠️ RESTORE: Token DRF créé: {token[:10]}...")
                else:
                    print(f"✅ RESTORE: Token DRF existant trouvé")
                    
            except Exception as token_error:
                print(f"❌ RESTORE: Erreur token: {str(token_error)}")
                # Continuer même si le token a un problème
            
            # Créer la session (pour backoffice)
            request.session['token'] = token
            request.session['user_id'] = user_id
            request.session.modified = True
            request.session.save()
            
            print(f"✅ RESTORE: Session OK - user={user.email}, role={user.role}, session_key={request.session.session_key}")
            return Response({'message': 'Session OK'}, status=200)
            
        except Utilisateur.DoesNotExist:
            print(f"❌ RESTORE: User {user_id} not found")
            return Response({'error': 'User invalide'}, status=404)
        except Exception as e:
            print(f"❌ RESTORE Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'], permission_classes=[IsTokenAuthenticated | IsAdminOrSession])
    def profile(self, request):
        """Récupère le profil de l'utilisateur connecté"""
        user = request.user
        serializer = UtilisateurSerializer(user, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsTokenAuthenticated | IsAdminOrSession])
    def logout(self, request):
        """Déconnexion de l'utilisateur"""
        request.session.flush()
        return Response({'message': 'Déconnexion réussie'})

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
        
    @action(detail=False, methods=['get'], url_path='artistes')
    def artistes(self, request, *args, **kwargs):
    # Handle unauthenticated (minimal addition)
        user_suivis = Suivi.objects.filter(utilisateur=request.user).values_list('artiste_id', flat=True) if request.user and request.user.is_authenticated else []
        """Liste tous les utilisateurs ayant le rôle 'artiste'"""
        artistes = Utilisateur.objects.filter(role='artiste')
        serializer = self.get_serializer(artistes, many=True, context={'request': request})
        
        # Ajouter le statut de suivi pour chaque artiste si l'utilisateur est connecté
        artistes_data = serializer.data
        
        # Vérifier de manière sécurisée si l'utilisateur est authentifié
        user_suivis = []
        try:
            if request.user and request.user.is_authenticated and isinstance(request.user, Utilisateur):
                user_suivis = list(Suivi.objects.filter(utilisateur=request.user).values_list('artiste_id', flat=True))
        except (AttributeError, ValueError, TypeError):
            # L'utilisateur n'est pas correctement authentifié
            pass
        
        # Ajouter les informations de suivi à chaque artiste
        for artiste in artistes_data:
            artiste['is_followed'] = artiste['id'] in user_suivis
            # Compter le nombre d'abonnés
            artiste['followers_count'] = Suivi.objects.filter(artiste_id=artiste['id']).count()
        
        return Response({
            'count': len(artistes_data),
            'artistes': artistes_data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='mon-score-artiste')
    def mon_score_artiste(self, request):
        """
        Calculer et retourner le score artiste de l'utilisateur connecté
        GET /api/utilisateurs/mon_score_artiste/
        """
        try:
            # ✅ CORRECTION : Récupérer l'utilisateur depuis request
            user = request.user
            
            # ✅ CORRECTION : Indentation fixée
            if user.role != 'user':
                return Response({
                    'error': 'Cette fonctionnalité est réservée aux utilisateurs'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Calculer le score
            score_data = calculer_score_artiste(user)
            
            # Mettre à jour le score dans la base
            user.score_artiste = score_data['score']
            user.score_artiste_updated = timezone.now()
            user.save(update_fields=['score_artiste', 'score_artiste_updated'])
            
            # Calculer les suggestions
            suggestions = calculer_suggestions_amelioration(user, score_data)
            
            return Response({
                'score': score_data['score'],
                'categorie': score_data['categorie'],
                'badge': score_data['badge'],
                'details': score_data['details'],
                'suggestions': suggestions,
                'message': self._get_message_by_score(score_data['score'])
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur calcul score: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors du calcul du score: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    def _get_message_by_score(self, score):
        """Messages personnalisés selon le score"""
        if score >= 80:
            return "🌟 Excellent ! Vous avez le profil d'un artiste. Pourquoi ne pas franchir le pas ?"
        elif score >= 60:
            return "🎨 Vous êtes sur la bonne voie ! Continuez à explorer et vous pourrez devenir artiste."
        elif score >= 40:
            return "💡 Vous montrez de l'intérêt pour l'art. Explorez davantage pour progresser !"
        else:
            return "👤 Bienvenue ! Prenez le temps de découvrir nos artistes et la communauté."
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def recalculer_tous_scores(self, request):
        """
        Recalculer les scores de tous les utilisateurs (admin only)
        POST /api/utilisateurs/recalculer_tous_scores/
        """
        try:
            users = Utilisateur.objects.filter(role='user')
            updated_count = 0
            
            for user in users:
                score_data = calculer_score_artiste(user)
                user.score_artiste = score_data['score']
                user.score_artiste_updated = timezone.now()
                user.save(update_fields=['score_artiste', 'score_artiste_updated'])
                updated_count += 1
            
            return Response({
                'message': f'{updated_count} utilisateurs mis à jour',
                'count': updated_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdmin])
    def dashboard_artiste_potential(self, request):
        """
        Dashboard admin : Liste des utilisateurs avec potentiel artiste
        GET /api/utilisateurs/dashboard_artiste_potential/
        """
        try:
            # Récupérer tous les users avec leur score
            users = Utilisateur.objects.filter(role='user').order_by('-score_artiste')
            
            # Catégoriser
            tres_probables = []
            probables = []
            potentiels = []
            
            for user in users:
                # Recalculer si score ancien (>7 jours) ou jamais calculé
                if not user.score_artiste_updated or \
                   (timezone.now() - user.score_artiste_updated).days > 7:
                    score_data = calculer_score_artiste(user)
                    user.score_artiste = score_data['score']
                    user.score_artiste_updated = timezone.now()
                    user.save(update_fields=['score_artiste', 'score_artiste_updated'])
                
                user_info = {
                    'id': user.id,
                    'nom': f"{user.prenom} {user.nom}",
                    'email': user.email,
                    'score': user.score_artiste,
                    'date_inscription': user.date_inscription,
                    'artistes_suivis': Suivi.objects.filter(utilisateur=user).count()
                }
                
                if user.score_artiste >= 80:
                    tres_probables.append(user_info)
                elif user.score_artiste >= 60:
                    probables.append(user_info)
                elif user.score_artiste >= 40:
                    potentiels.append(user_info)
            
            return Response({
                'statistiques': {
                    'tres_probables': len(tres_probables),
                    'probables': len(probables),
                    'potentiels': len(potentiels),
                    'total': users.count()
                },
                'tres_probables': tres_probables[:10],  # Top 10
                'probables': probables[:10],
                'potentiels': potentiels[:10]
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur dashboard: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @api_view(['POST'])
    @permission_classes([AllowAny])
    def store_temp(request):
        token = request.data.get('token')
        user_data = request.data.get('user_data')
        temp_obj = TempAuthStorage.objects.create(token=token, user_data=user_data)
        logger.info(f"[POST /api/auth/store_temp/] Stored with temp_id: {temp_obj.id}")
        return Response({'temp_id': str(temp_obj.id)}, status=201)

    @api_view(['GET'])
    @permission_classes([AllowAny])
    def exchange_temp(request):
        temp_id = request.query_params.get('temp_id')
        if not temp_id:
            return Response({'error': 'temp_id manquant'}, status=400)

        try:
            temp_obj = TempAuthStorage.objects.get(id=temp_id)
            if temp_obj.is_expired():
                temp_obj.delete()
                return Response({'error': 'temp_id expiré'}, status=400)

            token = temp_obj.token
            user_data = temp_obj.user_data

            temp_obj.delete()  # Supprime après usage

            return Response({
                'token': token,
                'user': user_data
            })
        except TempAuthStorage.DoesNotExist:
            return Response({'error': 'temp_id invalide'}, status=400)
         
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

        # Ensure we don't predict fewer views than the oeuvre already has.
        # Use the current oeuvre.vues as a floor and also consider a growth-based
        # estimate from the current value when available.
        try:
            current_views = int(getattr(oeuvre, 'vues') or 0)
        except Exception:
            current_views = 0

        if current_views > 0:
            # growth-based estimate from current observed views
            predicted_from_current = max(int(current_views * mult), current_views)
        else:
            predicted_from_current = 0

        predicted = max(predicted, predicted_from_current, 1)

        # --- Month-based estimation using daily `Statistique` records ---
        try:
            today_date = timezone.now().date()
            day_30_ago = today_date - datetime.timedelta(days=30)

            # Aggregate last 30 days of recorded vues for this oeuvre
            last_30_qs = Statistique.objects.filter(oeuvre=oeuvre, date__gte=day_30_ago)
            last_30_views = int(last_30_qs.aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0)
            days_with_stats = last_30_qs.values('date').distinct().count() or 0
            avg_daily_last_30 = (last_30_views / days_with_stats) if days_with_stats else 0.0

            # Compare recent 7-day window with previous 7-day window to estimate trend
            day_7_ago = today_date - datetime.timedelta(days=7)
            day_14_ago = today_date - datetime.timedelta(days=14)

            last7 = int(Statistique.objects.filter(oeuvre=oeuvre, date__gte=day_7_ago).aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0)
            prev7 = int(Statistique.objects.filter(oeuvre=oeuvre, date__gte=day_14_ago, date__lt=day_7_ago).aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0)

            avg7_last = last7 / 7.0
            avg7_prev = (prev7 / 7.0) if prev7 else None

            if avg7_prev and avg7_prev > 0:
                trend = avg7_last / max(avg7_prev, 1e-6)
            else:
                # If we don't have a previous window, use 1.0 (stable)
                trend = 1.0

            # Clamp trend so extreme spikes don't produce unrealistic predictions
            growth_factor = max(0.7, min(trend, 1.5))

            # Predict next 30 days from recent daily average and trend
            predicted_next_30 = int(round(avg_daily_last_30 * 30 * growth_factor)) if days_with_stats else predicted

            # Ensure floor at current_views
            try:
                current_views = int(getattr(oeuvre, 'vues') or 0)
            except Exception:
                current_views = 0
            predicted_next_30 = max(predicted_next_30, current_views, 1)

            # Adjust confidence: more data (days_with_stats) increases confidence
            confidence = int(min(98, confidence + min(30, days_with_stats)))
        except Exception:
            # If anything fails, fall back to earlier heuristic
            last_30_views = 0
            avg_daily_last_30 = 0.0
            trend = 1.0
            predicted_next_30 = predicted

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
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def recommendations(self, request):
        """
        Obtenir des recommandations personnalisées d'œuvres
        GET /api/oeuvres/recommendations/
        GET /api/oeuvres/recommendations/?limit=20
        """
        limit = int(request.query_params.get('limit', 12))
        
        try:
            # Générer les recommandations
            recommendations = get_recommendations_for_user(
                user=request.user,
                limit=limit
            )
            
            # Préparer la réponse
            results = []
            for rec in recommendations:
                oeuvre = rec['oeuvre']
                serializer = self.get_serializer(oeuvre, context={'request': request})
                oeuvre_data = serializer.data
                oeuvre_data['recommendation_score'] = rec['score']
                
                # Ajouter la raison de la recommandation
                oeuvre_data['recommendation_reason'] = self._get_recommendation_reason(rec['score'])
                
                results.append(oeuvre_data)
            
            return Response({
                'count': len(results),
                'algorithm': 'hybrid_collaborative_filtering',
                'recommendations': results,
                'message': 'Recommandations basées sur vos likes, commentaires et artistes suivis'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Erreur recommandations: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de la génération des recommandations: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_recommendation_reason(self, score):
        """Génère une raison basée sur le score"""
        if score >= 5:
            return "Fortement recommandé pour vous"
        elif score >= 3:
            return "Correspond à vos goûts"
        elif score >= 1.5:
            return "Pourrait vous plaire"
        else:
            return "À découvrir"

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def generate_ai_comment(self, request, pk=None):
        """Générer un commentaire IA intelligent basé sur l'œuvre"""
        try:
            # Récupérer l'œuvre
            oeuvre = self.get_object()
            
            # Préparer les données pour l'IA
            oeuvre_data = {
                'titre': oeuvre.titre,
                'description': oeuvre.description or '',
                'technique': '',  # Pas de champ technique dans le modèle
                'dimension': '',  # Pas de champ dimension dans le modèle
                'auteur_nom': oeuvre.auteur.nom if hasattr(oeuvre.auteur, 'nom') else str(oeuvre.auteur),
                'date_creation': str(oeuvre.date_creation.year) if oeuvre.date_creation else ''
            }
            
            # Générer le commentaire avec l'IA
            ai_result = generate_ai_comment(oeuvre_data)
            
            if ai_result['success']:
                return Response({
                    'success': True,
                    'comment': ai_result['comment'],
                    'style': ai_result['style'],
                    'confidence': ai_result['confidence'],
                    'metadata': ai_result['metadata'],
                    'message': f'Commentaire IA généré avec style "{ai_result["style"]}"'
                })
            else:
                return Response({
                    'success': False,
                    'error': ai_result['error']
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Erreur génération commentaire IA: {e}")
            return Response({
                'success': False,
                'error': f'Erreur interne: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def generate_multiple_ai_comments(self, request, pk=None):
        """Générer plusieurs suggestions de commentaires IA avec différents styles"""
        try:
            oeuvre = self.get_object()
            count = int(request.data.get('count', 3))  # Par défaut 3 suggestions
            
            if count > 5:  # Limite pour éviter les abus
                count = 5
            
            # Préparer les données
            oeuvre_data = {
                'titre': oeuvre.titre,
                'description': oeuvre.description or '',
                'technique': '',  # Pas de champ technique dans le modèle
                'dimension': '',  # Pas de champ dimension dans le modèle
                'auteur_nom': oeuvre.auteur.nom if hasattr(oeuvre.auteur, 'nom') else str(oeuvre.auteur),
                'date_creation': str(oeuvre.date_creation.year) if oeuvre.date_creation else ''
            }
            
            # Générer plusieurs suggestions
            suggestions = generate_multiple_ai_comments(oeuvre_data, count)
            
            if suggestions:
                return Response({
                    'success': True,
                    'suggestions': suggestions,
                    'count': len(suggestions),
                    'message': f'{len(suggestions)} suggestions générées'
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Aucune suggestion générée'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Erreur génération suggestions IA: {e}")
            return Response({
                'success': False,
                'error': f'Erreur interne: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def predict_popularity(self, request, pk=None):
        """Predict popularity for a gallery by aggregating its artworks' recent stats

        Mirrors the lightweight heuristic used for individual oeuvres but operates
        at the gallery level (summing Statistique rows for oeuvres in the gallery)
        and returns both a heuristic predicted_views and a 30-day forecast derived
        from recent Statistique records when available.
        """
        try:
            galerie = self.get_object()
        except Exception:
            return Response({'error': 'Galerie not found'}, status=404)

        from django.db.models import Avg, Sum
        from django.db.models.functions import Coalesce

        try:
            avg_views = Galerie.objects.aggregate(avg=Coalesce(Avg('vues'), 0))['avg'] or 0
        except Exception:
            avg_views = 0

        base = max(int(avg_views), 1)

        desc = (galerie.description or '')
        desc_len = len(desc)
        # Image presence: any oeuvre with an image
        try:
            image_present = galerie.oeuvres.filter(image__isnull=False).exclude(image='').exists()
        except Exception:
            image_present = False

        title_len = len((galerie.nom or ''))

        mult = 1.0
        if image_present:
            mult += 0.2
        mult += min(0.5, desc_len / 4000)
        mult += min(0.2, title_len / 200)

        predicted = int(base * mult)

        try:
            current_views = int(getattr(galerie, 'vues') or 0)
        except Exception:
            current_views = 0

        if current_views > 0:
            predicted_from_current = max(int(current_views * mult), current_views)
        else:
            predicted_from_current = 0

        predicted = max(predicted, predicted_from_current, 1)

        # Month-based estimation using Statistique rows for oeuvres in this gallery
        try:
            today_date = timezone.now().date()
            day_30_ago = today_date - datetime.timedelta(days=30)

            last_30_qs = Statistique.objects.filter(oeuvre__in=galerie.oeuvres.all(), date__gte=day_30_ago)
            last_30_views = int(last_30_qs.aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0)
            days_with_stats = last_30_qs.values('date').distinct().count() or 0
            avg_daily_last_30 = (last_30_views / days_with_stats) if days_with_stats else 0.0

            day_7_ago = today_date - datetime.timedelta(days=7)
            day_14_ago = today_date - datetime.timedelta(days=14)

            last7 = int(Statistique.objects.filter(oeuvre__in=galerie.oeuvres.all(), date__gte=day_7_ago).aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0)
            prev7 = int(Statistique.objects.filter(oeuvre__in=galerie.oeuvres.all(), date__gte=day_14_ago, date__lt=day_7_ago).aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0)

            avg7_last = last7 / 7.0
            avg7_prev = (prev7 / 7.0) if prev7 else None

            if avg7_prev and avg7_prev > 0:
                trend = avg7_last / max(avg7_prev, 1e-6)
            else:
                trend = 1.0

            growth_factor = max(0.7, min(trend, 1.5))

            predicted_next_30 = int(round(avg_daily_last_30 * 30 * growth_factor)) if days_with_stats else predicted
            predicted_next_30 = max(predicted_next_30, current_views, 1)

            # Build a conservative confidence estimate
            confidence = int(min(95, 35 + (desc_len / 1000.0) * 30 + (20 if image_present else 0) + min(20, days_with_stats)))
        except Exception:
            last_30_views = 0
            avg_daily_last_30 = 0.0
            trend = 1.0
            predicted_next_30 = predicted
            confidence = int(min(95, 35 + (desc_len / 1000.0) * 30 + (20 if image_present else 0)))

        tips = []
        if not image_present:
            tips.append('Ajoutez des images attractives pour les œuvres de la galerie — le visuel attire davantage de visiteurs.')
        if desc_len < 200:
            tips.append('Rédigez une description de galerie plus détaillée (inspiration, thème, artistes) pour aider la découverte.')
        tips.append('Partagez la galerie sur les réseaux et créez des collections thématiques pour améliorer la visibilité.')

        ai_advice = None
        try:
            prompt = (
                f"You are an art marketing assistant. Given the following gallery data, estimate a reasonable monthly view count and give 4 concise suggestions to improve visibility:\n"
                f"Gallery: {galerie.nom}\n"
                f"Description: {desc}\n"
                f"Number of works: {galerie.oeuvres.count()}\n"
                f"Typical platform average gallery views: {avg_views}\n"
            )
            ai_text = generate_ai_text(prompt, max_tokens=250, temperature=0.7)
            if ai_text:
                ai_advice = ai_text
                tips.insert(0, ai_text)
        except Exception:
            ai_advice = None

        result = {
            'predicted_views': predicted,
            'predicted_next_30': predicted_next_30,
            'last_30_views': last_30_views,
            'avg_daily_last_30': avg_daily_last_30,
            'trend': trend,
            'confidence': int(confidence),
            'tips': tips,
            'ai_advice': ai_advice
        }

        return Response(result)
    
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
    permission_classes = [IsAuthenticated]  # Changé pour exiger l'authentification
    
    def get_permissions(self):
        """Permissions selon l'action"""
        if self.action in ['list', 'retrieve', 'stats_by_oeuvre', 'statistics']:
            # Lecture libre pour les statistiques
            permission_classes = [AllowAny]
        elif self.action in ['create', 'toggle_like']:
            # Pour l'instant, permettre la création sans authentification pour débugger
            permission_classes = [AllowAny]
        else:
            # Authentification requise pour modifier/supprimer
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InteractionCreateSerializer
        return InteractionSerializer
    
    def get_queryset(self):
        queryset = Interaction.objects.select_related('utilisateur', 'oeuvre').order_by('-date')
        
        # Pour les admins, montrer toutes les interactions
        if (hasattr(self.request.user, 'role') and self.request.user.role == 'admin') or self.request.query_params.get('admin_view'):
            # Vue administrative - toutes les interactions
            pass
        else:
            # Vue publique - seulement les interactions visibles
            queryset = queryset.filter(
                Q(moderation_status__in=['approved', 'pending']) & 
                Q(moderation_score__lt=0.8)
            )
        
        # Filtres pour le backoffice
        type_filter = self.request.query_params.get('type')
        utilisateur_filter = self.request.query_params.get('utilisateur')
        oeuvre_filter = self.request.query_params.get('oeuvre')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        moderation_status = self.request.query_params.get('moderation_status')
        
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        if utilisateur_filter:
            queryset = queryset.filter(utilisateur_id=utilisateur_filter)
        if oeuvre_filter:
            queryset = queryset.filter(oeuvre_id=oeuvre_filter)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        if moderation_status:
            queryset = queryset.filter(moderation_status=moderation_status)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Statistiques des interactions pour le backoffice"""
        from django.db.models import Count
        
        total_interactions = Interaction.objects.count()
        by_type = Interaction.objects.values('type').annotate(count=Count('id'))
        recent_interactions = Interaction.objects.filter(
            date__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        top_oeuvres = Interaction.objects.values('oeuvre__titre').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        top_users = Interaction.objects.values(
            'utilisateur__prenom', 'utilisateur__nom'
        ).annotate(count=Count('id')).order_by('-count')[:5]
        
        return Response({
            'total_interactions': total_interactions,
            'recent_interactions_7_days': recent_interactions,
            'by_type': list(by_type),
            'top_oeuvres': list(top_oeuvres),
            'top_users': list(top_users)
        })
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Suppression en lot pour le backoffice"""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'Aucun ID fourni'}, status=400)
        
        deleted_count = Interaction.objects.filter(id__in=ids).delete()[0]
        return Response({
            'message': f'{deleted_count} interactions supprimées',
            'deleted_count': deleted_count
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def moderation_queue(self, request):
        """Récupérer la file d'attente de modération pour les admins"""
        # Vérifier que l'utilisateur est admin
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response({'error': 'Accès réservé aux administrateurs'}, status=status.HTTP_403_FORBIDDEN)
        
        # Filtrer par statut de modération
        status_filter = request.query_params.get('status', 'flagged')
        
        flagged_interactions = Interaction.objects.filter(
            moderation_status=status_filter
        ).select_related('utilisateur', 'oeuvre').order_by('-date')
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = flagged_interactions.count()
        interactions = flagged_interactions[start:end]
        
        # Sérialiser avec détails de modération
        serialized_data = []
        for interaction in interactions:
            data = InteractionSerializer(interaction).data
            data.update({
                'moderation_score': interaction.moderation_score,
                'moderation_status': interaction.moderation_status,
                'moderation_reasons': interaction.moderation_reasons,
                'moderation_details': interaction.moderation_details,
                'filtered_content': interaction.filtered_content,
                'original_content': interaction.contenu
            })
            serialized_data.append(data)
        
        return Response({
            'interactions': serialized_data,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': (total_count + page_size - 1) // page_size
            },
            'stats': {
                'flagged': Interaction.objects.filter(moderation_status='flagged').count(),
                'pending': Interaction.objects.filter(moderation_status='pending').count(),
                'rejected': Interaction.objects.filter(moderation_status='rejected').count(),
                'approved': Interaction.objects.filter(moderation_status='approved').count(),
            }
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve_content(self, request, pk=None):
        """Approuver un contenu flaggé"""
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response({'error': 'Accès réservé aux administrateurs'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            interaction = self.get_object()
            interaction.moderation_status = 'approved'
            interaction.reviewed_by = request.user
            interaction.reviewed_at = timezone.now()
            interaction.save()
            
            return Response({
                'message': 'Contenu approuvé avec succès',
                'interaction': InteractionSerializer(interaction).data
            })
        except Interaction.DoesNotExist:
            return Response({'error': 'Interaction non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject_content(self, request, pk=None):
        """Rejeter un contenu flaggé"""
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response({'error': 'Accès réservé aux administrateurs'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            interaction = self.get_object()
            admin_reason = request.data.get('reason', '')
            
            interaction.moderation_status = 'rejected'
            interaction.reviewed_by = request.user
            interaction.reviewed_at = timezone.now()
            
            if admin_reason:
                existing_reasons = interaction.moderation_reasons or ''
                interaction.moderation_reasons = f"{existing_reasons}; Admin: {admin_reason}".strip('; ')
            
            interaction.save()
            
            return Response({
                'message': 'Contenu rejeté avec succès',
                'interaction': InteractionSerializer(interaction).data
            })
        except Interaction.DoesNotExist:
            return Response({'error': 'Interaction non trouvée'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def bulk_moderation(self, request):
        """Actions en lot pour la modération"""
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response({'error': 'Accès réservé aux administrateurs'}, status=status.HTTP_403_FORBIDDEN)
        
        ids = request.data.get('ids', [])
        action = request.data.get('action')  # 'approve' ou 'reject'
        reason = request.data.get('reason', '')
        
        if not ids or not action:
            return Response({'error': 'IDs et action requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        if action not in ['approve', 'reject']:
            return Response({'error': 'Action doit être approve ou reject'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Mise à jour en lot
        interactions = Interaction.objects.filter(id__in=ids)
        update_data = {
            'moderation_status': 'approved' if action == 'approve' else 'rejected',
            'reviewed_by': request.user,
            'reviewed_at': timezone.now()
        }
        
        if action == 'reject' and reason:
            # Pour le rejet en lot, on ajoute la raison admin
            for interaction in interactions:
                existing_reasons = interaction.moderation_reasons or ''
                interaction.moderation_reasons = f"{existing_reasons}; Admin: {reason}".strip('; ')
                interaction.moderation_status = 'rejected'
                interaction.reviewed_by = request.user
                interaction.reviewed_at = timezone.now()
                interaction.save()
        else:
            interactions.update(**update_data)
        
        count = interactions.count()
        action_text = 'approuvées' if action == 'approve' else 'rejetées'
        
        return Response({
            'message': f'{count} interactions {action_text}',
            'count': count
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def moderation_stats(self, request):
        """Statistiques de modération pour le dashboard admin"""
        if not hasattr(request.user, 'role') or request.user.role != 'admin':
            return Response({'error': 'Accès réservé aux administrateurs'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.db.models import Avg, Count
        from datetime import timedelta
        
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        stats = {
            'total_interactions': Interaction.objects.count(),
            'by_status': {
                'pending': Interaction.objects.filter(moderation_status='pending').count(),
                'approved': Interaction.objects.filter(moderation_status='approved').count(),
                'flagged': Interaction.objects.filter(moderation_status='flagged').count(),
                'rejected': Interaction.objects.filter(moderation_status='rejected').count(),
            },
            'this_week': {
                'total': Interaction.objects.filter(date__gte=week_ago).count(),
                'flagged': Interaction.objects.filter(date__gte=week_ago, moderation_status='flagged').count(),
                'rejected': Interaction.objects.filter(date__gte=week_ago, moderation_status='rejected').count(),
            },
            'this_month': {
                'total': Interaction.objects.filter(date__gte=month_ago).count(),
                'flagged': Interaction.objects.filter(date__gte=month_ago, moderation_status='flagged').count(),
                'rejected': Interaction.objects.filter(date__gte=month_ago, moderation_status='rejected').count(),
            },
            'avg_moderation_score': Interaction.objects.aggregate(
                avg_score=Avg('moderation_score')
            )['avg_score'] or 0,
            'high_risk_interactions': Interaction.objects.filter(
                moderation_score__gte=0.7
            ).count(),
        }
        
        return Response(stats)
    
    def create(self, request, *args, **kwargs):
        """Créer une nouvelle interaction avec gestion des erreurs de modération"""
        try:
            return super().create(request, *args, **kwargs)
        except ValidationError as e:
            # Si c'est une erreur de modération avec notre format spécial
            if isinstance(e.detail, dict) and e.detail.get('type') == 'moderation_reject':
                return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Autres erreurs de validation
                raise e
    
    def destroy(self, request, *args, **kwargs):
        """Suppression avec confirmation"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'message': 'Interaction supprimée avec succès'
        }, status=status.HTTP_200_OK)
    
    def perform_create(self, serializer):
        """Automatiquement assigner l'utilisateur connecté lors de la création avec modération IA"""
        print(f"🔍 perform_create appelé avec request.user: {self.request.user}")
        print(f"🔍 request.user.is_authenticated: {getattr(self.request.user, 'is_authenticated', 'N/A')}")
        print(f"🔍 Données du serializer: {serializer.validated_data}")
        
        try:
            # Vérifier si l'utilisateur est authentifié
            if hasattr(self.request.user, 'is_authenticated') and self.request.user.is_authenticated:
                user = self.request.user
                print(f"✅ Utilisateur authentifié trouvé: {user}")
            else:
                # Pour débugger : utiliser un utilisateur par défaut (temporaire)
                from .models import Utilisateur
                user = Utilisateur.objects.first()  # TEMPORAIRE - à supprimer en production
                print(f"⚠️ Utilisateur par défaut utilisé: {user}")
            
            # Appliquer la modération IA pour les commentaires
            interaction_data = serializer.validated_data
            interaction_type = interaction_data.get('type')
            contenu = interaction_data.get('contenu', '')
            
            moderation_data = {}
            if interaction_type == 'commentaire' and contenu.strip():
                print(f"🤖 Analyse IA du commentaire: '{contenu[:50]}...'")
                
                # Modération avec IA
                moderation_result = moderate_text(contenu, context='comment')
                print(f"🤖 Résultat modération: {moderation_result}")
                
                # Rejeter automatiquement si score trop élevé
                if moderation_result['action'] == 'reject':
                    # Créer une réponse d'erreur conviviale pour l'utilisateur
                    bad_words_found = moderation_result.get('details', {}).get('bad_words', {}).get('bad_words_found', [])
                    
                    if bad_words_found:
                        user_message = "⚠️ Votre commentaire contient des mots inappropriés et ne peut pas être publié. Veuillez reformuler votre message de manière respectueuse."
                        suggestion = f"💡 Suggestion : Essayez de remplacer les mots problématiques par des alternatives plus appropriées."
                    else:
                        user_message = "⚠️ Votre commentaire ne respecte pas nos règles de communauté et ne peut pas être publié."
                        suggestion = "💡 Suggestion : Reformulez votre message de manière plus constructive et respectueuse."
                    
                    # Lever une exception spéciale que nous catcherons dans create()
                    from rest_framework.exceptions import ValidationError
                    error_response_data = {
                        'error': True,
                        'type': 'moderation_reject',
                        'title': '🚫 Commentaire non autorisé',
                        'message': user_message,
                        'suggestion': suggestion,
                        'filtered_preview': filter_bad_words(contenu) if bad_words_found else None,
                        'details': {
                            'score': moderation_result['confidence'],
                            'detected_issues': bad_words_found if bad_words_found else ['Contenu inapproprié']
                        }
                    }
                    raise ValidationError(error_response_data)
                
                # Préparer les données de modération pour interactions acceptées
                moderation_data = {
                    'moderation_status': self._get_moderation_status(moderation_result['action']),
                    'moderation_score': moderation_result['confidence'],
                    'moderation_details': moderation_result.get('details', {}),
                    'moderation_reasons': '; '.join(moderation_result.get('reasons', [])),
                    'filtered_content': filter_bad_words(contenu) if moderation_result['confidence'] > 0.15 else ''
                }
            
            # Sauvegarder avec les données de modération
            interaction = serializer.save(utilisateur=user, **moderation_data)
            
            # Log de la création
            if moderation_data:
                print(f"✅ Interaction créée avec modération: {interaction.moderation_status} (score: {interaction.moderation_score:.2f})")
            else:
                print("✅ Interaction créée avec succès (pas de modération nécessaire)")
                
        except Exception as e:
            print(f"❌ Erreur lors de la création: {str(e)}")
            import traceback
            traceback.print_exc()
            raise
    
    def _get_moderation_status(self, action):
        """Convertit l'action de modération en statut"""
        status_map = {
            'approve': 'approved',
            'flag': 'flagged',
            'reject': 'rejected'
        }
        return status_map.get(action, 'pending')
    
    @action(detail=False, methods=['post'])
    def toggle_like(self, request):
        """Endpoint pour toggler un like (ajouter/supprimer)"""
        oeuvre_id = request.data.get('oeuvre')
        if not oeuvre_id:
            return Response({'error': 'oeuvre_id requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            oeuvre = Oeuvre.objects.get(id=oeuvre_id)
        except Oeuvre.DoesNotExist:
            return Response({'error': 'Œuvre non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier l'authentification
        print(f"🔍 toggle_like: request.user = {request.user}")
        print(f"🔍 toggle_like: user.is_authenticated = {getattr(request.user, 'is_authenticated', 'N/A')}")
        
        if hasattr(request.user, 'is_authenticated') and request.user.is_authenticated:
            user = request.user
        else:
            # Pour débugger : utiliser un utilisateur par défaut (temporaire)
            from .models import Utilisateur
            user = Utilisateur.objects.first()
            print(f"⚠️ toggle_like: Utilisateur par défaut utilisé: {user}")
        
        # Vérifier si l'utilisateur a déjà liké
        interaction, created = Interaction.objects.get_or_create(
            utilisateur=user,
            oeuvre=oeuvre,
            type='like',
            defaults={'contenu': '', 'plateforme_partage': ''}
        )
        
        if not created:
            # Si existe déjà, supprimer (unlike)
            interaction.delete()
            return Response({
                'message': 'Like retiré',
                'liked': False,
                'total_likes': oeuvre.interactions.filter(type='like').count()
            })
        else:
            # Nouveau like
            return Response({
                'message': 'Like ajouté',
                'liked': True,
                'total_likes': oeuvre.interactions.filter(type='like').count()
            })
    
    @action(detail=False, methods=['get'])
    def stats_by_oeuvre(self, request):
        """Statistiques d'interactions par œuvre"""
        oeuvre_id = request.query_params.get('oeuvre')
        
        if oeuvre_id:
            # Stats pour une œuvre spécifique
            try:
                oeuvre = Oeuvre.objects.get(id=oeuvre_id)
                interactions = oeuvre.interactions.all()
                
                stats = {
                    'oeuvre_id': oeuvre.id,
                    'oeuvre_titre': oeuvre.titre,
                    'total_likes': interactions.filter(type='like').count(),
                    'total_commentaires': interactions.filter(type='commentaire').count(),
                    'total_partages': interactions.filter(type='partage').count(),
                    'total_interactions': interactions.count(),
                    'interactions_recentes': InteractionSerializer(
                        interactions.order_by('-date')[:5], many=True
                    ).data
                }
                return Response(stats)
            except Oeuvre.DoesNotExist:
                return Response({'error': 'Œuvre non trouvée'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Stats globales pour toutes les œuvres
            from django.db.models import Count
            stats = Oeuvre.objects.annotate(
                total_likes=Count('interactions', filter=Q(interactions__type='like')),
                total_commentaires=Count('interactions', filter=Q(interactions__type='commentaire')),
                total_partages=Count('interactions', filter=Q(interactions__type='partage')),
                total_interactions=Count('interactions')
            ).values(
                'id', 'titre', 'total_likes', 'total_commentaires', 
                'total_partages', 'total_interactions'
            )
            
            return Response(list(stats))
    
    @action(detail=True, methods=['delete'])
    def delete_my_interaction(self, request, pk=None):
        """Permettre à l'utilisateur de supprimer ses propres interactions"""
        try:
            interaction = self.get_object()
            if interaction.utilisateur != request.user:
                return Response(
                    {'error': 'Vous pouvez seulement supprimer vos propres interactions'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            interaction.delete()
            return Response({'message': 'Interaction supprimée'}, status=status.HTTP_200_OK)
        except Interaction.DoesNotExist:
            return Response({'error': 'Interaction non trouvée'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])  # À changer en IsAuthenticated plus tard
    def reply_to_comment(self, request):
        """Créer une réponse à un commentaire avec modération IA"""
        parent_id = request.data.get('parent')
        oeuvre_id = request.data.get('oeuvre')
        contenu = request.data.get('contenu')
        
        if not all([parent_id, oeuvre_id, contenu]):
            return Response({
                'error': 'parent, oeuvre et contenu sont requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            parent_comment = Interaction.objects.get(
                id=parent_id, 
                type='commentaire'
            )
            oeuvre = Oeuvre.objects.get(id=oeuvre_id)
            
            # Modération IA du contenu de la réponse
            contenu_clean = contenu.strip()
            print(f"🤖 Analyse IA de la réponse: '{contenu_clean[:50]}...'")
            
            moderation_result = moderate_text(contenu_clean, context='reply')
            print(f"🤖 Résultat modération réponse: {moderation_result}")
            
            # Rejeter si contenu trop problématique avec message convivial
            if moderation_result['action'] == 'reject':
                bad_words_found = moderation_result.get('details', {}).get('bad_words', {}).get('bad_words_found', [])
                
                if bad_words_found:
                    user_message = "⚠️ Votre réponse contient des mots inappropriés et ne peut pas être publiée. Veuillez reformuler votre message de manière respectueuse."
                    suggestion = f"💡 Suggestion : Essayez de remplacer les mots problématiques par des alternatives plus appropriées."
                else:
                    user_message = "⚠️ Votre réponse ne respecte pas nos règles de communauté et ne peut pas être publiée."
                    suggestion = "💡 Suggestion : Reformulez votre message de manière plus constructive et respectueuse."
                
                return Response({
                    'error': True,
                    'type': 'moderation_reject',
                    'title': '🚫 Réponse non autorisée',
                    'message': user_message,
                    'suggestion': suggestion,
                    'filtered_preview': filter_bad_words(contenu_clean) if bad_words_found else None,
                    'details': {
                        'score': moderation_result['confidence'],
                        'detected_issues': bad_words_found if bad_words_found else ['Contenu inapproprié']
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Créer la réponse avec modération
            reply = Interaction.objects.create(
                type='commentaire',
                utilisateur=request.user if hasattr(request.user, 'is_authenticated') and request.user.is_authenticated else Utilisateur.objects.first(),  # Temporaire pour débuggage
                oeuvre=oeuvre,
                contenu=contenu_clean,
                parent=parent_comment,
                moderation_status=self._get_moderation_status(moderation_result['action']),
                moderation_score=moderation_result['confidence'],
                moderation_details=moderation_result.get('details', {}),
                moderation_reasons='; '.join(moderation_result.get('reasons', [])),
                filtered_content=filter_bad_words(contenu_clean) if moderation_result['confidence'] > 0.3 else ''
            )
            
            print(f"✅ Réponse créée avec modération: {reply.moderation_status} (score: {reply.moderation_score:.2f})")
            
            return Response({
                'message': 'Réponse ajoutée avec succès',
                'reply': InteractionSerializer(reply).data,
                'moderation_info': {
                    'status': reply.moderation_status,
                    'score': reply.moderation_score
                }
            }, status=status.HTTP_201_CREATED)
            
        except Interaction.DoesNotExist:
            return Response({
                'error': 'Commentaire parent non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)
        except Oeuvre.DoesNotExist:
            return Response({
                'error': 'Œuvre non trouvée'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Erreur lors de la création de la réponse: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Erreur lors de la création de la réponse: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def comments_with_replies(self, request):
        """Récupérer les commentaires avec leurs réponses de manière hiérarchique"""
        oeuvre_id = request.query_params.get('oeuvre')
        
        if not oeuvre_id:
            return Response({
                'error': 'oeuvre_id requis'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            oeuvre = Oeuvre.objects.get(id=oeuvre_id)
            
            # Récupérer tous les commentaires principaux (sans parent) et visibles
            queryset_filter = Q(
                oeuvre=oeuvre,
                type='commentaire',
                parent__isnull=True
            )
            
            # Ajouter le filtre de modération (sauf si admin)
            if not (hasattr(self.request.user, 'role') and self.request.user.role == 'admin'):
                queryset_filter &= Q(
                    moderation_status__in=['approved', 'pending']
                ) & Q(
                    moderation_score__lt=0.8
                )
            
            main_comments = Interaction.objects.filter(
                queryset_filter
            ).select_related('utilisateur').prefetch_related(
                'reponses__utilisateur'
            ).order_by('-date')
            
            # Sérialiser avec les réponses
            comments_data = []
            for comment in main_comments:
                comment_data = InteractionSerializer(comment).data
                
                # Ajouter les réponses (filtrées aussi)
                replies_filter = Q(parent=comment)
                if not (hasattr(self.request.user, 'role') and self.request.user.role == 'admin'):
                    replies_filter &= Q(
                        moderation_status__in=['approved', 'pending']
                    ) & Q(
                        moderation_score__lt=0.8
                    )
                
                replies = Interaction.objects.filter(replies_filter).order_by('date')
                comment_data['replies'] = InteractionSerializer(replies, many=True).data
                comment_data['replies_count'] = replies.count()
                
                comments_data.append(comment_data)
            
            return Response({
                'comments': comments_data,
                'total_comments': main_comments.count()
            })
            
        except Oeuvre.DoesNotExist:
            return Response({
                'error': 'Œuvre non trouvée'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def interaction_details(self, request):
        """Récupérer les détails des interactions pour les tooltips (incluant les réponses)"""
        oeuvre_id = request.query_params.get('oeuvre')
        
        if not oeuvre_id:
            return Response({'error': 'oeuvre_id requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            oeuvre = Oeuvre.objects.get(id=oeuvre_id)
            
            # Likes
            likes = Interaction.objects.filter(
                oeuvre=oeuvre, type='like'
            ).select_related('utilisateur').order_by('-date')[:10]
            
            # Commentaires (seulement les commentaires principaux pour les tooltips)
            commentaires = Interaction.objects.filter(
                oeuvre=oeuvre, type='commentaire', parent__isnull=True
            ).select_related('utilisateur').order_by('-date')[:5]
            
            # Partages
            partages = Interaction.objects.filter(
                oeuvre=oeuvre, type='partage'
            ).select_related('utilisateur').order_by('-date')[:10]
            
            return Response({
                'likes': [{
                    'id': like.id,
                    'utilisateur_nom': f"{like.utilisateur.prenom} {like.utilisateur.nom}",
                    'date': like.date
                } for like in likes],
                'commentaires': [{
                    'id': comment.id,
                    'utilisateur_nom': f"{comment.utilisateur.prenom} {comment.utilisateur.nom}",
                    'contenu': comment.contenu,
                    'date': comment.date,
                    'replies_count': comment.reponses.count()
                } for comment in commentaires],
                'partages': [{
                    'id': partage.id,
                    'utilisateur_nom': f"{partage.utilisateur.prenom} {partage.utilisateur.nom}",
                    'plateforme_partage': partage.plateforme_partage,
                    'date': partage.date
                } for partage in partages]
            })
            
        except Oeuvre.DoesNotExist:
            return Response({'error': 'Œuvre non trouvée'}, status=status.HTTP_404_NOT_FOUND)

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

        # If this SavedStat was created from an AI-generated chart and contains
        # precomputed data in config['ai_raw'], return that directly.
        try:
            if stat.config and isinstance(stat.config, dict) and stat.config.get('ai_raw'):
                raw = stat.config.get('ai_raw') or {}
                labels = raw.get('labels') or []
                values = raw.get('values') or []
                return Response({'labels': labels, 'values': values})
        except Exception:
            # If anything goes wrong with ai_raw handling, fall back to normal compute
            pass

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
        elif self.action == 'list':
            # Permettre aux utilisateurs de voir leurs propres demandes
            return [IsAuthenticated()]
        return [IsAdmin()]  

    def get_queryset(self):
        if self.request.user.role == 'admin':
            # Les admins voient toutes les demandes en attente
            return DemandeRole.objects.filter(statut='pending')
        else:
            # Les utilisateurs voient seulement leurs propres demandes
            return DemandeRole.objects.filter(utilisateur=self.request.user)

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

class SuiviViewSet(viewsets.ModelViewSet):
    queryset = Suivi.objects.all()
    serializer_class = SuiviSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer selon l'utilisateur connecté"""
        user = self.request.user
        if user.role == 'artiste':
            # Si artiste, voir ses abonnés
            return Suivi.objects.filter(artiste=user)
        else:
            # Si user, voir ses suivis
            return Suivi.objects.filter(utilisateur=user)
    
    def create(self, request):
        """Suivre un artiste"""
        artiste_id = request.data.get('artiste_id')
        
        if not artiste_id:
            return Response({'error': 'ID de l\'artiste requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            artiste = Utilisateur.objects.get(id=artiste_id)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Artiste non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        # Vérifier qu'on ne se suit pas soi-même
        if request.user == artiste:
            return Response({'error': 'Vous ne pouvez pas vous suivre vous-même'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier que c'est un artiste
        if artiste.role != 'artiste':
            return Response({'error': 'Vous ne pouvez suivre que des artistes'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérifier si déjà suivi
        if Suivi.objects.filter(utilisateur=request.user, artiste=artiste).exists():
            return Response({'error': 'Vous suivez déjà cet artiste'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer le suivi
        suivi = Suivi.objects.create(utilisateur=request.user, artiste=artiste)
        serializer = self.get_serializer(suivi)
        
        return Response({
            'message': f'Vous suivez maintenant {artiste.prenom} {artiste.nom}',
            'suivi': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def unfollow(self, request, pk=None):
        """Ne plus suivre un artiste"""
        try:
            suivi = Suivi.objects.get(utilisateur=request.user, artiste_id=pk)
            artiste_nom = f"{suivi.artiste.prenom} {suivi.artiste.nom}"
            suivi.delete()
            return Response({
                'message': f'Vous ne suivez plus {artiste_nom}'
            }, status=status.HTTP_200_OK)
        except Suivi.DoesNotExist:
            return Response({'error': 'Vous ne suivez pas cet artiste'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def mes_suivis(self, request):
        """Liste des artistes que je suis"""
        suivis = Suivi.objects.filter(utilisateur=request.user)
        serializer = self.get_serializer(suivis, many=True)
        return Response({
            'count': suivis.count(),
            'suivis': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def mes_abonnes(self, request):
        """Liste de mes abonnés (pour les artistes)"""
        if request.user.role != 'artiste':
            return Response({'error': 'Seuls les artistes peuvent voir leurs abonnés'}, status=status.HTTP_403_FORBIDDEN)
        
        abonnes = Suivi.objects.filter(artiste=request.user)
        serializer = self.get_serializer(abonnes, many=True)
        return Response({
            'count': abonnes.count(),
            'abonnes': serializer.data
        })


class ConsultationOeuvreViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour tracker les consultations d'œuvres
    """
    queryset = ConsultationOeuvre.objects.all()
    serializer_class = ConsultationOeuvreSerializer
    permission_classes = [AllowAny]  # Permet aussi aux non-connectés
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/consultations/
        Body: { "oeuvre_id": 123 }
        """
        oeuvre_id = request.data.get('oeuvre_id')
        
        if not oeuvre_id:
            return Response(
                {'error': 'oeuvre_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer la consultation
        consultation = ConsultationOeuvre.objects.create(
            utilisateur=request.user if request.user.is_authenticated else None,
            oeuvre_id=oeuvre_id
        )
        
        return Response(
            {'message': 'Consultation enregistrée', 'id': consultation.id},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mes_consultations(self, request):
        """
        GET /api/consultations/mes_consultations/
        Retourne l'historique des consultations de l'utilisateur
        """
        consultations = ConsultationOeuvre.objects.filter(
            utilisateur=request.user
        ).order_by('-date_consultation')[:50]
        
        serializer = self.get_serializer(consultations, many=True)
        return Response({
            'count': consultations.count(),
            'consultations': serializer.data
        })


class PartageOeuvreViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour tracker les partages d'œuvres
    """
    queryset = PartageOeuvre.objects.all()
    serializer_class = PartageOeuvreSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/partages/
        Body: { "oeuvre_id": 123, "plateforme": "facebook" }
        """
        oeuvre_id = request.data.get('oeuvre_id')
        plateforme = request.data.get('plateforme')
        
        if not oeuvre_id or not plateforme:
            return Response(
                {'error': 'oeuvre_id et plateforme requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que la plateforme est valide
        plateformes_valides = ['facebook', 'twitter', 'linkedin', 'whatsapp']
        if plateforme not in plateformes_valides:
            return Response(
                {'error': f'Plateforme invalide. Choix: {plateformes_valides}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer le partage
        partage = PartageOeuvre.objects.create(
            utilisateur=request.user,
            oeuvre_id=oeuvre_id,
            plateforme=plateforme
        )
        
        return Response(
            {'message': 'Partage enregistré', 'id': partage.id},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mes_partages(self, request):
        """
        GET /api/partages/mes_partages/
        Retourne l'historique des partages de l'utilisateur
        """
        partages = PartageOeuvre.objects.filter(
            utilisateur=request.user
        ).order_by('-date_partage')
        
        serializer = self.get_serializer(partages, many=True)
        return Response({
            'count': partages.count(),
            'partages': serializer.data
        })


class ContactArtisteViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour contacter les artistes
    """
    queryset = ContactArtiste.objects.all()
    serializer_class = ContactArtisteSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        POST /api/contacts/
        Body: { 
            "artiste_id": 5, 
            "sujet": "Question sur vos œuvres",
            "message": "Bonjour, ..." 
        }
        """
        artiste_id = request.data.get('artiste_id')
        sujet = request.data.get('sujet', 'Demande de contact')
        message_text = request.data.get('message')
        
        if not artiste_id or not message_text:
            return Response(
                {'error': 'artiste_id et message requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que l'artiste existe
        try:
            artiste = Utilisateur.objects.get(id=artiste_id, role='artiste')
        except Utilisateur.DoesNotExist:
            return Response(
                {'error': 'Artiste non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Empêcher de se contacter soi-même
        if request.user.id == artiste_id:
            return Response(
                {'error': 'Vous ne pouvez pas vous contacter vous-même'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer le contact
        contact = ContactArtiste.objects.create(
            utilisateur=request.user,
            artiste=artiste,
            sujet=sujet,
            message=message_text
        )
        
        # Envoyer l'email à l'artiste
        try:
            email_subject = f"[Pixelette] {sujet} - Message de {request.user.prenom} {request.user.nom}"
            email_message = f"""
Bonjour {artiste.prenom},

Vous avez reçu un nouveau message via Pixelette :

De : {request.user.prenom} {request.user.nom} ({request.user.email})
Sujet : {sujet}

Message :
{message_text}

---
Pour répondre, vous pouvez contacter {request.user.email} directement.

Cordialement,
L'équipe Pixelette
            """
            
            send_mail(
                email_subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [artiste.email],
                fail_silently=False
            )
            
            return Response({
                'message': 'Message envoyé avec succès !',
                'contact_id': contact.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Si l'email échoue, on garde quand même le contact dans la DB
            return Response({
                'message': 'Message enregistré mais email non envoyé',
                'contact_id': contact.id,
                'error': str(e)
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mes_contacts(self, request):
        """
        GET /api/contacts/mes_contacts/
        Retourne les messages envoyés par l'utilisateur
        """
        contacts = ContactArtiste.objects.filter(
            utilisateur=request.user
        ).order_by('-date_contact')
        
        serializer = self.get_serializer(contacts, many=True)
        return Response({
            'count': contacts.count(),
            'contacts': serializer.data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def contacts_recus(self, request):
        """
        GET /api/contacts/contacts_recus/
        Retourne les messages reçus (pour les artistes)
        """
        if request.user.role != 'artiste':
            return Response(
                {'error': 'Réservé aux artistes'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        contacts = ContactArtiste.objects.filter(
            artiste=request.user
        ).order_by('-date_contact')
        
        serializer = self.get_serializer(contacts, many=True)
        return Response({
            'count': contacts.count(),
            'non_lus': contacts.filter(lu=False).count(),
            'contacts': serializer.data
        })
    
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
    """Generate an enhanced PDF summary of dashboard data with modern design and comprehensive content."""
    import io, os, datetime
    from django.conf import settings
    from django.urls import reverse
    from django.utils import timezone  # pour timezone.now()

    # 1️⃣ Définir period_names au tout début
    period_names = {
        'week': '7 derniers jours',
        'month': '30 derniers jours',
        'quarter': '3 derniers mois',
        'year': '12 derniers mois',
        'all': 'Toute la période'
    }

    # 2️⃣ Récupérer la configuration depuis la requête
    config = request.data.get('config', {})
    include_charts = config.get('include_charts', True)
    include_details = config.get('include_details', True)
    date_range = config.get('date_range', 'month')
    report_format = config.get('format', 'pdf')

    # Calculate date ranges based on selection
    # Use Django timezone-aware now to avoid naive datetime warnings when USE_TZ=True
    now = timezone.now()
    date_ranges = {
        'week': datetime.timedelta(days=7),
        'month': datetime.timedelta(days=30),
        'quarter': datetime.timedelta(days=90),
        'year': datetime.timedelta(days=365),
        'all': None
    }
    
    delta = date_ranges.get(date_range, datetime.timedelta(days=30))
    since_date = now - delta if delta else None

    # Gather comprehensive data with date filtering
    galeries_qs = Galerie.objects.all()
    oeuvres_qs = Oeuvre.objects.all()
    utilisateurs_qs = Utilisateur.objects.all()

    if since_date:
        galeries_qs = galeries_qs.filter(date_creation__gte=since_date)
        oeuvres_qs = oeuvres_qs.filter(date_creation__gte=since_date)
        utilisateurs_qs = utilisateurs_qs.filter(date_inscription__gte=since_date)

    galeries = list(galeries_qs)
    oeuvres = list(oeuvres_qs)
    utilisateurs = list(utilisateurs_qs)

    # Enhanced statistics
    galeries_pub = sum(1 for g in galeries if not g.privee)
    galeries_pri = sum(1 for g in galeries if g.privee)
    total_oeuvres = len(oeuvres)
    total_utilisateurs = len(utilisateurs)
    
    # Calculate views statistics
    total_galeries_views = sum(g.vues or 0 for g in galeries)
    total_oeuvres_views = sum(o.vues or 0 for o in oeuvres)
    total_views = total_galeries_views + total_oeuvres_views

    # Top content with enhanced data
    top_galeries = Galerie.objects.order_by('-vues')[:10]
    top_oeuvres = Oeuvre.objects.order_by('-vues')[:10]

    # Enhanced artist statistics
    from django.db.models import Sum, F, Count
    from django.db.models.functions import Coalesce
    
    artists_qs = Utilisateur.objects.annotate(
        total_oeuvre_views=Coalesce(Sum('oeuvres__vues'), 0),
        total_galerie_views=Coalesce(Sum('galeries__vues'), 0),
        oeuvres_count=Count('oeuvres'),
        galeries_count=Count('galeries')
    ).annotate(
        total_views=F('total_oeuvre_views') + F('total_galerie_views'),
        total_content=F('oeuvres_count') + F('galeries_count')
    ).filter(total_views__gt=0).order_by('-total_views')[:15]

    # Engagement metrics
    avg_views_per_galerie = total_galeries_views / len(galeries) if galeries else 0
    avg_views_per_oeuvre = total_oeuvres_views / len(oeuvres) if oeuvres else 0
    oeuvres_per_galerie = total_oeuvres / len(galeries) if galeries else 0

    # Ensure reports directory exists
    reports_dir = os.path.join(settings.MEDIA_ROOT, 'reports')
    os.makedirs(reports_dir, exist_ok=True)

    # Enhanced filename with configuration
    # Use an ISO-like UTC timestamp for filenames using timezone-aware datetime
    try:
        filename_ts = now.astimezone(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    except Exception:
        # Fallback if astimezone is not available for some reason
        filename_ts = now.strftime('%Y%m%dT%H%M%SZ')
    range_suffix = f"-{date_range}" if date_range != 'all' else ''
    pdf_filename = f"rapport-pixelette-{filename_ts}{range_suffix}.pdf"
    pdf_path = os.path.join(reports_dir, pdf_filename)

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib import colors
        from reportlab.lib.units import mm
        from reportlab.lib.utils import ImageReader
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        
        # Try to register better fonts if available
        try:
            # You might need to add these font files to your project
            pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))
            pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', 'DejaVuSans-Bold.ttf'))
        except:
            pass  # Use default fonts

        # Force non-interactive backend for matplotlib
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            import numpy as np
        except Exception:
            plt = None

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=20, bottomMargin=20)
        styles = getSampleStyleSheet()
        story = []

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=30,
            alignment=TA_CENTER
        )

        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#374151'),
            spaceAfter=12,
            spaceBefore=20
        )

        subheading_style = ParagraphStyle(
            'CustomSubheading',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#6b7280'),
            spaceAfter=8
        )

        # Cover Page
        cover_elements = []
        
        # Title
        cover_elements.append(Paragraph("RAPPORT D'ACTIVITÉ", title_style))
        cover_elements.append(Spacer(1, 20))
        
        # Platform name with styling
        platform_style = ParagraphStyle(
            'Platform',
            parent=styles['Normal'],
            fontSize=18,
            textColor=colors.HexColor('#7c3aed'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        cover_elements.append(Paragraph("Pixelette 🎨", platform_style))
        
     
        period_text = period_names.get(date_range, '30 derniers jours')
        
        date_style = ParagraphStyle(
            'DateInfo',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#6b7280'),
            alignment=TA_CENTER,
            spaceAfter=40
        )
        cover_elements.append(Paragraph(f"Période: {period_text}", date_style))
        cover_elements.append(Paragraph(f"Généré le: {now.strftime('%d/%m/%Y à %H:%M')}", date_style))
        
        # Key metrics table for cover
        metrics_data = [
            ['📊 MÉTRIQUES PRINCIPALES', ''],
            [f"{total_oeuvres}", 'Œuvres totales'],
            [f"{len(galeries)}", 'Galeries actives'],
            [f"{total_utilisateurs}", 'Utilisateurs'],
            [f"{total_views:,}", 'Vues totales']
        ]
        
        metrics_table = Table(metrics_data, colWidths=[100, 200])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 14),
            ('FONTSIZE', (1, 1), (1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        
        cover_elements.append(Spacer(1, 50))
        cover_elements.append(metrics_table)
        cover_elements.append(Spacer(1, 30))

        # Executive Summary Section
        executive_style = ParagraphStyle(
            'Executive',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#374151'),
            alignment=TA_LEFT,
            spaceAfter=12,
            leading=14
        )

        summary_text = f"""
        Ce rapport présente une analyse complète de l'activité sur la plateforme Pixelette 
        sur la période des {period_text}. La plateforme démontre une croissance constante avec 
        {total_oeuvres} œuvres partagées à travers {len(galeries)} galeries, générant un total 
        de {total_views:,} vues. L'engagement des utilisateurs reste élevé avec une moyenne de 
        {avg_views_per_oeuvre:.1f} vues par œuvre.
        """
        
        cover_elements.append(Paragraph("SYNTHÈSE EXÉCUTIVE", heading_style))
        cover_elements.append(Paragraph(summary_text, executive_style))

        # Add cover to story
        story.extend(cover_elements)
        story.append(Spacer(1, 20))

        # DETAILED ANALYSIS PAGE
        story.append(Paragraph("ANALYSE DÉTAILLÉE", title_style))

        # Key Performance Indicators
        story.append(Paragraph("INDICATEURS CLÉS DE PERFORMANCE", heading_style))
        
        kpi_data = [
            ['MÉTRIQUE', 'VALEUR', 'CONTEXTE'],
            ['Œuvres totales', f"{total_oeuvres}", f"{oeuvres_per_galerie:.1f} par galerie"],
            ['Galeries actives', f"{len(galeries)}", f"{galeries_pub} publiques, {galeries_pri} privées"],
            ['Vues totales', f"{total_views:,}", f"Galeries: {total_galeries_views:,}, Œuvres: {total_oeuvres_views:,}"],
            ['Utilisateurs actifs', f"{total_utilisateurs}", f"Période: {period_text}"],
            ['Vues moyennes/œuvre', f"{avg_views_per_oeuvre:.1f}", "Engagement moyen par contenu"],
            ['Vues moyennes/galerie', f"{avg_views_per_galerie:.1f}", "Performance des espaces"]
        ]
        
        kpi_table = Table(kpi_data, colWidths=[150, 80, 200])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        
        story.append(kpi_table)
        story.append(Spacer(1, 20))

        # Top Performers Section
        story.append(Paragraph("CONTENU PERFORMANT", heading_style))

        # Top Galleries Table
        story.append(Paragraph("Top 10 Galeries par Vues", subheading_style))
        
        gallery_data = [['POS', 'GALERIE', 'VUES', 'TYPE', 'ŒUVRES']]
        for i, gallery in enumerate(top_galeries[:10], 1):
            gallery_type = "Publique" if not gallery.privee else "Privée"
            oeuvres_count = gallery.oeuvres.count() if hasattr(gallery, 'oeuvres') else 'N/A'
            gallery_data.append([
                str(i),
                gallery.nom[:30] + '...' if len(gallery.nom) > 30 else gallery.nom,
                f"{gallery.vues:,}",
                gallery_type,
                str(oeuvres_count)
            ])
        
        gallery_table = Table(gallery_data, colWidths=[30, 150, 60, 50, 40])
        gallery_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0fdf4')]),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        
        story.append(gallery_table)
        story.append(Spacer(1, 15))

        # Top Artworks Table
        story.append(Paragraph("Top 10 Œuvres par Vues", subheading_style))
        
        artwork_data = [['POS', 'ŒUVRE', 'ARTISTE', 'VUES', 'GALERIE']]
        for i, artwork in enumerate(top_oeuvres[:10], 1):
            artist_name = f"{artwork.auteur.prenom} {artwork.auteur.nom}" if artwork.auteur else "Inconnu"
            # Galerie relationship may be ManyToMany (related_name='galeries_associees') or older 'galerie' FK
            gallery_name = 'Aucune'
            try:
                # If there's a direct attribute 'galerie' (older schema), use it
                if hasattr(artwork, 'galerie') and getattr(artwork, 'galerie'):
                    g = getattr(artwork, 'galerie')
                    gallery_name = g.nom if getattr(g, 'nom', None) else 'Aucune'
                else:
                    # Otherwise, check the related_name on Galerie (ManyToMany)
                    if hasattr(artwork, 'galeries_associees'):
                        rel_qs = artwork.galeries_associees.all()
                        if rel_qs.exists():
                            g = rel_qs.first()
                            gallery_name = g.nom if getattr(g, 'nom', None) else 'Aucune'
            except Exception:
                gallery_name = 'Aucune'

            artwork_data.append([
                str(i),
                artwork.titre[:25] + '...' if len(artwork.titre) > 25 else artwork.titre,
                artist_name[:20] + '...' if len(artist_name) > 20 else artist_name,
                f"{artwork.vues:,}",
                gallery_name[:15] + '...' if len(gallery_name) > 15 else gallery_name
            ])
        
        artwork_table = Table(artwork_data, colWidths=[30, 100, 80, 50, 70])
        artwork_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f59e0b')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fffbeb')]),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        
        story.append(artwork_table)
        story.append(Spacer(1, 20))

        # Artist Performance Section
        story.append(Paragraph("PERFORMANCE DES ARTISTES", heading_style))
        
        artist_data = [['ARTISTE', 'VUES TOTALES', 'ŒUVRES', 'GALERIES', 'SCORE']]
        for artist in artists_qs[:10]:
            score = (artist.total_views / max(1, artist.total_content)) if artist.total_content > 0 else 0
            artist_data.append([
                f"{artist.prenom} {artist.nom}"[:25] + '...' if len(f"{artist.prenom} {artist.nom}") > 25 else f"{artist.prenom} {artist.nom}",
                f"{artist.total_views:,}",
                str(artist.oeuvres_count),
                str(artist.galeries_count),
                f"{score:.1f}"
            ])
        
        artist_table = Table(artist_data, colWidths=[120, 60, 40, 40, 40])
        artist_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b5cf6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#faf5ff')]),
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ]))
        
        story.append(artist_table)
        story.append(Spacer(1, 20))

        # Recommendations Section
        story.append(Paragraph("RECOMMANDATIONS STRATÉGIQUES", heading_style))
        
        recommendations = [
            "📈 **Focus sur le contenu performant** : Capitaliser sur les galeries et œuvres les plus populaires",
            "🎯 **Développement des artistes émergents** : Mettre en avant les talents avec un fort potentiel",
            "🔄 **Optimisation du référencement** : Améliorer la découvrabilité du contenu peu consulté",
            "🤝 **Partenariats stratégiques** : Collaborer avec les artistes les plus influents",
            "📊 **Analyse continue** : Surveiller les tendances d'engagement mensuellement"
        ]
        
        for rec in recommendations:
            story.append(Paragraph(rec, styles['Normal']))
            story.append(Spacer(1, 8))

        # Build PDF
        doc.build(story)

        # Validate buffer contains a PDF
        buffer.seek(0)
        content = buffer.getvalue()
        if not content or not content.startswith(b'%PDF'):
            # Something went wrong during PDF generation; raise to trigger fallback
            raise Exception('PDF generation did not produce a valid PDF content')

        # Write to file (atomic write)
        tmp_path = pdf_path + '.tmp'
        with open(tmp_path, 'wb') as f:
            f.write(content)
        os.replace(tmp_path, pdf_path)

        # Handle download request
        try_download = request.data.get('download', False)
        if try_download:
            return FileResponse(open(pdf_path, 'rb'), as_attachment=True, filename=pdf_filename, content_type='application/pdf')

        # Return URL
        report_url = request.build_absolute_uri(settings.MEDIA_URL + 'reports/' + pdf_filename)
        return JsonResponse({
            'report_url': report_url,
            'filename': pdf_filename,
            'generated_at': now.isoformat(),
            'period': period_text,
            'metrics': {
                'oeuvres': total_oeuvres,
                'galeries': len(galeries),
                'utilisateurs': total_utilisateurs,
                'vues': total_views
            }
        })

    except Exception as e:
        # Fallback to simple text report
        import traceback
        print(f"PDF generation error: {str(e)}")
        print(traceback.format_exc())

        # Create enhanced text summary
        summary_lines = [
            "RAPPORT D'ACTIVITÉ PIXELETTE",
            "=" * 50,
            f"Période: {period_names.get(date_range, '30 derniers jours')}",
            f"Généré le: {now.strftime('%d/%m/%Y à %H:%M')}",
            "",
            "MÉTRIQUES PRINCIPALES:",
            f"- Œuvres totales: {total_oeuvres}",
            f"- Galeries actives: {len(galeries)} ({galeries_pub} publiques, {galeries_pri} privées)",
            f"- Utilisateurs: {total_utilisateurs}",
            f"- Vues totales: {total_views:,}",
            f"- Vues moyennes par œuvre: {avg_views_per_oeuvre:.1f}",
            "",
            "TOP GALERIES:",
        ]
        
        for i, gallery in enumerate(top_galeries[:10], 1):
            summary_lines.append(f"{i}. {gallery.nom} - {gallery.vues:,} vues")
        
        summary_lines.extend([
            "",
            "TOP ŒUVRES:",
        ])
        
        for i, artwork in enumerate(top_oeuvres[:10], 1):
            summary_lines.append(f"{i}. {artwork.titre} - {artwork.vues:,} vues")
        
        summary_lines.extend([
            "",
            "RECOMMANDATIONS:",
            "- Capitaliser sur le contenu performant",
            "- Développer les artistes émergents",
            "- Optimiser la découvrabilité"
        ])

        # Save text file
        txt_filename = f"rapport-pixelette-{filename_ts}{range_suffix}.txt"
        txt_path = os.path.join(reports_dir, txt_filename)
        
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(summary_lines))

        try_download = request.data.get('download', False)
        if try_download:
            return FileResponse(open(txt_path, 'rb'), as_attachment=True, filename=txt_filename, content_type='text/plain')

        report_url = request.build_absolute_uri(settings.MEDIA_URL + 'reports/' + txt_filename)
        return JsonResponse({
            'report_url': report_url,
            'warning': 'PDF generation failed, text report provided',
            'error': str(e)
        })


@api_view(['POST'])
@permission_classes([IsAdminOrSession])
def ai_generate_chart(request):
    """Interpret a French prompt and return a computed chart dataset.

    Expected request JSON: { prompt: "..." }
    Response JSON (success): {
      success: true,
      chart_type: 'pie'|'bar'|'line'|'radialbar',
      title: 'Titre',
      labels: [...],
      values: [...],
      explanation: '...' (optional)
    }
    If data cannot be produced: { success: false, message: '...' }
    """
    try:
        payload = request.data or {}
        prompt = (payload.get('prompt') or '').strip()
        if not prompt:
            return Response({'success': False, 'message': 'Veuillez fournir une description (en français).'}, status=400)

        # Simple heuristic parsing (French keywords)
        p = prompt.lower()
        chart_type = 'pie'
        if any(k in p for k in ['bar', 'barres', 'histogramme', 'barras']):
            chart_type = 'bar'
        elif any(k in p for k in ['ligne', 'courbe', 'line']):
            chart_type = 'line'
        elif any(k in p for k in ['radial', 'radialbar']):
            chart_type = 'radialbar'
        elif any(k in p for k in ['donut', 'anneau', 'donut']):
            chart_type = 'donut'
        else:
            # default heuristic: pie for distributions
            chart_type = 'pie'

        # What to measure: look for 'vues', 'visites', 'likes' etc.
        subject = None
        if 'vues' in p or 'visites' in p:
            subject = 'vues'
        elif 'likes' in p or 'j\'aime' in p:
            subject = 'likes'
        else:
            # default to vues
            subject = 'vues'

        # Grouping target
        target = None
        if 'utilisateur' in p or 'utilisateurs' in p or 'auteur' in p or 'artiste' in p:
            target = 'utilisateur'
        elif 'oeuvre' in p or 'œuvre' in p or 'oeuvres' in p:
            target = 'oeuvre'
        elif 'galerie' in p or 'galeries' in p:
            target = 'galerie'
        elif 'global' in p or 'total' in p or 'overall' in p:
            target = 'global'
        else:
            # If user asked for 'par' pattern like 'vues par utilisateur'
            if 'par utilisateur' in p or 'par auteur' in p:
                target = 'utilisateur'
            elif 'par galerie' in p:
                target = 'galerie'
            elif 'par oeuvre' in p or 'par œuvre' in p:
                target = 'oeuvre'

        # Limit items (top N)
        # Default from payload or 10
        try:
            limit = int(payload.get('limit') or 10)
        except Exception:
            limit = 10

        # Try to parse a 'top N' from the French prompt itself, e.g. "top 2", "les 5 premiers", "2 meilleures"
        try:
            import re
            m = re.search(r"\btop\s*(\d{1,3})\b", p)
            if not m:
                m = re.search(r"\b(?:les\s+)?(\d{1,3})\s*(?:premier|première|premiers|premières|meilleur|meilleurs|meilleure|meilleures)\b", p)
            if m:
                parsed_n = int(m.group(1))
                # sanity bounds
                if 1 <= parsed_n <= 100:
                    limit = parsed_n
        except Exception:
            # ignore parsing failures and keep the earlier limit
            pass

        # Compute the data using ORM
        from django.db.models import Sum
        from django.db.models.functions import Coalesce

    # Advanced parsing: detect 'compare' requests and 'group by field' like 'par thème'
        group_field = None
        # If both galerie and oeuvre are mentioned and user asks to compare, treat as global comparison
        if ('galerie' in p or 'galeries' in p) and ('oeuvre' in p or 'œuvre' in p or 'oeuvres' in p) and any(k in p for k in ['compar', 'vs', 'vs.', 'vs/', ' vs ', 'contre', ' vs', 'vs ' , ' vs.']):
            target = 'global'

        # Detect 'par thème' or similar grouping requests for oeuvres
        if 'par thème' in p or 'par theme' in p or 'par catégorie' in p or 'par categorie' in p or 'par tag' in p:
            target = 'group_oeuvre_field'
            group_field = 'theme'

        # Detect generic 'répartition des' requests, attempt to set grouping by the following token
        if 'répartition des' in p or 'répartition de' in p:
            # leave prior group_field if set; otherwise try simple heuristic
            if not group_field and 'par' in p:
                # e.g. 'répartition des œuvres par thème' -> set group_field
                try:
                    import re
                    m = re.search(r"répartition(?: des| de)? [\w\s']+ par (\w+)", p)
                    if m:
                        gf = m.group(1)
                        # normalize french 'thème' without accent
                        if gf.startswith('theme') or gf.startswith('thème'):
                            group_field = 'theme'
                            target = 'group_oeuvre_field'
                except Exception:
                    pass

        if target == 'utilisateur':
            # Sum of oeuvres.vues + galeries.vues per user
            qs = Utilisateur.objects.annotate(
                total_oeuvre_views=Coalesce(Sum('oeuvres__vues'), 0),
                total_galerie_views=Coalesce(Sum('galeries__vues'), 0)
            ).annotate(total_views=F('total_oeuvre_views') + F('total_galerie_views')).order_by('-total_views')[:limit]

            labels = [f"{u.prenom} {u.nom}" for u in qs]
            values = [int(getattr(u, 'total_views') or 0) for u in qs]
            title = f"Vues par artiste/utilisateur (top {len(labels)})"

        elif target == 'galerie':
            qs = Galerie.objects.order_by('-vues')[:limit]
            labels = [g.nom for g in qs]
            values = [int(g.vues or 0) for g in qs]
            title = f"Vues par galerie (top {len(labels)})"

        elif target == 'oeuvre':
            qs = Oeuvre.objects.order_by('-vues')[:limit]
            labels = [o.titre for o in qs]
            values = [int(o.vues or 0) for o in qs]
            title = f"Vues par œuvre (top {len(labels)})"
        elif 'saison' in p or 'saisons' in p:
            # Group creations by season (radar chart)
            try:
                from django.db.models.functions import ExtractMonth
                from django.db.models import Count

                # Count oeuvres per month and map to seasons
                month_counts = {m: 0 for m in range(1, 13)}
                qs_month = Oeuvre.objects.annotate(month=ExtractMonth('date_creation')).values('month').annotate(cnt=Count('id'))
                for row in qs_month:
                    mm = row.get('month') or 0
                    if mm and 1 <= mm <= 12:
                        month_counts[int(mm)] = int(row.get('cnt') or 0)

                # Map months to French seasons
                seasons_map = {
                    'Printemps': [3, 4, 5],
                    'Été': [6, 7, 8],
                    'Automne': [9, 10, 11],
                    'Hiver': [12, 1, 2]
                }
                labels = list(seasons_map.keys())
                values = []
                for season, months in seasons_map.items():
                    ssum = sum(month_counts.get(m, 0) for m in months)
                    values.append(int(ssum))

                chart_type = 'radar'
                title = f"Créations de contenu par saison ({sum(values)} créations)"
            except Exception:
                # Fallback to global if something goes wrong
                total_galeries_views = Galerie.objects.aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0
                total_oeuvres_views = Oeuvre.objects.aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0
                labels = ['Galeries', 'Œuvres']
                values = [int(total_galeries_views), int(total_oeuvres_views)]
                title = 'Vues globales (galeries vs œuvres)'

        elif any(k in p for k in ['engagement', 'métriques', 'metrics', 'métrique', 'interactions']):
            # Build a multi-series bar chart showing multiple engagement metrics across top entities
            try:
                from django.db.models import Count

                # Choose target entities (galeries by default)
                label_qs = None
                if 'par utilisateur' in p or 'par auteur' in p or 'par artiste' in p:
                    label_qs = Utilisateur.objects.annotate(total_views=Coalesce(Sum('oeuvres__vues'), 0)).order_by('-total_views')[:limit]
                    labels = [f"{u.prenom} {u.nom}" for u in label_qs]
                    # series: vues, nombre d'œuvres
                    vues_series = [int(getattr(u, 'total_views') or 0) for u in label_qs]
                    oeuvres_series = [int(u.oeuvres.count() if hasattr(u, 'oeuvres') else 0) for u in label_qs]
                    series = [
                        {'name': 'Vues', 'data': vues_series},
                        {'name': 'Œuvres', 'data': oeuvres_series}
                    ]
                else:
                    # default: per galerie
                    label_qs = Galerie.objects.annotate(total_oeuvre_views=Coalesce(Sum('oeuvres__vues'), 0), oeuvres_count=Coalesce(Count('oeuvres'), 0)).order_by('-total_oeuvre_views')[:limit]
                    labels = [g.nom for g in label_qs]
                    vues_series = [int(getattr(g, 'total_oeuvre_views') or 0) for g in label_qs]
                    oeuvres_series = [int(getattr(g, 'oeuvres_count') or 0) for g in label_qs]
                    series = [
                        {'name': 'Vues (œuvres)', 'data': vues_series},
                        {'name': 'Nombre d\'œuvres', 'data': oeuvres_series}
                    ]

                chart_type = 'bar'
                title = f"Métriques d'engagement ({len(labels)} éléments)"
                # Return 'series' key for multi-series charts
                return Response({
                    'success': True,
                    'chart_type': chart_type,
                    'title': title,
                    'labels': labels,
                    'series': series,
                    'explanation': f"Généré à partir du prompt: {prompt}"
                })
            except Exception:
                # fallback to global
                total_galeries_views = Galerie.objects.aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0
                total_oeuvres_views = Oeuvre.objects.aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0
                labels = ['Galeries', 'Œuvres']
                values = [int(total_galeries_views), int(total_oeuvres_views)]
                title = 'Vues globales (galeries vs œuvres)'
        elif target == 'group_oeuvre_field' and group_field:
            # Group oeuvres by a specific field. If grouping by 'theme', aggregate via Galerie.theme
            try:
                from django.db.models import Count
                if group_field == 'theme':
                    # Oeuvre has no 'theme' field; use Galerie.theme and aggregate views of oeuvres related to galleries
                    # Sum vues of oeuvres per gallery theme
                    agg = Galerie.objects.values('theme').annotate(total_vues=Coalesce(Sum('oeuvres__vues'), 0)).order_by('-total_vues')[:limit]
                    labels = [row.get('theme') or 'Sans thème' for row in agg]
                    values = [int(row.get('total_vues') or 0) for row in agg]
                    title = f"Répartition des œuvres par thème (top {len(labels)})"
                else:
                    # For other fields that may exist on Oeuvre, try summing vues first
                    agg = Oeuvre.objects.values(group_field).annotate(total_vues=Coalesce(Sum('vues'), 0)).order_by('-total_vues')[:limit]
                    labels = [row.get(group_field) or 'Sans valeur' for row in agg]
                    values = [int(row.get('total_vues') or 0) for row in agg]
                    title = f"Répartition des œuvres par {group_field} (top {len(labels)})"
            except Exception:
                # Fallback: count of oeuvres per field value
                agg = Oeuvre.objects.values(group_field).annotate(cnt=Count('id')).order_by('-cnt')[:limit]
                labels = [row.get(group_field) or 'Sans valeur' for row in agg]
                values = [int(row.get('cnt') or 0) for row in agg]
                title = f"Répartition des œuvres par {group_field} (top {len(labels)})"

        else:  # global or unknown
            # If target explicitly global, return galeries vs oeuvres totals
            total_galeries_views = Galerie.objects.aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0
            total_oeuvres_views = Oeuvre.objects.aggregate(total=Coalesce(Sum('vues'), 0))['total'] or 0
            labels = ['Galeries', 'Œuvres']
            values = [int(total_galeries_views), int(total_oeuvres_views)]
            title = 'Vues globales (galeries vs œuvres)'

        # If there's no data, explain
        if not labels or not any(v > 0 for v in values):
            return Response({
                'success': False,
                'message': 'Aucune donnée disponible pour le critère demandé. Vérifiez la période ou les objets présents dans la base.'
            })

        return Response({
            'success': True,
            'chart_type': chart_type,
            'title': title,
            'labels': labels,
            'values': values,
            'explanation': f"Généré à partir du prompt: {prompt}"
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'success': False, 'message': f"Erreur serveur: {str(e)}"}, status=500)


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