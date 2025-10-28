import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

django.setup()

from Pixelette.models import Utilisateur

email = 'taha.bellotef@esprit.tn'
try:
    u = Utilisateur.objects.get(email=email)
    u.is_two_factor_enabled = False
    u.two_factor_secret = None
    u.two_factor_temp_secret = None
    u.save(update_fields=['is_two_factor_enabled', 'two_factor_secret', 'two_factor_temp_secret'])
    print('Disabled 2FA for', email)
except Utilisateur.DoesNotExist:
    print('Admin user not found:', email)
