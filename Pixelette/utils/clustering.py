from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from django.db.models import Q
from Pixelette.models import Galerie
from nltk.corpus import stopwords
import nltk
import re
from collections import Counter

# Télécharge les stop words si nécessaire (exécute une fois dans un shell : nltk.download('stopwords'))
try:
    french_stopwords = set(stopwords.words('french'))
except LookupError:
    nltk.download('stopwords')
    french_stopwords = set(stopwords.words('french'))

# Ajoute des stop words personnalisés si nécessaire
french_stopwords.update([
    'une', 'le', 'la', 'les', 'de', 'des', 'à', 'et', 'du', 'dans', 'sur', 'pour',
    'qui', 'que', 'dont', 'cette', 'ces', 'avec', 'par', 'sont', 'est', 'être',
    'avoir', 'fait', 'plus', 'tout', 'tous', 'toutes', 'aussi', 'très', 'bien',
    'comme', 'peut', 'faire', 'leur', 'leurs', 'son', 'ses', 'mon', 'mes'
])

# Templates pour générer des noms plus naturels
NAME_TEMPLATES = [
    "Collection {theme}",
    "Galerie {theme}",
    "Univers {theme}",
    "Exposition {theme}",
    "{theme}",
    "Œuvres {theme}",
    "Art {theme}",
    "Série {theme}",
]

# Expressions courantes et bigrammes à préserver
COMMON_PHRASES = {
    'noir blanc': 'Noir et Blanc',
    'noir et blanc': 'Noir et Blanc',
    'grande ville': 'Grandes Villes',
    'grandes villes': 'Grandes Villes',
    'vie urbaine': 'Vie Urbaine',
    'street art': 'Street Art',
    'coucher soleil': 'Couchers de Soleil',
    'lever soleil': 'Levers de Soleil',
    'animaux sauvages': 'Animaux Sauvages',
    'paysage montagneux': 'Paysages Montagneux',
    'paysage côtier': 'Paysages Côtiers',
    'architecture moderne': 'Architecture Moderne',
    'art contemporain': 'Art Contemporain',
}

# Catégories thématiques avec mots-clés associés
THEME_CATEGORIES = {
    'Portraits': ['portrait', 'visage', 'émotion', 'humain', 'expression'],
    'Paysages': ['paysage', 'montagne', 'océan', 'mer', 'nature', 'côte', 'vallée'],
    'Urbain': ['urbain', 'ville', 'gratte-ciel', 'métropole', 'architecture', 'bâtiment'],
    'Nature': ['flore', 'fleur', 'forêt', 'arbre', 'jardin', 'végétation'],
    'Animaux': ['animal', 'faune', 'sauvage', 'lion', 'éléphant', 'safari', 'zoo'],
    'Abstrait': ['abstrait', 'couleur', 'forme', 'lumière', 'éclat', 'vibrant'],
    'Noir et Blanc': ['noir', 'blanc', 'monochrome', 'contraste'],
    'Street Art': ['street', 'graffiti', 'mur', 'urbain'],
}

def detect_common_phrases(text):
    """Détecte les expressions courantes dans le texte."""
    text_lower = text.lower()
    for phrase, replacement in COMMON_PHRASES.items():
        if phrase in text_lower:
            return replacement
    return None

def categorize_by_keywords(words_list):
    """Catégorise le cluster selon les mots-clés présents."""
    words_set = set(words_list)
    category_scores = {}
    
    for category, keywords in THEME_CATEGORIES.items():
        score = sum(1 for keyword in keywords if keyword in words_set)
        if score > 0:
            category_scores[category] = score
    
    if category_scores:
        # Retourne la catégorie avec le score le plus élevé
        best_category = max(category_scores, key=category_scores.get)
        return best_category
    
    return None

def extract_theme_from_cluster(descriptions, vectorizer, cluster_idx):
    """
    Extrait un thème élégant et descriptif à partir des descriptions d'un cluster.
    """
    # Combine toutes les descriptions
    combined_text = ' '.join(descriptions)
    
    # Détecte d'abord les expressions courantes
    common_phrase = detect_common_phrases(combined_text)
    if common_phrase:
        template = NAME_TEMPLATES[cluster_idx % len(NAME_TEMPLATES)]
        return template.format(theme=common_phrase)
    
    # Nettoie le texte pour l'analyse
    cleaned_text = combined_text.lower()
    cleaned_text = re.sub(r'[^\w\s]', ' ', cleaned_text)
    
    # Extrait les mots significatifs (longueur >= 4)
    words = [w for w in cleaned_text.split() if w not in french_stopwords and len(w) >= 4]
    
    if not words:
        return f"Collection {cluster_idx + 1}"
    
    # Essaie d'abord une catégorisation thématique
    category = categorize_by_keywords(words)
    if category:
        template = NAME_TEMPLATES[cluster_idx % len(NAME_TEMPLATES)]
        return template.format(theme=category)
    
    # Sinon, compte les occurrences et prend le mot le plus fréquent
    word_counts = Counter(words)
    top_words = word_counts.most_common(5)
    
    # Filtre les mots très courts ou peu significatifs
    meaningful_words = [w for w, count in top_words if len(w) > 4]
    
    if meaningful_words:
        # Utilise le mot le plus significatif, au singulier si possible
        primary_word = meaningful_words[0].capitalize()
        
        # Pluralise certains mots pour plus de naturel
        if primary_word.endswith('e') and len(primary_word) > 5:
            primary_word = primary_word + 's'
        elif primary_word in ['Portrait', 'Paysage', 'Animal', 'Photo', 'Œuvre']:
            primary_word = primary_word + 's'
    else:
        # Prend le premier mot disponible
        primary_word = top_words[0][0].capitalize()
        if primary_word in ['Portrait', 'Paysage', 'Animal', 'Photo', 'Œuvre']:
            primary_word = primary_word + 's'
    
    # Applique un template varié
    template = NAME_TEMPLATES[cluster_idx % len(NAME_TEMPLATES)]
    cluster_name = template.format(theme=primary_word)
    
    return cluster_name


def cluster_galeries(num_clusters=5, only_public=True, user=None):
    """
    Clusterise les galeries basées sur leur description en utilisant TF-IDF.
    - num_clusters : Nombre de groupes.
    - only_public : Filtrer sur publiques.
    - user : Filtrer sur propriétaire (pour clusters personnels).
    """
    query = Q()
    if only_public:
        query &= Q(privee=False)
    if user:
        query &= Q(proprietaire=user)
    galeries = Galerie.objects.filter(query).exclude(description__exact='')

    if galeries.count() < 2:
        return {}

    num_clusters = min(num_clusters, galeries.count())  # Max clusters = nombre de galeries

    descriptions = [g.description for g in galeries]
    
    # Utilise TfidfVectorizer avec stop words en français
    vectorizer = TfidfVectorizer(
        stop_words=list(french_stopwords),
        max_features=100,
        ngram_range=(1, 2),  # Considère aussi les bigrammes
        min_df=1
    )
    embeddings = vectorizer.fit_transform(descriptions).toarray()

    kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
    kmeans.fit(embeddings)
    labels = kmeans.labels_

    clusters = {i: [] for i in range(num_clusters)}
    for idx, label in enumerate(labels):
        clusters[label].append(galeries[idx])

    # Génère des labels élégants basés sur l'analyse thématique
    cluster_labels = {}
    for label, group in clusters.items():
        if group:
            cluster_descriptions = [g.description for g in group]
            cluster_name = extract_theme_from_cluster(cluster_descriptions, vectorizer, label)
            cluster_labels[label] = cluster_name
        else:
            cluster_labels[label] = f"Collection {label + 1}"

    return {cluster_labels.get(k, f'Collection {k + 1}'): [g.id for g in v] for k, v in clusters.items()}