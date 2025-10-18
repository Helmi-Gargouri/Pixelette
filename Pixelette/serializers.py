from rest_framework import serializers
from django.contrib.auth.hashers import make_password  
import pyotp
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique, DemandeRole, GalerieInvitation, Suivi

class UtilisateurSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True, required=False)
    two_factor_enabled = serializers.BooleanField(source='is_two_factor_enabled', read_only=True)

    class Meta:
        model = Utilisateur
        fields = ['id', 'nom', 'prenom', 'email', 'telephone', 'image', 'date_inscription', 'password', 'password_confirm', 'two_factor_enabled', 'two_factor_secret', 'role']
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True},
            'image': {'required': False},
            'two_factor_secret': {'read_only': True},
            'date_inscription': {'read_only': True},
            'role': {'read_only': True},
        }

    def validate(self, data):
        if 'password' in data:
            if 'password_confirm' not in data or data['password'] != data['password_confirm']:
                raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas ou confirmation manquante."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        validated_data['password'] = make_password(password)
        validated_data['role'] = 'user'
        # 2FA activé par défaut + temp_secret pour setup
        #validated_data['is_two_factor_enabled'] = True
        #validated_data['two_factor_temp_secret'] = pyotp.random_base32()  
        #validated_data['two_factor_secret'] = None  # Pas encore configuré
        validated_data.pop('two_factor_enabled', None)
        return super().create(validated_data) 
    
    def update(self, instance, validated_data):
        validated_data.pop('password_confirm', None)
        if 'password' in validated_data:
            password = validated_data.pop('password')
            validated_data['password'] = make_password(password)
        validated_data.pop('two_factor_enabled', None)
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                representation['image'] = instance.image.url
        return representation

class OeuvreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Oeuvre
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                representation['image'] = instance.image.url
        return representation

class GalerieSerializer(serializers.ModelSerializer):
    oeuvres_count = serializers.SerializerMethodField()
    oeuvres_list = OeuvreSerializer(source='oeuvres', many=True, read_only=True)
    
    class Meta:
        model = Galerie
        fields = ['id', 'nom', 'description', 'theme', 'proprietaire', 'privee', 'oeuvres', 'oeuvres_count', 'oeuvres_list', 'date_creation']
    
    def get_oeuvres_count(self, obj):
        return obj.oeuvres.count()

class GalerieInvitationSerializer(serializers.ModelSerializer):
    utilisateur_email = serializers.EmailField(source='utilisateur.email', read_only=True)
    utilisateur_nom = serializers.SerializerMethodField()
    galerie_nom = serializers.CharField(source='galerie.nom', read_only=True)
    
    class Meta:
        model = GalerieInvitation
        fields = ['id', 'galerie', 'galerie_nom', 'utilisateur', 'utilisateur_email', 'utilisateur_nom', 
                  'token', 'date_envoi', 'date_expiration', 'acceptee', 'date_acceptation']
        read_only_fields = ['token', 'date_envoi', 'date_expiration', 'acceptee', 'date_acceptation']
    
    def get_utilisateur_nom(self, obj):
        return f"{obj.utilisateur.prenom} {obj.utilisateur.nom}"

class InteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interaction
        fields = '__all__'

class StatistiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statistique
        fields = '__all__'

class DemandeRoleSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.SerializerMethodField()  

    class Meta:
        model = DemandeRole
        fields = ['id', 'utilisateur_nom', 'nouveau_role', 'statut', 'raison', 'date_demande']
        read_only_fields = ['id', 'utilisateur', 'statut', 'date_demande']

    def get_utilisateur_nom(self, obj):
        return f"{obj.utilisateur.prenom} {obj.utilisateur.nom}"
    
class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    reset_code = serializers.CharField(max_length=5, required=False)  
    new_password = serializers.CharField(min_length=8, required=False)  
    password_confirm = serializers.CharField(required=False)

    def validate(self, data):
        if 'new_password' in data and 'password_confirm' in data:
            if data['new_password'] != data['password_confirm']:
                raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return data
    
class SuiviSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.SerializerMethodField()
    artiste_nom = serializers.SerializerMethodField()
    utilisateur_email = serializers.EmailField(source='utilisateur.email', read_only=True)
    artiste_email = serializers.EmailField(source='artiste.email', read_only=True)
    
    class Meta:
        model = Suivi
        fields = ['id', 'utilisateur', 'utilisateur_nom', 'utilisateur_email', 
                  'artiste', 'artiste_nom', 'artiste_email', 'date_suivi']
        read_only_fields = ['id', 'date_suivi']
    
    def get_utilisateur_nom(self, obj):
        return f"{obj.utilisateur.prenom} {obj.utilisateur.nom}"
    
    def get_artiste_nom(self, obj):
        return f"{obj.artiste.prenom} {obj.artiste.nom}"
    
    def validate(self, data):
        utilisateur = data.get('utilisateur')
        artiste = data.get('artiste')
        
        # Vérifier qu'on ne se suit pas soi-même
        if utilisateur == artiste:
            raise serializers.ValidationError("Vous ne pouvez pas vous suivre vous-même")
        
        # Vérifier que c'est bien un artiste
        if artiste.role != 'artiste':
            raise serializers.ValidationError("Vous ne pouvez suivre que des artistes")
        
        return data