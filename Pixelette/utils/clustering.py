from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from django.db.models import Q
from Pixelette.models import Galerie
from nltk.corpus import stopwords
import nltk

# Télécharge les stop words si nécessaire (exécute une fois dans un shell : nltk.download('stopwords'))
try:
    french_stopwords = set(stopwords.words('french'))
except LookupError:
    nltk.download('stopwords')
    french_stopwords = set(stopwords.words('french'))

# Ajoute des stop words personnalisés si nécessaire
french_stopwords.update(['une', 'le', 'la', 'les', 'de', 'des', 'à', 'et', 'du', 'dans', 'sur', 'pour'])

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
    vectorizer = TfidfVectorizer(stop_words=list(french_stopwords))
    embeddings = vectorizer.fit_transform(descriptions).toarray()

    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(embeddings)
    labels = kmeans.labels_

    clusters = {i: [] for i in range(num_clusters)}
    for idx, label in enumerate(labels):
        clusters[label].append(galeries[idx])

    # Génère des labels basés sur les mots les plus significatifs
    cluster_labels = {}
    feature_names = vectorizer.get_feature_names_out()
    for label, group in clusters.items():
        if group:
            # Combine les descriptions du cluster
            all_text = ' '.join([g.description for g in group]).lower()
            words = [w for w in all_text.split() if w not in french_stopwords and len(w) > 3]
            # Compte les mots et prend les plus fréquents
            word_counts = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
            common_words = sorted(word_counts, key=word_counts.get, reverse=True)[:3]
            cluster_labels[label] = ' '.join(common_words).title() or f'Cluster {label}'

    return {cluster_labels.get(k, f'Cluster {k}'): [g.id for g in v] for k, v in clusters.items()}