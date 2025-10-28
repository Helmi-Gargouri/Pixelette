from rest_framework import serializers
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique, DemandeRole, GalerieInvitation, SavedStat
from django.contrib.auth.hashers import make_password  
import pyotp
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique, DemandeRole, GalerieInvitation, Suivi
from .models import ConsultationOeuvre, PartageOeuvre, ContactArtiste

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
            'role': {'required': False},
        }

    def validate(self, data):
        if 'password' in data and 'password_confirm' in data:
            if data['password'] != data['password_confirm']:
                raise serializers.ValidationError({"password_confirm": "Les mots de passe ne correspondent pas."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        validated_data['password'] = make_password(password)
        validated_data['role'] = validated_data.get('role', 'user')
        validated_data['is_two_factor_enabled'] = True  # 2FA activé par défaut
        validated_data['two_factor_temp_secret'] = pyotp.random_base32()
        validated_data['two_factor_secret'] = None
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
    auteur_nom = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Oeuvre
        # expose all model fields; the SerializerMethodField 'auteur_nom' is declared above and will be included
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                representation['image'] = request.build_absolute_uri(instance.image.url)
            else:
                representation['image'] = instance.image.url
        # add author display name
        try:
            representation['auteur_nom'] = f"{instance.auteur.prenom} {instance.auteur.nom}"
        except Exception:
            representation['auteur_nom'] = None
        return representation

    def get_auteur_nom(self, obj):
        if obj.auteur:
            return f"{obj.auteur.prenom} {obj.auteur.nom}"
        return None

class GalerieSerializer(serializers.ModelSerializer):
    oeuvres_count = serializers.SerializerMethodField()
    oeuvres_list = OeuvreSerializer(source='oeuvres', many=True, read_only=True)
    
    class Meta:
        model = Galerie
        fields = ['id', 'nom', 'description', 'theme', 'proprietaire', 'privee', 'oeuvres', 'oeuvres_count', 'oeuvres_list', 'date_creation', 'vues']
    
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
    utilisateur_nom = serializers.SerializerMethodField()
    oeuvre_titre = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(source='parent.id', read_only=True)
    display_content = serializers.SerializerMethodField()
    is_visible = serializers.SerializerMethodField()
    
    class Meta:
        model = Interaction
        fields = [
            'id', 'type', 'utilisateur', 'utilisateur_nom', 
            'oeuvre', 'oeuvre_titre', 'contenu', 'display_content', 'plateforme_partage', 
            'date', 'parent', 'parent_id', 'replies', 'is_visible',
            'moderation_status', 'moderation_score', 'moderation_reasons', 'filtered_content'
        ]
        read_only_fields = [
            'id', 'date', 'utilisateur_nom', 'oeuvre_titre', 'parent_id', 'replies',
            'display_content', 'is_visible', 'moderation_status', 'moderation_score', 
            'moderation_reasons', 'filtered_content'
        ]
    
    def get_utilisateur_nom(self, obj):
        return f"{obj.utilisateur.prenom} {obj.utilisateur.nom}"
    
    def get_oeuvre_titre(self, obj):
        return obj.oeuvre.titre
    
    def get_display_content(self, obj):
        """Retourne le contenu à afficher (filtré si nécessaire)"""
        return obj.get_display_content()
    
    def get_is_visible(self, obj):
        """Retourne si l'interaction doit être visible publiquement"""
        return obj.is_visible()
    
    def get_replies(self, obj):
        """Récupérer les réponses pour un commentaire (seulement si c'est un commentaire principal)"""
        if obj.type == 'commentaire' and obj.parent is None:
            # Filtrer les réponses visibles seulement
            replies = obj.reponses.filter(
                moderation_status__in=['approved', 'pending'],
                moderation_score__lt=0.8
            ).order_by('date')
            # Éviter la récursion infinie en utilisant un serializer simplifié
            return [{
                'id': reply.id,
                'utilisateur_nom': f"{reply.utilisateur.prenom} {reply.utilisateur.nom}",
                'contenu': reply.get_display_content(),
                'date': reply.date,
                'parent_id': reply.parent.id if reply.parent else None,
                'moderation_status': reply.moderation_status,
                'is_visible': reply.is_visible()
            } for reply in replies if reply.is_visible()]
        return []
    
    def validate(self, data):
        # Validation pour les commentaires
        if data.get('type') == 'commentaire':
            if not data.get('contenu', '').strip():
                raise serializers.ValidationError("Le contenu est obligatoire pour un commentaire.")
        
        # Validation pour les partages
        if data.get('type') == 'partage':
            if not data.get('plateforme_partage'):
                raise serializers.ValidationError("La plateforme est obligatoire pour un partage.")
            # Nettoyer le contenu pour les partages (pas nécessaire)
            data['contenu'] = ''
        
        # Nettoyer plateforme_partage pour like et commentaire
        if data.get('type') in ['like', 'commentaire']:
            data['plateforme_partage'] = ''
            
        return data

class InteractionCreateSerializer(serializers.ModelSerializer):
    """Serializer spécialisé pour la création d'interactions"""
    
    class Meta:
        model = Interaction
        fields = ['type', 'oeuvre', 'contenu', 'plateforme_partage', 'parent']
    
    def validate(self, data):
        # Validation selon le type
        if data.get('type') == 'commentaire':
            if not data.get('contenu', '').strip():
                raise serializers.ValidationError("Le contenu est obligatoire pour un commentaire.")
        elif data.get('type') == 'partage':
            if not data.get('plateforme_partage'):
                raise serializers.ValidationError("La plateforme est obligatoire pour un partage.")
        
        return data

class InteractionStatsSerializer(serializers.Serializer):
    """Serializer pour les statistiques d'interactions"""
    oeuvre_id = serializers.IntegerField()
    oeuvre_titre = serializers.CharField()
    total_likes = serializers.IntegerField()
    total_commentaires = serializers.IntegerField()
    total_partages = serializers.IntegerField()
    total_interactions = serializers.IntegerField()

class StatistiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statistique
        fields = '__all__'


class SavedStatSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SavedStat
        fields = ['id', 'title', 'chart_type', 'subject', 'subject_field', 'config', 'created_by', 'created_by_name', 'created_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.prenom} {obj.created_by.nom}"
        return None

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
    
class ConsultationOeuvreSerializer(serializers.ModelSerializer):
    utilisateur_email = serializers.EmailField(source='utilisateur.email', read_only=True)
    
    class Meta:
        model = ConsultationOeuvre
        fields = ['id', 'utilisateur', 'utilisateur_email', 'oeuvre_id', 'date_consultation']
        read_only_fields = ['id', 'date_consultation']


class PartageOeuvreSerializer(serializers.ModelSerializer):
    utilisateur_email = serializers.EmailField(source='utilisateur.email', read_only=True)
    plateforme_display = serializers.CharField(source='get_plateforme_display', read_only=True)
    
    class Meta:
        model = PartageOeuvre
        fields = ['id', 'utilisateur', 'utilisateur_email', 'oeuvre_id', 'plateforme', 'plateforme_display', 'date_partage']
        read_only_fields = ['id', 'date_partage']


class ContactArtisteSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.SerializerMethodField()
    artiste_nom = serializers.SerializerMethodField()
    utilisateur_email = serializers.EmailField(source='utilisateur.email', read_only=True)
    artiste_email = serializers.EmailField(source='artiste.email', read_only=True)
    
    class Meta:
        model = ContactArtiste
        fields = [
            'id', 'utilisateur', 'utilisateur_nom', 'utilisateur_email',
            'artiste', 'artiste_nom', 'artiste_email',
            'sujet', 'message', 'date_contact', 'lu'
        ]
        read_only_fields = ['id', 'date_contact']
    
    def get_utilisateur_nom(self, obj):
        return f"{obj.utilisateur.prenom} {obj.utilisateur.nom}"
    
    def get_artiste_nom(self, obj):
        return f"{obj.artiste.prenom} {obj.artiste.nom}"