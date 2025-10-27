#!/usr/bin/env python
"""
Script de test pour l'API des interactions
"""
import os
import sys
import django
import requests

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
sys.path.append('d:/helmi/Pixelette')
django.setup()

from Pixelette.models import Utilisateur, Oeuvre, Interaction

def test_interactions_api():
    print("🧪 Test de l'API des interactions")
    
    # Vérifier les données existantes
    users = Utilisateur.objects.all()
    oeuvres = Oeuvre.objects.all()
    interactions = Interaction.objects.all()
    
    print(f"📊 Utilisateurs: {users.count()}")
    print(f"📊 Œuvres: {oeuvres.count()}")
    print(f"📊 Interactions: {interactions.count()}")
    
    if users.exists() and oeuvres.exists():
        user = users.first()
        oeuvre = oeuvres.first()
        
        print(f"🧑 Utilisateur test: {user.prenom} {user.nom}")
        print(f"🎨 Œuvre test: {oeuvre.titre}")
        
        # Test création d'interaction directement en base
        try:
            interaction = Interaction.objects.create(
                type='commentaire',
                utilisateur=user,
                oeuvre=oeuvre,
                contenu='Test commentaire via script'
            )
            print(f"✅ Interaction créée: {interaction}")
            
            # Supprimer l'interaction de test
            interaction.delete()
            print("🗑️ Interaction de test supprimée")
            
        except Exception as e:
            print(f"❌ Erreur lors de la création: {e}")
    
    # Test API REST
    print("\n🌐 Test API REST:")
    try:
        response = requests.get('http://localhost:8000/api/interactions/')
        print(f"📡 GET /api/interactions/ -> Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Interactions trouvées: {len(data)}")
        else:
            print(f"❌ Erreur: {response.text}")
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")

if __name__ == '__main__':
    test_interactions_api()