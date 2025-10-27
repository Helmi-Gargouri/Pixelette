
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count

def calculer_score_artiste(user):
    """
    Calcule le score de probabilité qu'un utilisateur devienne artiste (0-100)
    Basé sur 6 critères pondérés et mesurables
    
    CRITÈRES:
    1. Artistes Suivis (25 points)
    2. Consultations d'Œuvres (25 points)
    3. Contacts avec Artistes (20 points)
    4. Photo de Profil (15 points)
    5. Authentification 2FA (10 points)
    6. Profil Complet (5 points)
    """
    from ..models import Suivi, ConsultationOeuvre, ContactArtiste
    
    score = 0
    details = {}
    now = timezone.now()
    
    # ========================================
    # 1. ARTISTES SUIVIS (0-25 points)
    # ========================================
    artistes_suivis = Suivi.objects.filter(utilisateur=user).count()
    
    if artistes_suivis >= 20:
        score_suivis = 25
    elif artistes_suivis >= 15:
        score_suivis = 22
    elif artistes_suivis >= 10:
        score_suivis = 18
    elif artistes_suivis >= 5:
        score_suivis = 12
    elif artistes_suivis > 0:
        score_suivis = artistes_suivis * 2  # 2 points par artiste
    else:
        score_suivis = 0
    
    score += score_suivis
    details['artistes_suivis'] = {
        'valeur': artistes_suivis,
        'score': round(score_suivis, 1),
        'max': 25,
        'label': 'Artistes Suivis'
    }
    
    # ========================================
    # 2. CONSULTATIONS D'ŒUVRES (0-25 points)
    # ========================================
    consultations = ConsultationOeuvre.objects.filter(utilisateur=user).count()
    
    if consultations >= 100:
        score_consultations = 25
    elif consultations >= 75:
        score_consultations = 22
    elif consultations >= 50:
        score_consultations = 18
    elif consultations >= 30:
        score_consultations = 14
    elif consultations >= 15:
        score_consultations = 10
    elif consultations >= 5:
        score_consultations = 5
    else:
        score_consultations = min(consultations, 5)  # Max 5 points si < 5 consultations
    
    score += score_consultations
    details['consultations_oeuvres'] = {
        'valeur': consultations,
        'score': round(score_consultations, 1),
        'max': 25,
        'label': 'Consultations d\'Œuvres'
    }
    
    # ========================================
    # 3. CONTACTS ARTISTES (0-20 points)
    # ========================================
    contacts = ContactArtiste.objects.filter(utilisateur=user).count()
    
    if contacts >= 10:
        score_contacts = 20
    elif contacts >= 7:
        score_contacts = 17
    elif contacts >= 5:
        score_contacts = 14
    elif contacts >= 3:
        score_contacts = 10
    elif contacts >= 1:
        score_contacts = 5
    else:
        score_contacts = 0
    
    score += score_contacts
    details['contacts_artistes'] = {
        'valeur': contacts,
        'score': round(score_contacts, 1),
        'max': 20,
        'label': 'Contacts avec Artistes'
    }
    
    # ========================================
    # 4. PHOTO DE PROFIL (0-15 points)
    # ========================================
    score_photo = 15 if user.image else 0
    score += score_photo
    details['photo_profil'] = {
        'valeur': bool(user.image),
        'score': score_photo,
        'max': 15,
        'label': 'Photo de Profil'
    }
    
    # ========================================
    # 5. 2FA ACTIVÉ (0-10 points)
    # ========================================
    score_2fa = 10 if user.is_two_factor_enabled else 0
    score += score_2fa
    details['deux_facteurs'] = {
        'valeur': user.is_two_factor_enabled,
        'score': score_2fa,
        'max': 10,
        'label': 'Authentification 2FA'
    }
    
    # ========================================
    # 6. PROFIL COMPLET (0-5 points)
    # ========================================
    completude = 0
    champs_requis = 5  # nom, prenom, email, image, telephone
    
    if user.nom:
        completude += 1
    if user.prenom:
        completude += 1
    if user.email:
        completude += 1
    if user.image:
        completude += 1
    if user.telephone:
        completude += 1
    
    pourcentage_completude = (completude / champs_requis * 100) if champs_requis > 0 else 0
    
    if pourcentage_completude == 100:
        score_profil = 5
    elif pourcentage_completude >= 80:
        score_profil = 4
    elif pourcentage_completude >= 60:
        score_profil = 3
    elif pourcentage_completude >= 40:
        score_profil = 2
    else:
        score_profil = 1
    
    score += score_profil
    details['profil_complet'] = {
        'valeur': f"{int(pourcentage_completude)}%",
        'champs_remplis': f"{completude}/{champs_requis}",
        'score': round(score_profil, 1),
        'max': 5,
        'label': 'Profil Complet'
    }
    
    # ========================================
    # SCORE FINAL (maximum 100)
    # ========================================
    score_final = min(100, round(score))
    
    # Catégoriser
    if score_final >= 80:
        categorie = "🌟 Très Probable"
        badge = "futur_artiste"
        message = "Excellent profil ! Vous avez toutes les qualités d'un artiste. Pourquoi ne pas franchir le pas ?"
    elif score_final >= 60:
        categorie = "🎨 Probable"
        badge = "potentiel_artiste"
        message = "Vous êtes très engagé ! Continuez à explorer et vous pourrez devenir artiste bientôt."
    elif score_final >= 40:
        categorie = "💡 Potentiel"
        badge = None
        message = "Vous montrez de l'intérêt pour l'art. Explorez davantage pour progresser !"
    else:
        categorie = "👤 Débutant"
        badge = None
        message = "Bienvenue ! Prenez le temps de découvrir nos artistes et la communauté."
    
    return {
        'score': score_final,
        'categorie': categorie,
        'badge': badge,
        'message': message,
        'details': details,
        'max_possible': 100
    }


def calculer_suggestions_amelioration(user, score_data):
    """
    Génère des suggestions personnalisées pour améliorer le score
    """
    suggestions = []
    details = score_data['details']
    
    # Suggestion 1: Suivre plus d'artistes (PRIORITÉ HAUTE)
    if details['artistes_suivis']['score'] < 18:
        if details['artistes_suivis']['valeur'] < 5:
            artistes_manquants = 5 - details['artistes_suivis']['valeur']
            points_gagnables = 12 - details['artistes_suivis']['score']
            suggestions.append({
                'action': 'Suivez plus d\'artistes',
                'description': f"Suivez {artistes_manquants} artiste(s) de plus pour atteindre 5",
                'points': f"+{points_gagnables} points",
                'priorite': 'haute',
                'icon': '👥'
            })
        elif details['artistes_suivis']['valeur'] < 10:
            artistes_manquants = 10 - details['artistes_suivis']['valeur']
            points_gagnables = 18 - details['artistes_suivis']['score']
            suggestions.append({
                'action': 'Suivez encore plus d\'artistes',
                'description': f"Suivez {artistes_manquants} artiste(s) de plus pour atteindre 10",
                'points': f"+{points_gagnables} points",
                'priorite': 'haute',
                'icon': '👥'
            })
        elif details['artistes_suivis']['valeur'] < 20:
            artistes_manquants = 20 - details['artistes_suivis']['valeur']
            points_gagnables = 25 - details['artistes_suivis']['score']
            suggestions.append({
                'action': 'Devenez un super-suiveur',
                'description': f"Suivez {artistes_manquants} artiste(s) de plus pour le score maximum",
                'points': f"+{points_gagnables} points",
                'priorite': 'moyenne',
                'icon': '👥'
            })
    
    # Suggestion 2: Consulter plus d'œuvres (PRIORITÉ HAUTE)
    if details['consultations_oeuvres']['score'] < 18:
        if details['consultations_oeuvres']['valeur'] < 15:
            oeuvres_manquantes = 15 - details['consultations_oeuvres']['valeur']
            points_gagnables = 10 - details['consultations_oeuvres']['score']
            suggestions.append({
                'action': 'Explorez plus d\'œuvres',
                'description': f"Consultez {oeuvres_manquantes} œuvre(s) supplémentaire(s)",
                'points': f"+{points_gagnables} points",
                'priorite': 'haute',
                'icon': '🖼️'
            })
        elif details['consultations_oeuvres']['valeur'] < 50:
            oeuvres_manquantes = 50 - details['consultations_oeuvres']['valeur']
            points_gagnables = 18 - details['consultations_oeuvres']['score']
            suggestions.append({
                'action': 'Découvrez encore plus d\'art',
                'description': f"Consultez {oeuvres_manquantes} œuvre(s) de plus pour atteindre 50",
                'points': f"+{points_gagnables} points",
                'priorite': 'moyenne',
                'icon': '🖼️'
            })
        elif details['consultations_oeuvres']['valeur'] < 100:
            oeuvres_manquantes = 100 - details['consultations_oeuvres']['valeur']
            points_gagnables = 25 - details['consultations_oeuvres']['score']
            suggestions.append({
                'action': 'Devenez un expert',
                'description': f"Consultez {oeuvres_manquantes} œuvre(s) de plus pour le score maximum",
                'points': f"+{points_gagnables} points",
                'priorite': 'basse',
                'icon': '🖼️'
            })
    
    # Suggestion 3: Contacter des artistes (PRIORITÉ MOYENNE)
    if details['contacts_artistes']['score'] < 14:
        if details['contacts_artistes']['valeur'] < 1:
            suggestions.append({
                'action': 'Contactez votre premier artiste',
                'description': "Envoyez un message à un artiste qui vous inspire",
                'points': "+5 points",
                'priorite': 'moyenne',
                'icon': '💬'
            })
        elif details['contacts_artistes']['valeur'] < 3:
            contacts_manquants = 3 - details['contacts_artistes']['valeur']
            points_gagnables = 10 - details['contacts_artistes']['score']
            suggestions.append({
                'action': 'Échangez avec plus d\'artistes',
                'description': f"Contactez {contacts_manquants} artiste(s) de plus",
                'points': f"+{points_gagnables} points",
                'priorite': 'moyenne',
                'icon': '💬'
            })
        elif details['contacts_artistes']['valeur'] < 10:
            contacts_manquants = 10 - details['contacts_artistes']['valeur']
            points_gagnables = 20 - details['contacts_artistes']['score']
            suggestions.append({
                'action': 'Développez votre réseau',
                'description': f"Contactez {contacts_manquants} artiste(s) de plus pour le maximum",
                'points': f"+{points_gagnables} points",
                'priorite': 'basse',
                'icon': '💬'
            })
    
    # Suggestion 4: Photo de profil (PRIORITÉ HAUTE si manquante)
    if not details['photo_profil']['valeur']:
        suggestions.append({
            'action': 'Ajoutez une photo de profil',
            'description': "Personnalisez votre compte avec une vraie photo",
            'points': "+15 points",
            'priorite': 'haute',
            'icon': '📸'
        })
    
    # Suggestion 5: Activer 2FA (PRIORITÉ MOYENNE)
    if not details['deux_facteurs']['valeur']:
        suggestions.append({
            'action': 'Activez la double authentification',
            'description': "Sécurisez votre compte (important pour les artistes)",
            'points': "+10 points",
            'priorite': 'moyenne',
            'icon': '🔐'
        })
    
    # Suggestion 6: Compléter le profil (PRIORITÉ BASSE)
    if details['profil_complet']['score'] < 5:
        suggestions.append({
            'action': 'Complétez votre profil',
            'description': "Renseignez tous les champs (nom, prénom, email, photo, téléphone)",
            'points': f"+{5 - details['profil_complet']['score']} points",
            'priorite': 'basse',
            'icon': '📝'
        })
    
    # Trier par priorité
    priorite_ordre = {'haute': 1, 'moyenne': 2, 'basse': 3}
    suggestions.sort(key=lambda x: priorite_ordre[x['priorite']])
    
    return suggestions


def obtenir_statistiques_score(user):
    """
    Retourne des statistiques comparatives pour contextualiser le score
    """
    from ..models import Utilisateur
    
    score_user = user.score_artiste
    
    # Statistiques générales
    tous_users = Utilisateur.objects.filter(role='user')
    total_users = tous_users.count()
    
    if total_users == 0:
        return {
            'rang': 0,
            'percentile': 0,
            'moyenne': 0,
            'users_superieurs': 0,
            'users_inferieurs': 0
        }
    
    # Calculer le rang
    users_superieurs = tous_users.filter(score_artiste__gt=score_user).count()
    rang = users_superieurs + 1
    
    # Calculer le percentile (top X%)
    percentile = round((users_superieurs / total_users) * 100, 1)
    
    # Score moyen
    from django.db.models import Avg
    moyenne = tous_users.aggregate(Avg('score_artiste'))['score_artiste__avg'] or 0
    
    # Users inférieurs
    users_inferieurs = tous_users.filter(score_artiste__lt=score_user).count()
    
    return {
        'rang': rang,
        'percentile': 100 - percentile,  # Inverser (tu es dans le top X%)
        'moyenne': round(moyenne, 1),
        'users_superieurs': users_superieurs,
        'users_inferieurs': users_inferieurs,
        'total_users': total_users
    }