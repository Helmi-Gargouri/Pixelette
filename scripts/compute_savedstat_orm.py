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
import datetime

from django.db.models import Count
from Pixelette.models import SavedStat, Utilisateur, Oeuvre, Galerie

IDs = [14,15,16,17,18,19]

mapping = {
    'utilisateur': Utilisateur,
    'oeuvre': Oeuvre,
    'galerie': Galerie,
}


def resolve_attr(obj, attr_path):
    parts = attr_path.split('__') if attr_path else []
    cur = obj
    for p in parts:
        if cur is None:
            return None
        if isinstance(cur, dict):
            cur = cur.get(p)
            continue
        cur = getattr(cur, p, None)
    return cur


def compute(stat):
    Model = mapping.get(stat.subject)
    if not Model:
        return {'error': 'unsupported subject'}
    field = stat.subject_field
    import re
    if not re.match(r'^[\w]+(?:__[\w]+)*$', field):
        return {'error': 'invalid field'}
    qs = Model.objects.all()
    cfg = stat.config or {}
    filters = {}
    for k, v in (cfg.get('filters') or {}).items():
        if re.match(r'^[\w]+$', k):
            filters[k] = v
    if filters:
        qs = qs.filter(**filters)
    label_field = cfg.get('label_field')
    if field.endswith('__count'):
        rel = field[:-7]
        try:
            aggregation_qs = qs.annotate(_count=Count(rel)).order_by('-_count')[:20]
        except Exception as e:
            return {'error': 'invalid relation for __count', 'detail': str(e)}
        labels = []
        values = []
        for obj in aggregation_qs:
            if label_field:
                val = resolve_attr(obj, label_field)
                if val is None:
                    val = str(obj)
            else:
                val = str(obj)
            labels.append(str(val))
            values.append(int(getattr(obj, '_count', 0) or 0))
        return {'labels': labels, 'values': values}
    # otherwise values()
    aggregation = qs.values(field).annotate(count=Count('id')).order_by('-count')[:500]

    # Calendar mode support (return list of date/value points)
    if cfg.get('calendar') and field.endswith('__date'):
        counts = {}
        for row in aggregation:
            k = row.get(field)
            if isinstance(k, (str,)):
                date_str = k
            elif hasattr(k, 'strftime'):
                date_str = k.strftime('%Y-%m-%d')
            else:
                date_str = str(k)
            counts[date_str] = int(row.get('count', 0))

        if not counts:
            return {'points': []}

        min_date = min(datetime.datetime.fromisoformat(d).date() for d in counts.keys())
        max_date = max(datetime.datetime.fromisoformat(d).date() for d in counts.keys())
        cur = min_date
        points = []
        while cur <= max_date:
            ds = cur.strftime('%Y-%m-%d')
            points.append({'date': ds, 'value': counts.get(ds, 0)})
            cur += datetime.timedelta(days=1)

        return {'points': points}

    labels = []
    values = []
    for row in aggregation:
        if label_field:
            val = row.get(label_field)
            if val is None:
                val = row.get(field)
        else:
            val = row.get(field)
        label = val if val is not None else 'None'
        labels.append(str(label))
        values.append(int(row.get('count', 0)))
    return {'labels': labels, 'values': values}


if __name__ == '__main__':
    for sid in IDs:
        try:
            stat = SavedStat.objects.get(id=sid)
        except SavedStat.DoesNotExist:
            print(f"SavedStat {sid} not found")
            continue
        print(f"--- SavedStat {sid}: {stat.title} ({stat.chart_type})")
        out = compute(stat)
        print(json.dumps(out, ensure_ascii=False, indent=2))

