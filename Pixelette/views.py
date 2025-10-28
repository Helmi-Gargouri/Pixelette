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
    """Permission that accepts either a DRF-authenticated Utilisateur with role 'admin'
    or a session-based user_id pointing to an admin Utilisateur.
    This allows the frontend (which uses cookies/session) to be treated as admin
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
            if user.role == 'admin':
                print("✅ Admin détecté via request.user")
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
            is_admin = getattr(u, 'role', None) == 'admin'
            print(f"📋 Is admin: {is_admin}")
            return is_admin
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
        print(f"🔍 get_permissions appelé pour action: {self.action}")
        if self.action in ['create', 'login', 'profile', 'logout', 'generate_2fa', 'enable_2fa', 'verify_2fa', 'disable_2fa', 'get_2fa_qr', 'request_artist_role', 'reset_password_code', 'forgot_password', 'verify_code', 'request_password_reset', 'count', 'artistes', 'restore_session', 'demander_artiste', 'statut_demande']:
            permission_classes = [AllowAny]
            print(f"✅ Permission AllowAny pour {self.action}")
        elif self.action == 'assign_role':
            permission_classes = [IsAdmin]
            print(f"✅ Permission IsAdmin pour {self.action}")
        elif self.action == 'mon_score_artiste':
            permission_classes = [IsAuthenticated]
            print(f"✅ Permission IsAuthenticated pour {self.action}")
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            # Pour les actions CRUD normales, utiliser IsAuthenticated pour permettre aux users normaux
            permission_classes = [IsAuthenticated]
            print(f"✅ Permission IsAuthenticated pour {self.action}")
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

class GalerieViewSet(viewsets.ModelViewSet):
    queryset = Galerie.objects.all()
    serializer_class = GalerieSerializer
    permission_classes = [AllowAny]
   
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