from rest_framework import serializers
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique
from django.contrib.auth.hashers import make_password  

class UtilisateurSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True, required=False)  # ← Changé : non requis pour PATCH

    class Meta:
        model = Utilisateur
        fields = ['id', 'nom', 'prenom', 'email', 'telephone', 'image', 'date_inscription', 'password', 'password_confirm']
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True},
            'image': {'required': False},
        }

    def validate(self, data):
        # ← Amélioré : check seulement si password présent (pour create ou update avec mdp)
        if 'password' in data:
            if 'password_confirm' not in data or data['password'] != data['password_confirm']:
                raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas ou confirmation manquante."})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)  # ← Safe pop (au cas où)
        password = validated_data.pop('password')
        validated_data['password'] = make_password(password)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # ← Nouveau : gère password si présent (hash), et pop confirm
        validated_data.pop('password_confirm', None)  # Safe, même si absent
        if 'password' in validated_data:
            password = validated_data.pop('password')
            validated_data['password'] = make_password(password)
        return super().update(instance, validated_data)  # Gère image/nom/etc. normalement

class OeuvreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Oeuvre
        fields = '__all__'

class GalerieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Galerie
        fields = '__all__'

class InteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interaction
        fields = '__all__'

class StatistiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statistique
        fields = '__all__'
