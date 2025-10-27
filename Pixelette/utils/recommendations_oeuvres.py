from django.db.models import Count, Q
from collections import defaultdict
from ..models import Interaction, Oeuvre, Suivi, Utilisateur

class OeuvreRecommendationEngine:
    """
    Moteur de recommandations d'œuvres basé sur :
    1. Filtrage collaboratif (utilisateurs similaires)
    2. Artistes suivis
    3. Likes et commentaires passés
    """
    
    def __init__(self, user):
        self.user = user
        self.recommendations = {}  # {oeuvre_id: score}
    
    def get_recommendations(self, limit=12):
        """Point d'entrée principal - Génère les recommandations"""
        
        # 1️⃣ Filtrage Collaboratif (50% - PRIORITÉ)
        collab_recs = self._collaborative_filtering()
        self._add_recommendations(collab_recs, weight=0.50)  # ✅ Augmenté
        
        # 2️⃣ Basé sur les Suivis (30%)
        suivis_recs = self._recommendations_from_followed_artists()
        self._add_recommendations(suivis_recs, weight=0.30)
        
        # 3️⃣ Basé sur Likes + Commentaires (20%)
        likes_recs = self._recommendations_from_interactions()
        self._add_recommendations(likes_recs, weight=0.20)  # ✅ Réduit
        
        # ✅ AJOUTER : Filtrer les scores trop faibles
        # Ne garder que les recommandations pertinentes (score >= 2.5)
        filtered_recommendations = {
            oeuvre_id: score 
            for oeuvre_id, score in self.recommendations.items() 
            if score >= 2.5  # Seuil minimum
        }
        
        # Trier par score et retourner
        sorted_recs = sorted(
            filtered_recommendations.items(),  # ✅ Utiliser filtered_recommendations
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        # Récupérer les objets Oeuvre
        oeuvre_ids = [oeuvre_id for oeuvre_id, score in sorted_recs]
        oeuvres = Oeuvre.objects.filter(id__in=oeuvre_ids).select_related('auteur')
        
        # Créer un dict pour maintenir l'ordre
        oeuvres_dict = {o.id: o for o in oeuvres}
        
        # Retourner dans l'ordre avec les scores
        result = []
        for oeuvre_id, score in sorted_recs:
            if oeuvre_id in oeuvres_dict:
                result.append({
                    'oeuvre': oeuvres_dict[oeuvre_id],
                    'score': round(score, 2)
                })
        
        return result
    
    def _collaborative_filtering(self):
        """
        1️⃣ Filtrage Collaboratif
        Trouve des utilisateurs similaires et recommande ce qu'ils ont aimé
        """
        # Œuvres likées par l'utilisateur actuel
        user_liked_oeuvres = set(
            Interaction.objects.filter(
                utilisateur=self.user,
                type='like'
            ).values_list('oeuvre_id', flat=True)
        )
        
        if not user_liked_oeuvres:
            return {}
        
        # Trouver les utilisateurs qui ont liké au moins 2 œuvres en commun
        similar_users = Interaction.objects.filter(
            oeuvre_id__in=user_liked_oeuvres,
            type='like'
        ).exclude(
            utilisateur=self.user
        ).values('utilisateur_id').annotate(
            common_likes=Count('id')
        ).filter(
            common_likes__gte=2  # Au moins 2 likes en commun
        ).order_by('-common_likes')[:10]  # Top 10 utilisateurs similaires
        
        similar_user_ids = [u['utilisateur_id'] for u in similar_users]
        
        if not similar_user_ids:
            return {}
        
        # Œuvres aimées par ces utilisateurs similaires
        recommended_oeuvres = Interaction.objects.filter(
            utilisateur_id__in=similar_user_ids,
            type='like'
        ).exclude(
            oeuvre_id__in=user_liked_oeuvres  # Exclure déjà aimées
        ).values('oeuvre_id').annotate(
            popularity_score=Count('id')  # Combien d'utilisateurs similaires l'ont aimée
        ).order_by('-popularity_score')
        
        # Convertir en dict {oeuvre_id: score normalisé 0-10}
        recommendations = {}
        max_score = recommended_oeuvres[0]['popularity_score'] if recommended_oeuvres else 1
        
        for rec in recommended_oeuvres[:20]:  # Limiter à 20
            normalized_score = (rec['popularity_score'] / max_score) * 10
            recommendations[rec['oeuvre_id']] = normalized_score
        
        return recommendations
    
    def _recommendations_from_followed_artists(self):
        """
        2️⃣ Basé sur les Suivis
        Recommande les nouvelles œuvres des artistes suivis
        """
        # Artistes suivis
        followed_artists = Suivi.objects.filter(
            utilisateur=self.user
        ).values_list('artiste_id', flat=True)
        
        if not followed_artists:
            return {}
        
        # Œuvres déjà vues (likées ou commentées)
        viewed_oeuvres = set(
            Interaction.objects.filter(
                utilisateur=self.user
            ).values_list('oeuvre_id', flat=True)
        )
        
        # Nouvelles œuvres des artistes suivis
        new_oeuvres = Oeuvre.objects.filter(
            auteur_id__in=followed_artists
        ).exclude(
            id__in=viewed_oeuvres
        ).order_by('-date_creation')[:20]
        
        # Score basé sur la récence (plus récent = meilleur score)
        recommendations = {}
        for idx, oeuvre in enumerate(new_oeuvres):
            # Score décroissant : 10 pour le plus récent, diminue progressivement
            score = 10 - (idx * 0.3)
            recommendations[oeuvre.id] = max(score, 5)  # Minimum 5
        
        return recommendations
    
    def _recommendations_from_interactions(self):
        """
        3️⃣ Basé sur Likes + Commentaires
        Recommande d'autres œuvres des artistes qu'on a aimés/commentés
        """
        # Récupérer les œuvres avec lesquelles l'utilisateur a interagi
        interacted_oeuvres = Interaction.objects.filter(
            utilisateur=self.user,
            type__in=['like', 'commentaire']
        ).select_related('oeuvre').values_list('oeuvre_id', 'oeuvre__auteur_id')
        
        if not interacted_oeuvres:
            return {}
        
        # Extraire les IDs
        interacted_oeuvre_ids = set([o[0] for o in interacted_oeuvres])
        preferred_author_ids = [o[1] for o in interacted_oeuvres]
        
        # Compter les interactions par auteur
        author_interaction_count = defaultdict(int)
        for _, author_id in interacted_oeuvres:
            author_interaction_count[author_id] += 1
        
        # Trier par nombre d'interactions
        sorted_authors = sorted(
            author_interaction_count.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]  # Top 10 artistes préférés
        
        top_author_ids = [author_id for author_id, _ in sorted_authors]
        
        # Autres œuvres de ces artistes
        similar_oeuvres = Oeuvre.objects.filter(
            auteur_id__in=top_author_ids
        ).exclude(
            id__in=interacted_oeuvre_ids
        ).order_by('-date_creation')[:20]
        
        # Score basé sur la popularité de l'artiste pour l'utilisateur
        recommendations = {}
        for oeuvre in similar_oeuvres:
            # Score basé sur combien l'utilisateur a interagi avec cet artiste
            author_score = author_interaction_count.get(oeuvre.auteur_id, 1)
            max_author_score = max(author_interaction_count.values())
            normalized_score = (author_score / max_author_score) * 10
            recommendations[oeuvre.id] = normalized_score
        
        return recommendations
    
    def _add_recommendations(self, new_recs, weight):
        """
        Ajoute des recommandations avec un poids spécifique
        """
        for oeuvre_id, score in new_recs.items():
            weighted_score = score * weight
            if oeuvre_id in self.recommendations:
                self.recommendations[oeuvre_id] += weighted_score
            else:
                self.recommendations[oeuvre_id] = weighted_score


def get_recommendations_for_user(user, limit=12):
    """
    Fonction helper pour obtenir les recommandations
    """
    try:
        engine = OeuvreRecommendationEngine(user)
        return engine.get_recommendations(limit=limit)
    except Exception as e:
        print(f"❌ Erreur recommandations: {str(e)}")
        import traceback
        traceback.print_exc()
        return []