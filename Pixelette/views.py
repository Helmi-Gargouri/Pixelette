from rest_framework import viewsets
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique
from .serializers import UtilisateurSerializer, OeuvreSerializer, GalerieSerializer, InteractionSerializer, StatistiqueSerializer
from rest_framework import viewsets, status  # Add status here
from rest_framework.decorators import action  # For the @action decorator (already used, but explicit import clears potential linting)
from rest_framework.response import Response  # For Response class
from rest_framework.permissions import IsAuthenticated, AllowAny  # For permission classes
from django.contrib.auth.hashers import check_password  # For password verification in login
from django.contrib.auth.tokens import default_token_generator  # For token generation
from django.utils import timezone
from rest_framework.authtoken.models import Token
from django.contrib.auth import login  # Pour session, optionnel
from rest_framework.authtoken.models import Token
from django.core.cache import cache  # Ajoute cet import en haut du fichier
import secrets  # Déjà là

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [AllowAny]  # Par défaut ouvert ; on gère manuel pour protected

    def get_permissions(self):
        if self.action in ['create', 'login', 'profile', 'logout']:  # Ajoute profile/logout si besoin
            permission_classes = [AllowAny]
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
        
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])  # Garde IsAuthenticated maintenant
    def profile(self, request):
        # Optionnel : tes checks existants pour double-vérif
        session_token = request.session.get('token')
        auth_header = request.headers.get('Authorization', '')
        header_token = auth_header.split(' ')[1] if auth_header.startswith('Token ') else None
        if header_token != session_token:
            return Response({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Puisque auth a passé, request.user est setté
        return Response(UtilisateurSerializer(request.user).data)  # Plus simple !
    

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        # Optionnel : vérif token comme avant
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Token '):
            header_token = auth_header.split(' ')[1]
            if header_token != request.session.get('token'):
                return Response({'error': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)
            # Supprime du cache si tu l'utilises plus tard
            cache.delete(f"token_{header_token}")
        
        request.session.flush()  # Vide session
        return Response({'message': 'Déconnecté avec succès'})

class OeuvreViewSet(viewsets.ModelViewSet):
    queryset = Oeuvre.objects.all()
    serializer_class = OeuvreSerializer

class GalerieViewSet(viewsets.ModelViewSet):
    queryset = Galerie.objects.all()
    serializer_class = GalerieSerializer

class InteractionViewSet(viewsets.ModelViewSet):
    queryset = Interaction.objects.all()
    serializer_class = InteractionSerializer

class StatistiqueViewSet(viewsets.ModelViewSet):
    queryset = Statistique.objects.all()
    serializer_class = StatistiqueSerializer
