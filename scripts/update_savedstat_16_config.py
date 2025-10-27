import os
import sys

proj_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if proj_root not in sys.path:
    sys.path.insert(0, proj_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
import django
django.setup()

from Pixelette.models import SavedStat


def main():
    try:
        s = SavedStat.objects.get(id=16)
    except SavedStat.DoesNotExist:
        print('SavedStat id=16 not found')
        return
    cfg = s.config or {}
    cfg['calendar'] = True
    s.config = cfg
    s.save()
    print('Updated SavedStat id=16 config ->', s.config)

if __name__ == '__main__':
    main()
