from rest_framework.decorators import action
from rest_framework.response import Response
from .utils.color_analysis import analyze_galerie_palette
from .utils.clustering import cluster_galeries
from .utils.spotify import generate_playlist_for_gallery, search_playlists_by_theme, get_spotify_oauth, create_playlist_in_user_account
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import viewsets
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique, GalerieInvitation, Suivi
from .serializers import UtilisateurSerializer, OeuvreSerializer, GalerieSerializer, InteractionSerializer, StatistiqueSerializer, GalerieInvitationSerializer, SuiviSerializer, InteractionCreateSerializer
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


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and hasattr(request.user, 'role') and request.user.role == 'admin'
    
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
        if self.action in ['create', 'login', 'profile', 'logout',  'generate_2fa', 'enable_2fa', 'verify_2fa', 'disable_2fa', 'get_2fa_qr', 'request_artist_role','reset_password_code','forgot_password','verify_code','request_password_reset', 'count', 'artistes']:
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
        user.save()  
        
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
        
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def artistes(self, request):
        """Liste tous les utilisateurs ayant le rôle 'artiste'"""
        artistes = Utilisateur.objects.filter(role='artiste')
        serializer = self.get_serializer(artistes, many=True, context={'request': request})
        
        # Ajouter le statut de suivi pour chaque artiste si l'utilisateur est connecté
        artistes_data = serializer.data
        if request.user.is_authenticated:
            user_suivis = Suivi.objects.filter(utilisateur=request.user).values_list('artiste_id', flat=True)
            for artiste in artistes_data:
                artiste['is_followed'] = artiste['id'] in user_suivis
                # Compter le nombre d'abonnés
                artiste['followers_count'] = Suivi.objects.filter(artiste_id=artiste['id']).count()
        else:
            for artiste in artistes_data:
                artiste['is_followed'] = False
                artiste['followers_count'] = Suivi.objects.filter(artiste_id=artiste['id']).count()
        
        return Response({
            'count': len(artistes_data),
            'artistes': artistes_data
        })
         
class OeuvreViewSet(viewsets.ModelViewSet):
    queryset = Oeuvre.objects.all()
    serializer_class = OeuvreSerializer
    permission_classes = [AllowAny]
    
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
    permission_classes = [AllowAny]  # Temporaire pour les tests
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return InteractionCreateSerializer
        return InteractionSerializer
    
    def get_queryset(self):
        queryset = Interaction.objects.select_related('utilisateur', 'oeuvre').order_by('-date')
        
        # Filtres pour le backoffice
        type_filter = self.request.query_params.get('type')
        utilisateur_filter = self.request.query_params.get('utilisateur')
        oeuvre_filter = self.request.query_params.get('oeuvre')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
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
    
    def perform_create(self, serializer):
        # Pour les tests sans authentification
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        """Suppression avec confirmation"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'message': 'Interaction supprimée avec succès'
        }, status=status.HTTP_200_OK)
    
    def perform_create(self, serializer):
        # Automatiquement assigner l'utilisateur connecté
        serializer.save(utilisateur=self.request.user)
    
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
        
        # Vérifier si l'utilisateur a déjà liké
        interaction, created = Interaction.objects.get_or_create(
            utilisateur=request.user,
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

class StatistiqueViewSet(viewsets.ModelViewSet):
    queryset = Statistique.objects.all()
    serializer_class = StatistiqueSerializer

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

# ===== VUES SPOTIFY OAUTH =====

from django.http import JsonResponse, HttpResponseRedirect
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

