import os
import sys

# Ensure project root is on path
proj_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
import django
django.setup()

from Pixelette.models import SavedStat, Utilisateur

def main():
    # try to find an admin user to set as creator
    admin = Utilisateur.objects.filter(role='admin').first()
    s = SavedStat.objects.create(
        title='Nombre de galeries par utilisateur',
        chart_type='bar',
        subject='utilisateur',
        subject_field='galeries__count',
        config={},
        created_by=admin
    )
    print('Created SavedStat id=', s.id)

if __name__ == '__main__':
    main()
