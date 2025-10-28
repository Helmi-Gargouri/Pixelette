from django.test import TestCase
from rest_framework.test import APIRequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from Pixelette.serializers import (
    UtilisateurSerializer, OeuvreSerializer, GalerieSerializer,
    GalerieInvitationSerializer, InteractionSerializer, InteractionCreateSerializer,
    InteractionStatsSerializer, StatistiqueSerializer, SavedStatSerializer,
    DemandeRoleSerializer, ResetPasswordSerializer, SuiviSerializer,
    ConsultationOeuvreSerializer, PartageOeuvreSerializer, ContactArtisteSerializer
)
from Pixelette.models import (
    Utilisateur, Oeuvre, Galerie, GalerieInvitation, Interaction, Statistique,
    Suivi, DemandeRole, ConsultationOeuvre, PartageOeuvre, ContactArtiste, SavedStat
)
from unittest.mock import patch

class UtilisateurSerializerTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user_data = {
            'nom': 'Doe', 'prenom': 'John', 'email': 'john@example.com',
            'password': 'password123', 'password_confirm': 'password123'
        }

    def test_create_user(self):
        serializer = UtilisateurSerializer(data=self.user_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        user = serializer.save()
        self.assertEqual(user.email, 'john@example.com')
        self.assertEqual(user.role, 'user')
        self.assertTrue(user.is_two_factor_enabled)
        self.assertIsNotNone(user.two_factor_temp_secret)

    def test_password_mismatch(self):
        data = self.user_data.copy()
        data['password_confirm'] = 'wrong'
        serializer = UtilisateurSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password_confirm', serializer.errors)

    def test_update_user(self):
        user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="hashed")
        data = {'nom': 'Smith', 'password': 'newpass', 'password_confirm': 'newpass'}
        serializer = UtilisateurSerializer(instance=user, data=data, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_user = serializer.save()
        self.assertEqual(updated_user.nom, 'Smith')

    def test_image_url(self):
        user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="hashed")
        user.image = SimpleUploadedFile("test.jpg", b"file_content", content_type="image/jpeg")
        user.save()
        request = self.factory.get('/')
        serializer = UtilisateurSerializer(user, context={'request': request})
        data = serializer.data
        self.assertTrue(data['image'].startswith('http://testserver/'))

class OeuvreSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.oeuvre = Oeuvre.objects.create(titre="Test Oeuvre", auteur=self.user)
        self.factory = APIRequestFactory()

    def test_auteur_nom(self):
        serializer = OeuvreSerializer(self.oeuvre)
        self.assertEqual(serializer.data['auteur_nom'], "John Doe")

    def test_image_url(self):
        self.oeuvre.image = SimpleUploadedFile("test.jpg", b"file_content", content_type="image/jpeg")
        self.oeuvre.save()
        request = self.factory.get('/')
        serializer = OeuvreSerializer(self.oeuvre, context={'request': request})
        data = serializer.data
        self.assertTrue(data['image'].startswith('http://testserver/'))

class GalerieSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.galerie = Galerie.objects.create(nom="Test Galerie", proprietaire=self.user)
        self.oeuvre = Oeuvre.objects.create(titre="Test Oeuvre", auteur=self.user)

    def test_oeuvres_count(self):
        self.galerie.oeuvres.add(self.oeuvre)
        serializer = GalerieSerializer(self.galerie)
        self.assertEqual(serializer.data['oeuvres_count'], 1)

    def test_oeuvres_list(self):
        self.galerie.oeuvres.add(self.oeuvre)
        serializer = GalerieSerializer(self.galerie)
        self.assertEqual(len(serializer.data['oeuvres_list']), 1)

class GalerieInvitationSerializerTest(TestCase):
    def setUp(self):
        self.user1 = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.user2 = Utilisateur.objects.create(nom="Smith", prenom="Jane", email="jane@example.com", password="pass")
        self.galerie = Galerie.objects.create(nom="Galerie", proprietaire=self.user1)
        self.invitation = GalerieInvitation.objects.create(galerie=self.galerie, utilisateur=self.user2)

    def test_fields(self):
        serializer = GalerieInvitationSerializer(self.invitation)
        data = serializer.data
        self.assertEqual(data['utilisateur_nom'], "Jane Smith")
        self.assertEqual(data['galerie_nom'], "Galerie")
        self.assertEqual(data['utilisateur_email'], "jane@example.com")

class InteractionSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.oeuvre = Oeuvre.objects.create(titre="Test Oeuvre", auteur=self.user)
        self.interaction = Interaction.objects.create(type="like", utilisateur=self.user, oeuvre=self.oeuvre)

    @patch('better_profanity.profanity.censor')  # Mock pour better-profanity
    def test_display_content(self, mock_censor):
        mock_censor.return_value = "Filtered"
        self.interaction.contenu = "Test"
        serializer = InteractionSerializer(self.interaction)
        self.assertEqual(serializer.data['display_content'], "Test")

    def test_replies(self):
        comment = Interaction.objects.create(type="commentaire", utilisateur=self.user, oeuvre=self.oeuvre, contenu="Comment")
        reply = Interaction.objects.create(type="commentaire", utilisateur=self.user, oeuvre=self.oeuvre, contenu="Reply", parent=comment)
        serializer = InteractionSerializer(comment)
        self.assertEqual(len(serializer.data['replies']), 1)

class InteractionCreateSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.oeuvre = Oeuvre.objects.create(titre="Test Oeuvre", auteur=self.user)

    def test_comment_validation(self):
        data = {'type': 'commentaire', 'oeuvre': self.oeuvre.id, 'contenu': ''}
        serializer = InteractionCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)  # Correction: erreur dans non_field_errors

    def test_share_validation(self):
        data = {'type': 'partage', 'oeuvre': self.oeuvre.id, 'plateforme_partage': ''}
        serializer = InteractionCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)  # Correction: erreur dans non_field_errors

class InteractionStatsSerializerTest(TestCase):
    def test_fields(self):
        data = {
            'oeuvre_id': 1, 'oeuvre_titre': 'Test Oeuvre', 'total_likes': 10,
            'total_commentaires': 5, 'total_partages': 3, 'total_interactions': 18
        }
        serializer = InteractionStatsSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

class StatistiqueSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        # Ajustez aux champs réels de Statistique (ex. 'vues' au lieu de 'vues_totales', 'utilisateur_id' au lieu de 'utilisateur')
        self.stat = Statistique.objects.create(vues=100, utilisateur_id=self.user.id)  # Correction: ajustez aux champs réels

    def test_fields(self):
        serializer = StatistiqueSerializer(self.stat)
        self.assertEqual(serializer.data['vues'], 100)  # Correction: ajustez au champ réel

class SavedStatSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.stat = SavedStat.objects.create(title="Test Stat", chart_type="bar", subject="oeuvre", created_by=self.user)

    def test_created_by_name(self):
        serializer = SavedStatSerializer(self.stat)
        self.assertEqual(serializer.data['created_by_name'], "John Doe")

class DemandeRoleSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.demande = DemandeRole.objects.create(utilisateur=self.user, nouveau_role='artiste')

    def test_utilisateur_nom(self):
        serializer = DemandeRoleSerializer(self.demande)
        self.assertEqual(serializer.data['utilisateur_nom'], "John Doe")

class ResetPasswordSerializerTest(TestCase):
    def test_password_mismatch(self):
        data = {'email': 'john@example.com', 'new_password': 'pass123', 'password_confirm': 'pass456'}
        serializer = ResetPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password_confirm', serializer.errors)  # Correction: erreur sur password_confirm

class SuiviSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="User", prenom="Normal", email="user@example.com", password="pass", role='user')
        self.artiste = Utilisateur.objects.create(nom="Artiste", prenom="Pro", email="artiste@example.com", password="pass", role='artiste')
        self.non_artiste = Utilisateur.objects.create(nom="Non", prenom="Art", email="non@example.com", password="pass", role='user')

    def test_validation_self_follow(self):
        data = {'utilisateur': self.user.id, 'artiste': self.user.id}
        serializer = SuiviSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)  # Correction: erreur dans non_field_errors

    def test_validation_non_artiste(self):
        data = {'utilisateur': self.user.id, 'artiste': self.non_artiste.id}
        serializer = SuiviSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)  # Correction: erreur dans non_field_errors

class ConsultationOeuvreSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.oeuvre = Oeuvre.objects.create(titre="Test Oeuvre", auteur=self.user)
        self.consultation = ConsultationOeuvre.objects.create(utilisateur=self.user, oeuvre_id=self.oeuvre.id)

    def test_fields(self):
        serializer = ConsultationOeuvreSerializer(self.consultation)
        self.assertEqual(serializer.data['utilisateur_email'], "john@example.com")

class PartageOeuvreSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.oeuvre = Oeuvre.objects.create(titre="Test Oeuvre", auteur=self.user)
        self.partage = PartageOeuvre.objects.create(utilisateur=self.user, oeuvre_id=self.oeuvre.id, plateforme='twitter')

    def test_fields(self):
        serializer = PartageOeuvreSerializer(self.partage)
        self.assertEqual(serializer.data['utilisateur_email'], "john@example.com")
        self.assertEqual(serializer.data['plateforme'], 'twitter')

class ContactArtisteSerializerTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="User", prenom="Normal", email="user@example.com", password="pass", role='user')
        self.artiste = Utilisateur.objects.create(nom="Artiste", prenom="Pro", email="artiste@example.com", password="pass", role='artiste')
        self.contact = ContactArtiste.objects.create(utilisateur=self.user, artiste=self.artiste, sujet="Test", message="Hello")

    def test_fields(self):
        serializer = ContactArtisteSerializer(self.contact)
        self.assertEqual(serializer.data['utilisateur_nom'], "Normal User")
        self.assertEqual(serializer.data['artiste_nom'], "Pro Artiste")