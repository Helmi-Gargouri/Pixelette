import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Pixelette.settings')
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__)) + "\.."
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

django.setup()

from Pixelette.models import SavedStat

print('Listing all SavedStat entries:')
all_stats = SavedStat.objects.all()
if not all_stats:
    print('  (none)')

to_delete = []
for s in all_stats:
    print(f'  id={s.id} title={s.title!r} subject={s.subject!r} subject_field={s.subject_field!r} config={s.config!r}')
    # mark for deletion if subject_field == 'theme' (invalid for Oeuvre model)
    if s.subject_field == 'theme':
        to_delete.append(s.id)

if not to_delete:
    print('\nNo SavedStat with subject_field=="theme" found. Nothing to delete.')
else:
    print('\nWill delete SavedStat ids:', to_delete)
    for sid in to_delete:
        try:
            SavedStat.objects.filter(id=sid).delete()
            print('  Deleted id=', sid)
        except Exception as e:
            print('  Failed to delete', sid, '->', e)

print('\nDone')
