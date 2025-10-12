from PIL import Image
import io
import numpy as np
from sklearn.cluster import KMeans
from colorsys import rgb_to_hsv
from django.core.files.base import ContentFile
from Pixelette.models import Oeuvre

def extract_dominant_colors(image_path, num_colors=5):
    """
    Extrait les num_colors dominantes d'une image.
    Retourne une liste de dicts : [{'hex': '#RRGGBB', 'rgb': (r,g,b), 'percent': 0.2}, ...]
    """
    try:
        img = Image.open(image_path)
        img = img.convert('RGB').resize((100, 100))  # Redimensionne pour performance
        data = np.array(img)
        data = data.reshape((-1, 3))

        kmeans = KMeans(n_clusters=num_colors, random_state=42)
        kmeans.fit(data)
        colors = kmeans.cluster_centers_.astype(int)

        # Calcule les pourcentages
        labels = kmeans.labels_
        color_counts = np.bincount(labels)
        percentages = color_counts / len(labels)

        dominant_colors = []
        for i, color in enumerate(colors):
            hex_color = '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2])
            dominant_colors.append({
                'hex': hex_color,
                'rgb': tuple(color),
                'percent': float(percentages[i])
            })
        return sorted(dominant_colors, key=lambda x: x['percent'], reverse=True)
    except Exception as e:
        return [{'hex': '#FFFFFF', 'rgb': (255,255,255), 'percent': 1.0}]  # Fallback blanc

def suggest_harmonies(primary_color_hex):
    """
    Sugère des harmonies basées sur la couleur principale (première de la palette).
    Retourne un dict avec 'analogique', 'complementaire', 'triadique' (listes de hex).
    """
    # Convertit hex en RGB
    hex_to_rgb = lambda h: tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
    rgb = hex_to_rgb(primary_color_hex)

    # Convertit en HSV pour calculs
    h, s, v = rgb_to_hsv(*[c/255.0 for c in rgb])
    h = h * 360  # Hue en degrés

    # Analogique : ±30°
    analog1_h = (h + 30) % 360
    analog2_h = (h - 30) % 360
    def hsv_to_hex(hue, sat, val):
        r, g, b = [int(255 * x) for x in hsv_to_rgb(hue/360, sat, val)]
        return '#{:02x}{:02x}{:02x}'.format(r, g, b)

    # Harmonies
    harmonies = {
        'analogique': [
            primary_color_hex,
            hsv_to_hex(analog1_h, s, v),
            hsv_to_hex(analog2_h, s, v)
        ],
        'complementaire': [
            primary_color_hex,
            hsv_to_hex((h + 180) % 360, s, v)
        ],
        'triadique': [
            primary_color_hex,
            hsv_to_hex((h + 120) % 360, s, v),
            hsv_to_hex((h + 240) % 360, s, v)
        ]
    }
    return harmonies

def analyze_galerie_palette(galerie_id):
    """
    Analyse la palette d'une galerie entière (toutes les œuvres).
    Agrège les couleurs dominantes de toutes les images.
    """
    galerie = Galerie.objects.get(id=galerie_id)
    oeuvres = Oeuvre.objects.filter(galeries_associees=galerie)  # Via ManyToMany

    all_colors = []
    for oeuvre in oeuvres:
        if oeuvre.image:
            colors = extract_dominant_colors(oeuvre.image.path)
            all_colors.extend(colors)

    if not all_colors:
        return {'colors': [], 'harmonies': {}}

    # Agrège : moyenne pondérée des couleurs
    unique_colors = {}
    for color in all_colors:
        key = color['hex']
        if key in unique_colors:
            unique_colors[key]['percent'] += color['percent']
        else:
            unique_colors[key] = color

    # Normalise les pourcentages
    total_percent = sum(c['percent'] for c in unique_colors.values())
    for color in unique_colors.values():
        color['percent'] /= total_percent

    top_colors = sorted(unique_colors.values(), key=lambda x: x['percent'], reverse=True)[:5]

    primary_hex = top_colors[0]['hex'] if top_colors else '#FFFFFF'
    harmonies = suggest_harmonies(primary_hex)

    return {
        'dominant_colors': top_colors,
        'harmonies': harmonies,
        'primary_color': primary_hex
    }