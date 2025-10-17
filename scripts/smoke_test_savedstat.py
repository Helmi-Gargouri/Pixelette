import os
import django
from django.contrib.auth.hashers import make_password

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
import sys

# Ensure the project root is on sys.path so the 'Pixelette' package can be imported
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

print('PROJECT_ROOT=', PROJECT_ROOT)

django.setup()

from Pixelette.models import Utilisateur, SavedStat
from django.db.models import Count

# Ensure an admin exists
admin = Utilisateur.objects.filter(role='admin').first()
if not admin:
    print('No admin found — creating temporary admin smoke-test@local')
    admin = Utilisateur.objects.create(
        nom='Smoke', prenom='Admin', email='smoke-test-admin@local',
        password=make_password('Testrun123!'), role='admin'
    )
    print('Created admin id=', admin.id, 'email=', admin.email)
else:
    print('Found admin id=', admin.id, 'email=', admin.email)

# Create a SavedStat for utilisateurs grouped by role
stat = SavedStat.objects.create(
    title='Smoke: Users by role',
    chart_type='pie',
    subject='utilisateur',
    subject_field='role',
    config={},
    created_by=admin
)
print('Created SavedStat id=', stat.id)

# Compute aggregation like the view does
qs = Utilisateur.objects.all()
agg = list(qs.values('role').annotate(count=Count('id')).order_by('-count'))
print('Aggregation:', agg)

print('Done')
