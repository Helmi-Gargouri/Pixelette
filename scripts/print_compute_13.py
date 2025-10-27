import os, sys, json
proj_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
import django
django.setup()

from django.test import Client

client = Client(HTTP_HOST='localhost')
# Find an admin user and set session['user_id'] so IsAdminOrSession accepts the request
from Pixelette.models import Utilisateur
admin = Utilisateur.objects.filter(role='admin').first()
if admin:
    session = client.session
    session['user_id'] = admin.id
    session.save()

resp = client.get('/api/saved-stats/13/compute/')
print('status', resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print('failed to parse json', e)
