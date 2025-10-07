from rest_framework import serializers
from .models import Utilisateur, Oeuvre, Galerie, Interaction, Statistique

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = '__all__'

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
