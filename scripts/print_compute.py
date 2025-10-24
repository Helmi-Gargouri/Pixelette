import os
import sys
import json

# Setup project path
proj_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
import django
django.setup()

from django.test import Client
from Pixelette.models import Utilisateur
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('ids', nargs='+', help='SavedStat id(s) to compute', type=int)
args = parser.parse_args()

admin = Utilisateur.objects.filter(role='admin').first()
if not admin:
    print('No admin user found in DB; cannot set session. Create an admin user first.')
    sys.exit(1)

c = Client()
# Set session to simulate admin session
session = c.session
session['user_id'] = admin.id
session.save()

for sid in args.ids:
    resp = c.get(f'/api/saved-stats/{sid}/compute/')
    try:
        data = resp.json()
    except Exception:
        data = {'status_code': resp.status_code, 'content': resp.content.decode('utf-8')}
    print(f"SavedStat {sid} -> status={resp.status_code}")
    print(json.dumps(data, ensure_ascii=False, indent=2))
    print('-' * 60)
