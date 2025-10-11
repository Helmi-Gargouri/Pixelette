from rest_framework import viewsets
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique, GalerieInvitation
from .serializers import UtilisateurSerializer, OeuvreSerializer, GalerieSerializer, InteractionSerializer, StatistiqueSerializer, GalerieInvitationSerializer
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
from rest_framework.decorators import api_view
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
        if self.action in ['create', 'login', 'profile', 'logout',  'generate_2fa', 'enable_2fa', 'verify_2fa', 'disable_2fa', 'get_2fa_qr', 'request_artist_role','reset_password_code','forgot_password','verify_code','request_password_reset']:
            permission_classes = [AllowAny]
        elif self.action == 'assign_role':
            permission_classes = [IsAuthenticated]  
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

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
            if check_password(password, user.password):
                token = secrets.token_urlsafe(32)  # Génère token random
                
                # Stocke token et user_id en session
                request.session['token'] = token
                request.session['user_id'] = user.id
                request.session.save()
                
                return Response({
                    'message': 'Login réussi',
                    'user': UtilisateurSerializer(user).data,
                    'token': token  # Token retourné ici !
                })
            return Response({'error': 'Mot de passe incorrect'}, status=status.HTTP_401_UNAUTHORIZED)
        except Utilisateur.DoesNotExist:
            return Response({'error': 'Utilisateur non trouvé'}, status=status.HTTP_401_UNAUTHORIZED)
       
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def generate_2fa(self, request):
        try:
            user_id = int(request.data.get('user_id'))
        except (ValueError, TypeError):
            return Response({'error': 'User ID invalide'}, status=status.HTTP_400_BAD_REQUEST)
        user = get_object_or_404(Utilisateur, id=user_id)
        if not user.two_factor_enabled:
            return Response({'error': '2FA non activé pour cet utilisateur'}, status=status.HTTP_400_BAD_REQUEST)
        if user.two_factor_secret:
            return Response({'error': '2FA déjà configuré'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.two_factor_temp_secret:
            user.two_factor_temp_secret = pyotp.random_base32()
            user.save()
        temp_secret = user.two_factor_temp_secret
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
            'qr_code': f"data:image/png;base64,{qr_code_data}",
            'message': 'Scannez le QR code avec votre app authenticator'
        })

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def enable_2fa(self, request):
        # Comme enable2FA dans ton ancien projet : pour setup initial seulement
        try:
            user_id = int(request.data.get('user_id'))
        except (ValueError, TypeError):
            return Response({'error': 'User ID invalide'}, status=status.HTTP_400_BAD_REQUEST)
        user = get_object_or_404(Utilisateur, id=user_id)
        code = request.data.get('two_factor_code')
        if not code:
            return Response({'error': 'Code requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Vérif avec temp_secret (setup initial)
        if user.two_factor_temp_secret and not user.two_factor_secret:
            totp = pyotp.TOTP(user.two_factor_temp_secret)
            if not totp.verify(code, valid_window=1):
                return Response({'error': 'Code invalide. Vérifiez l\'heure.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Active définitivement (comme dans enable2FA)
            user.two_factor_secret = user.two_factor_temp_secret
            user.two_factor_temp_secret = None
            user.save()
            
            # Génère token et connecte
            token, created = Token.objects.get_or_create(user=user)
            request.session['token'] = token.key
            request.session['user_id'] = user.id
            if 'pending_user_id' in request.session:
                del request.session['pending_user_id']
            request.session.save()
            
            return Response({
                'token': token.key,
                'message': '2FA activé et connexion réussie !',
                'user': UtilisateurSerializer(user).data
            })
        else:
            return Response({'error': '2FA déjà activé ou pas en setup. Utilisez verify_2fa.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_2fa(self, request):
        # Comme verify2FA dans ton ancien projet : pour vérif normale
        try:
            user_id = int(request.data.get('user_id'))
        except (ValueError, TypeError):
            return Response({'error': 'User ID invalide'}, status=status.HTTP_400_BAD_REQUEST)
        user = get_object_or_404(Utilisateur, id=user_id)
        code = request.data.get('two_factor_code')
        if not code:
            return Response({'error': 'Code requis'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.two_factor_secret:
            return Response({'error': '2FA non configuré. Activez-le d\'abord.'}, status=status.HTTP_400_BAD_REQUEST)
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code, valid_window=1):
            return Response({'error': 'Code invalide. Vérifiez l\'heure.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Connecte
        token, created = Token.objects.get_or_create(user=user)
        request.session['token'] = token.key
        request.session['user_id'] = user.id
        if 'pending_user_id' in request.session:
            del request.session['pending_user_id']
        request.session.save()

        return Response({
            'token': token.key,
            'message': 'Vérification réussie ! Connexion...',
            'user': UtilisateurSerializer(user).data
        })

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def disable_2fa(self, request):
        user = request.user
        user.is_two_factor_enabled = False  # ← Désactive
        user.two_factor_secret = None
        user.two_factor_temp_secret = None
        user.save()
        return Response({"message": "2FA désactivé ! Prochaine connexion sans 2FA."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def get_2fa_qr(self, request):
        user = request.user
        if user.is_two_factor_enabled and user.two_factor_secret:
            return Response({"message": "2FA already enabled"}, status=status.HTTP_400_BAD_REQUEST)

        # Générer un secret temporaire
        temp_secret = pyotp.random_base32()
        user.two_factor_temp_secret = temp_secret
        user.save()

        # Générer l'URL OTP
        otp_auth_url = pyotp.totp.TOTP(temp_secret).provisioning_uri(
            name=user.email,
            issuer_name='Pixelette'
        )

        # Générer le QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(otp_auth_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        qr_code_data = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return Response({
            "qr_code": f"data:image/png;base64,{qr_code_data}",
            "secret": temp_secret
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

class GalerieViewSet(viewsets.ModelViewSet):
    queryset = Galerie.objects.all()
    serializer_class = GalerieSerializer
    permission_classes = [AllowAny]
    
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