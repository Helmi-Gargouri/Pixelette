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

DEFAULT_STATS = [
    {
        'title': "Répartition des rôles utilisateurs",
        'chart_type': 'pie',
        'subject': 'utilisateur',
        'subject_field': 'role',
        'config': {}
    },
    {
        'title': "Nombre de galeries par utilisateur",
        'chart_type': 'bar',
        'subject': 'utilisateur',
        'subject_field': 'galeries__count',
        'config': {'label_field': 'nom'}
    },
    {
        'title': "Nombre d'oeuvres par galerie",
        'chart_type': 'bar',
        'subject': 'galerie',
        'subject_field': 'oeuvres__count',
        'config': {}
    },
    {
        'title': 'Inscription utilisateurs (par jour)',
        'chart_type': 'line',
        'subject': 'utilisateur',
        'subject_field': 'date_inscription__date',
        'config': {}
    },
    {
        'title': 'Galeries privées vs publiques',
        'chart_type': 'donut',
        'subject': 'galerie',
        'subject_field': 'privee',
        'config': {}
    },
    {
        'title': "Nombre d'oeuvres par auteur",
        'chart_type': 'bar',
        'subject': 'utilisateur',
        'subject_field': 'oeuvres__count',
        'config': {'label_field': 'nom'}
    },
    {
        'title': 'Galeries par thème',
        'chart_type': 'treemap',
        'subject': 'galerie',
        'subject_field': 'theme',
        'config': {}
    }
]


def main():
    admin = Utilisateur.objects.filter(role='admin').first()
    created = []
    skipped = []
    for s in DEFAULT_STATS:
        if SavedStat.objects.filter(title=s['title']).exists():
            skipped.append(s['title'])
            continue
        try:
            obj = SavedStat.objects.create(
                title=s['title'],
                chart_type=s['chart_type'],
                subject=s['subject'],
                subject_field=s['subject_field'],
                config=s.get('config') or {},
                created_by=admin
            )
            created.append((s['title'], obj.id))
        except Exception as e:
            skipped.append(f"{s['title']} (error: {e})")

    print('Created:')
    for t, id_ in created:
        print(f' - {t} (id={id_})')
    print('\nSkipped:')
    for t in skipped:
        print(f' - {t}')

if __name__ == '__main__':
    main()
