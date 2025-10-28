from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework import status
from unittest.mock import patch
from Pixelette.authentication import UtilisateurTokenAuthentication, UtilisateurSessionAuthentication
from Pixelette.token_adapter import get_or_create_token, get_utilisateur_from_token
from Pixelette.models import Utilisateur
from rest_framework.authtoken.models import Token as DRFToken
from django.contrib.auth.models import User as DjangoUser

class TokenAdapterTest(TestCase):
    def setUp(self):
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")

    def test_get_or_create_token(self):
        token = get_or_create_token(self.user)
        self.assertIsNotNone(token)
        self.assertEqual(len(token), 40)  # Longueur standard d'un token DRF

    def test_get_utilisateur_from_token(self):
        token = get_or_create_token(self.user)
        retrieved_user = get_utilisateur_from_token(token)
        self.assertEqual(retrieved_user.id, self.user.id)

    def test_get_utilisateur_from_invalid_token(self):
        retrieved_user = get_utilisateur_from_token("invalid_token")
        self.assertIsNone(retrieved_user)

class UtilisateurTokenAuthenticationTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")
        self.token = get_or_create_token(self.user)

    def test_authenticate_with_valid_token(self):
        request = self.factory.get('/', HTTP_AUTHORIZATION=f'Token {self.token}')
        authenticator = UtilisateurTokenAuthentication()
        user, auth = authenticator.authenticate(request)
        self.assertEqual(user.id, self.user.id)
        self.assertEqual(auth, self.token)

    def test_authenticate_with_invalid_token(self):
        request = self.factory.get('/', HTTP_AUTHORIZATION='Token invalid')
        authenticator = UtilisateurTokenAuthentication()
        with self.assertRaises(Exception):
            authenticator.authenticate(request)

    def test_authenticate_without_header(self):
        request = self.factory.get('/')
        authenticator = UtilisateurTokenAuthentication()
        self.assertIsNone(authenticator.authenticate(request))

class UtilisateurSessionAuthenticationTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = Utilisateur.objects.create(nom="Doe", prenom="John", email="john@example.com", password="pass")

    def test_authenticate_with_session(self):
        request = self.factory.get('/')
        request.session = {'user_id': self.user.id}  # Simulez la session
        authenticator = UtilisateurSessionAuthentication()
        user, _ = authenticator.authenticate(request)
        self.assertEqual(user.id, self.user.id)

    def test_authenticate_without_session(self):
        request = self.factory.get('/')
        request.session = {}
        authenticator = UtilisateurSessionAuthentication()
        self.assertIsNone(authenticator.authenticate(request))

    def test_authenticate_with_invalid_session(self):
        request = self.factory.get('/')
        request.session = {'user_id': 999}  # ID invalid
        authenticator = UtilisateurSessionAuthentication()
        self.assertIsNone(authenticator.authenticate(request))