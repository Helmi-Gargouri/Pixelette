from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch
from django.utils import timezone
from datetime import timedelta  # Ajout pour timedelta
from django.contrib.auth.hashers import make_password
try:
    from Pixelette.models import Utilisateur, TempAuthStorage
    from Pixelette.views import UtilisateurViewSet, TempAuthStorageView, generate_ai_text  # Ajout de generate_ai_text
except ImportError as e:
    print(f"Erreur d'importation: {e}")
    raise
import pyotp

class UtilisateurViewSetTest(APITestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(
            nom="Doe", prenom="John", email="john@example.com",
            password=make_password("password123")
        )
        self.admin = Utilisateur.objects.create(
            nom="Admin", prenom="Admin", email="admin@example.com",
            password=make_password("adminpass"), role='admin'
        )

    @patch('Pixelette.views.get_or_create_token')
    def test_login_success(self, mock_token):
        mock_token.return_value = "fake_token"
        data = {"email": "john@example.com", "password": "password123"}
        response = self.client.post('/api/utilisateurs/login/', data, format='json')  # Utilisez self.client pour session/auth
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_invalid_password(self):
        data = {"email": "john@example.com", "password": "wrong"}
        response = self.client.post('/api/utilisateurs/login/', data, format='json')  # Utilisez self.client
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('Pixelette.views.pyotp.TOTP.verify')
    @patch('Pixelette.views.get_or_create_token')
    def test_verify_2fa(self, mock_token, mock_verify):
        mock_verify.return_value = True
        mock_token.return_value = "fake_token"
        self.user.two_factor_secret = pyotp.random_base32()
        self.user.save()
        data = {"email": "john@example.com", "token": "123456"}
        response = self.client.post('/api/utilisateurs/verify_2fa/', data, format='json')  # Utilisez self.client
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_count_users(self):
        response = self.client.get('/api/utilisateurs/count/')  # Utilisez self.client pour session/auth
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_assign_role_as_admin(self):
        # Simulez une session admin
        self.client.force_authenticate(user=self.admin)  # Force l'authentification pour simuler la session
        data = {'role': 'artiste'}
        response = self.client.patch(f'/api/utilisateurs/{self.user.id}/assign_role/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, 'artiste')

    @patch('Pixelette.views.send_mail')
    def test_forgot_password(self, mock_send_mail):
        data = {"email": "john@example.com"}
        response = self.client.post('/api/utilisateurs/forgot_password/', data, format='json')  # Utilisez self.client
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_mail.assert_called_once()

class TempAuthStorageViewTest(APITestCase):
    def test_post_temp_auth(self):
        data = {"token": "temp_token", "user": {"email": "temp@example.com"}}
        response = self.client.post('/api/auth/store_temp/', data, format='json')  # Utilisez format='json' pour nested data
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('temp_id', response.data)

    def test_get_temp_auth(self):
        temp_auth = TempAuthStorage.objects.create(token="token", user_data={})
        response = self.client.get(f'/api/auth/get_temp/{temp_auth.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_get_expired(self):
        temp_auth = TempAuthStorage.objects.create(
            token="token", user_data={}, expires_at=timezone.now() - timedelta(minutes=1)
        )
        response = self.client.get(f'/api/auth/get_temp/{temp_auth.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class GenerateAITextTest(TestCase):
    @patch('Pixelette.views.requests.post')
    def test_generate_ai_text_openai(self, mock_post):
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            'choices': [{'message': {'content': 'Generated text'}}]
        }
        result = generate_ai_text("Test prompt")
        self.assertEqual(result, "Generated text")