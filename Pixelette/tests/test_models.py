from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
try:
    from Pixelette.models import (  # Changement de 'pixelette' à 'Pixelette'
        TempAuthStorage, Utilisateur, Oeuvre, Galerie, GalerieInvitation,
        Interaction, Statistique, Suivi, DemandeRole, Connexion,
        ConsultationOeuvre, PartageOeuvre, ContactArtiste, SavedStat
    )
except ImportError as e:
    print(f"Erreur d'importation: {e}")
    raise

import uuid

class TempAuthStorageModelTest(TestCase):
    def test_create_temp_auth(self):
        temp_auth = TempAuthStorage.objects.create(
            token="test_token",
            user_data={"email": "test@example.com"}
        )
        self.assertIsInstance(temp_auth.id, uuid.UUID)
        self.assertEqual(temp_auth.token, "test_token")
        self.assertEqual(temp_auth.user_data, {"email": "test@example.com"})
        self.assertFalse(temp_auth.is_expired())

    def test_save_sets_expires_at(self):
        temp_auth = TempAuthStorage(token="token", user_data={})
        temp_auth.save()
        self.assertTrue(temp_auth.expires_at > timezone.now())

    def test_is_expired(self):
        temp_auth = TempAuthStorage.objects.create(
            token="token", user_data={}, expires_at=timezone.now() - timedelta(minutes=1)
        )
        self.assertTrue(temp_auth.is_expired())

class UtilisateurModelTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(
            nom="Doe", prenom="John", email="john@example.com", password="hashed_pass"
        )

    def test_str_method(self):
        self.assertEqual(str(self.user), "John Doe")

    def test_properties(self):
        self.assertTrue(self.user.is_authenticated)
        self.assertFalse(self.user.is_anonymous)
        self.assertTrue(self.user.is_active)
        self.assertTrue(self.user.two_factor_enabled)

    def test_unique_email(self):
        with self.assertRaises(Exception):
            Utilisateur.objects.create(
                nom="Smith", prenom="Jane", email="john@example.com", password="pass"
            )

    @patch('Pixelette.models.send_mail')  # Changement de 'pixelette' à 'Pixelette'
    def test_signal_post_save_new_user(self, mock_send_mail):
        new_user = Utilisateur.objects.create(
            nom="New", prenom="User", email="new@example.com", password="pass", role='user'
        )
        mock_send_mail.assert_called_once()

    @patch('Pixelette.models.send_mail')  # Changement de 'pixelette' à 'Pixelette'
    def test_signal_role_change(self, mock_send_mail):
        self.user.role = 'artiste'
        self.user.save(update_fields=['role'])
        mock_send_mail.assert_called_once()

class OeuvreModelTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.oeuvre = Oeuvre.objects.create(titre="Test Oeuvre", auteur=self.user)

    def test_str_method(self):
        self.assertEqual(str(self.oeuvre), "Test Oeuvre")

    def test_default_vues(self):
        self.assertEqual(self.oeuvre.vues, 0)

class GalerieModelTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.galerie = Galerie.objects.create(nom="Test Galerie", proprietaire=self.user)

    def test_str_method(self):
        self.assertEqual(str(self.galerie), "Test Galerie")

    def test_add_oeuvre(self):
        oeuvre = Oeuvre.objects.create(titre="Oeuvre", auteur=self.user)
        self.galerie.oeuvres.add(oeuvre)
        self.assertEqual(self.galerie.oeuvres.count(), 1)

class GalerieInvitationModelTest(TestCase):
    def setUp(self):
        self.user1 = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.user2 = Utilisateur.objects.create(nom="Smith", prenom="Jane", email="jane@example.com", password="pass")
        self.galerie = Galerie.objects.create(nom="Galerie", proprietaire=self.user1)
        self.invitation = GalerieInvitation.objects.create(galerie=self.galerie, utilisateur=self.user2)

    def test_save_sets_expiration(self):
        self.assertTrue(self.invitation.date_expiration > timezone.now())

    def test_is_valid(self):
        self.assertTrue(self.invitation.is_valid())
        self.invitation.acceptee = True
        self.assertFalse(self.invitation.is_valid())

    def test_unique_together(self):
        with self.assertRaises(Exception):
            GalerieInvitation.objects.create(galerie=self.galerie, utilisateur=self.user2)

class InteractionModelTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.oeuvre = Oeuvre.objects.create(titre="Oeuvre", auteur=self.user)
        self.interaction = Interaction.objects.create(
            type="like", utilisateur=self.user, oeuvre=self.oeuvre
        )

    def test_unique_like(self):
        with self.assertRaises(Exception):
            Interaction.objects.create(type="like", utilisateur=self.user, oeuvre=self.oeuvre)

    def test_is_visible(self):
        self.assertTrue(self.interaction.is_visible())
        self.interaction.moderation_score = 0.9
        self.assertFalse(self.interaction.is_visible())

    def test_get_display_content(self):
        self.interaction.contenu = "Test"
        self.interaction.filtered_content = "Filtered"
        self.assertEqual(self.interaction.get_display_content(), "Filtered")

class SuiviModelTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="User", prenom="Normal", email="user@example.com", password="pass", role='user')
        self.artiste = Utilisateur.objects.create(nom="Artiste", prenom="Pro", email="artiste@example.com", password="pass", role='artiste')

    @patch('Pixelette.models.send_mail')  # Changement de 'pixelette' à 'Pixelette'
    def test_save_suivi(self, mock_send_mail):
        suivi = Suivi.objects.create(utilisateur=self.user, artiste=self.artiste)
        mock_send_mail.assert_called_once()

    def test_cannot_follow_self(self):
        with self.assertRaises(ValueError):
            Suivi.objects.create(utilisateur=self.user, artiste=self.user)

    def test_only_follow_artiste(self):
        non_artiste = Utilisateur.objects.create(nom="Non", prenom="Art", email="non@example.com", password="pass", role='user')
        with self.assertRaises(ValueError):
            Suivi.objects.create(utilisateur=self.user, artiste=non_artiste)

class DemandeRoleModelTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")

    @patch('Pixelette.models.send_mail')  # Changement de 'pixelette' à 'Pixelette'
    def test_signal_demande_save(self, mock_send_mail):
        DemandeRole.objects.create(utilisateur=self.user, nouveau_role='artiste')
        mock_send_mail.assert_called_once()