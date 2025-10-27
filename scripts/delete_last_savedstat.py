import os
import sys

# Ensure the project root is on sys.path so Django can import the project package
proj_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

# Ensure Django is configured
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
import django
django.setup()

from Pixelette.models import SavedStat

def main():
    s = SavedStat.objects.order_by('-created_at').first()
    if not s:
        print('No SavedStat found to delete')
        return
    print('Found SavedStat to delete:')
    print(' id:', s.id)
    print(' title:', s.title)
    print(' chart_type:', s.chart_type)
    print(' subject:', s.subject)
    print(' subject_field:', s.subject_field)
    confirm = os.getenv('CONFIRM_DELETE', '1')
    if confirm != '0':
        s.delete()
        print('Deleted')
    else:
        print('Skipping delete because CONFIRM_DELETE=0')

if __name__ == '__main__':
    main()
