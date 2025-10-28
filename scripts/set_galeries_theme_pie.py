import os
import sys

proj_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
import django
django.setup()

from Pixelette.models import SavedStat

try:
    s = SavedStat.objects.get(title='Galeries par thème')
    print('Found:', s.id, s.chart_type)
    s.chart_type = 'pie'
    s.save()
    print('Updated to pie')
except SavedStat.DoesNotExist:
    print('SavedStat "Galeries par thème" not found')
except Exception as e:
    print('Error:', e)
