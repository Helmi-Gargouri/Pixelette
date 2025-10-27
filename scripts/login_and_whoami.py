import os, sys
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# We won't import Django models here; we'll use direct HTTP to exercise the login flow + session
BASE = 'http://127.0.0.1:8000'

s = requests.Session()
login_url = BASE + '/api/utilisateurs/login/'
whoami_url = BASE + '/api/whoami/'

payload = {'email': 'taha.bellotef@esprit.tn', 'password': 'Taha123@'}
print('Posting login to', login_url)
r = s.post(login_url, json=payload)
print('login status', r.status_code, r.text)

print('Calling whoami')
r2 = s.get(whoami_url)
print('whoami status', r2.status_code, r2.text)
