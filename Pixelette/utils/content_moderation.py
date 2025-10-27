"""
Module de modération de contenu utilisant l'IA pour détecter :
- Les mots inappropriés (bad words)
- Le contenu toxique
- Le spam
- Le harcèlement
"""

import re
import logging
from typing import Dict, List, Tuple, Optional
from textblob import TextBlob
from langdetect import detect
from langdetect.lang_detect_exception import LangDetectException
import nltk
from django.conf import settings

# Import optionnel pour profanity_check (avec fallback si problème)
try:
    from profanity_check import predict as is_profane, predict_prob as profanity_prob
    PROFANITY_CHECK_AVAILABLE = True
except (ImportError, ModuleNotFoundError) as e:
    print(f"⚠️ Profanity-check non disponible: {e}")
    PROFANITY_CHECK_AVAILABLE = False
    is_profane = lambda x: False
    profanity_prob = lambda x: 0.0

# Configuration des logs
logger = logging.getLogger(__name__)

class ContentModerationAI:
    """
    Classe principale pour la modération de contenu avec IA
    """
    
    def __init__(self):
        # Initialisation des ressources NLTK si nécessaire
        self._init_nltk()
        
        # Liste des mots inappropriés en français et anglais
        self.bad_words_fr = [
            'merde', 'putain', 'connard', 'salope', 'pute', 'enculé', 'bâtard',
            'con', 'conne', 'crétin', 'débile', 'abruti', 'idiot', 'imbécile',
            'nique', 'emmerde', 'chier', 'foutre', 'bordel', 'saloperie'
        ]
        
        self.bad_words_en = [
            'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'bastard',
            'crap', 'piss', 'cock', 'dick', 'pussy', 'whore', 'slut'
        ]
        
        # Patterns de spam
        self.spam_patterns = [
            r'(buy|acheter).*(now|maintenant)',
            r'(free|gratuit).*(money|argent)',
            r'(win|gagner).*(prize|prix)',
            r'click.*(here|ici)',
            r'(www\.|http|\.com|\.fr)',
            r'(\d{10,})',  # Numéros de téléphone
            r'[A-Z]{3,}.*[A-Z]{3,}'  # Texte tout en majuscules
        ]
        
        # Seuils de détection (ajustés pour être plus stricts)
        self.PROFANITY_THRESHOLD = 0.3
        self.TOXICITY_THRESHOLD = 0.4
        self.SPAM_SCORE_THRESHOLD = 0.3
    
    def _init_nltk(self):
        """Initialise les ressources NLTK nécessaires"""
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)
    
    def detect_language(self, text: str) -> str:
        """Détecte la langue du texte"""
        try:
            return detect(text)
        except (LangDetectException, Exception):
            return 'unknown'
    
    def check_bad_words(self, text: str, language: str = None) -> Dict:
        """
        Vérifie la présence de mots inappropriés dans le texte
        
        Args:
            text: Le texte à analyser
            language: La langue du texte (optionnel)
        
        Returns:
            Dict avec les résultats de l'analyse
        """
        if not language:
            language = self.detect_language(text)
        
        text_lower = text.lower()
        found_bad_words = []
        
        # Vérification selon la langue
        bad_words_list = []
        if language == 'fr':
            bad_words_list = self.bad_words_fr
        elif language == 'en':
            bad_words_list = self.bad_words_en
        else:
            # Si langue inconnue, vérifier dans les deux listes
            bad_words_list = self.bad_words_fr + self.bad_words_en
        
        # Recherche des mots inappropriés
        for word in bad_words_list:
            if word in text_lower:
                found_bad_words.append(word)
        
        # Score basé sur le nombre de mots inappropriés trouvés
        bad_words_score = min(len(found_bad_words) / 3, 1.0)
        
        return {
            'has_bad_words': len(found_bad_words) > 0,
            'bad_words_found': found_bad_words,
            'bad_words_score': bad_words_score,
            'language': language
        }
    
    def check_profanity_ai(self, text: str) -> Dict:
        """
        Utilise l'IA pour détecter la profanité avec profanity-check (si disponible)
        
        Args:
            text: Le texte à analyser
        
        Returns:
            Dict avec les résultats de l'analyse IA
        """
        try:
            if PROFANITY_CHECK_AVAILABLE:
                is_profane_result = is_profane(text)
                profanity_probability = profanity_prob(text)
                
                return {
                    'is_profane': bool(is_profane_result),
                    'profanity_probability': float(profanity_probability),
                    'exceeds_threshold': profanity_probability > self.PROFANITY_THRESHOLD,
                    'method': 'ai_model'
                }
            else:
                # Fallback: utiliser notre analyse de mots inappropriés
                bad_words_result = self.check_bad_words(text)
                profanity_score = bad_words_result['bad_words_score'] * 0.8  # Score plus conservateur
                
                return {
                    'is_profane': bad_words_result['has_bad_words'],
                    'profanity_probability': profanity_score,
                    'exceeds_threshold': profanity_score > self.PROFANITY_THRESHOLD,
                    'method': 'bad_words_fallback'
                }
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de profanité : {e}")
            return {
                'is_profane': False,
                'profanity_probability': 0.0,
                'exceeds_threshold': False,
                'error': str(e),
                'method': 'error_fallback'
            }
    
    def analyze_sentiment(self, text: str) -> Dict:
        """
        Analyse le sentiment du texte pour détecter la toxicité
        
        Args:
            text: Le texte à analyser
        
        Returns:
            Dict avec l'analyse de sentiment
        """
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity  # -1 (négatif) à 1 (positif)
            subjectivity = blob.sentiment.subjectivity  # 0 (objectif) à 1 (subjectif)
            
            # Calcul du score de toxicité basé sur la polarité
            # Plus le texte est négatif et subjectif, plus il est potentiellement toxique
            toxicity_score = 0
            if polarity < -0.3:
                toxicity_score = abs(polarity) * subjectivity
            
            return {
                'polarity': polarity,
                'subjectivity': subjectivity,
                'toxicity_score': toxicity_score,
                'is_toxic': toxicity_score > self.TOXICITY_THRESHOLD
            }
        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de sentiment : {e}")
            return {
                'polarity': 0.0,
                'subjectivity': 0.0,
                'toxicity_score': 0.0,
                'is_toxic': False,
                'error': str(e)
            }
    
    def detect_spam(self, text: str) -> Dict:
        """
        Détecte si le texte ressemble à du spam
        
        Args:
            text: Le texte à analyser
        
        Returns:
            Dict avec l'analyse de spam
        """
        spam_indicators = []
        spam_score = 0
        
        # Vérification des patterns de spam
        for i, pattern in enumerate(self.spam_patterns):
            if re.search(pattern, text, re.IGNORECASE):
                spam_indicators.append(f"Pattern {i+1}")
                spam_score += 0.2
        
        # Vérification de la répétition excessive
        words = text.split()
        if len(words) > 5:
            unique_words = set(words)
            repetition_ratio = 1 - (len(unique_words) / len(words))
            if repetition_ratio > 0.5:
                spam_indicators.append("Répétition excessive")
                spam_score += 0.3
        
        # Vérification des majuscules excessives
        if len(text) > 10:
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
            if caps_ratio > 0.6:
                spam_indicators.append("Majuscules excessives")
                spam_score += 0.2
        
        spam_score = min(spam_score, 1.0)
        
        return {
            'is_spam': spam_score > self.SPAM_SCORE_THRESHOLD,
            'spam_score': spam_score,
            'spam_indicators': spam_indicators
        }
    
    def moderate_content(self, text: str, context: str = "comment") -> Dict:
        """
        Fonction principale de modération qui combine toutes les analyses
        
        Args:
            text: Le texte à modérer
            context: Le contexte (comment, title, description, etc.)
        
        Returns:
            Dict avec l'analyse complète et la décision de modération
        """
        if not text or not text.strip():
            return {
                'action': 'approve',
                'confidence': 1.0,
                'reason': 'Texte vide'
            }
        
        # Analyse de base
        language = self.detect_language(text)
        
        # Analyses individuelles
        bad_words_analysis = self.check_bad_words(text, language)
        profanity_analysis = self.check_profanity_ai(text)
        sentiment_analysis = self.analyze_sentiment(text)
        spam_analysis = self.detect_spam(text)
        
        # Calcul du score global de problème
        problem_score = 0
        reasons = []
        
        if bad_words_analysis['has_bad_words']:
            # Score plus sévère : même un seul mot inapproprié = score élevé
            problem_score += min(bad_words_analysis['bad_words_score'] * 2.0, 1.0)
            reasons.append(f"Mots inappropriés détectés: {', '.join(bad_words_analysis['bad_words_found'])}")
        
        if profanity_analysis['exceeds_threshold']:
            problem_score += profanity_analysis['profanity_probability'] * 0.5
            reasons.append(f"Contenu profane détecté (score: {profanity_analysis['profanity_probability']:.2f})")
        
        if sentiment_analysis['is_toxic']:
            problem_score += sentiment_analysis['toxicity_score'] * 0.4
            reasons.append(f"Contenu toxique détecté (score: {sentiment_analysis['toxicity_score']:.2f})")
        
        if spam_analysis['is_spam']:
            problem_score += spam_analysis['spam_score'] * 0.3  # Augmenté pour spam
            reasons.append(f"Spam détecté: {', '.join(spam_analysis['spam_indicators'])}")
        
        # S'assurer que le score ne dépasse pas 1.0
        problem_score = min(problem_score, 1.0)
        
        # Décision de modération (seuils plus stricts)
        if problem_score > 0.4:
            action = 'reject'
        elif problem_score > 0.15:  # Seuil très bas pour flagged
            action = 'flag'  # Signaler pour révision manuelle
        else:
            action = 'approve'
        
        return {
            'action': action,
            'confidence': min(problem_score, 1.0),
            'problem_score': problem_score,
            'reasons': reasons,
            'language': language,
            'details': {
                'bad_words': bad_words_analysis,
                'profanity': profanity_analysis,
                'sentiment': sentiment_analysis,
                'spam': spam_analysis
            }
        }
    
    def get_filtered_text(self, text: str) -> str:
        """
        Retourne une version filtrée du texte avec les mots inappropriés remplacés
        
        Args:
            text: Le texte à filtrer
        
        Returns:
            str: Texte avec les mots inappropriés censurés
        """
        language = self.detect_language(text)
        bad_words_list = []
        
        if language == 'fr':
            bad_words_list = self.bad_words_fr
        elif language == 'en':
            bad_words_list = self.bad_words_en
        else:
            bad_words_list = self.bad_words_fr + self.bad_words_en
        
        filtered_text = text
        for word in bad_words_list:
            # Remplacer par des astérisques en gardant la première et dernière lettre
            if len(word) > 2:
                replacement = word[0] + '*' * (len(word) - 2) + word[-1]
            else:
                replacement = '*' * len(word)
            
            # Remplacer en préservant la casse
            filtered_text = re.sub(
                re.escape(word), 
                replacement, 
                filtered_text, 
                flags=re.IGNORECASE
            )
        
        return filtered_text


# Instance globale pour réutilisation
content_moderator = ContentModerationAI()


def moderate_text(text: str, context: str = "comment") -> Dict:
    """
    Fonction utilitaire pour modérer un texte
    
    Args:
        text: Le texte à modérer
        context: Le contexte (comment, title, description)
    
    Returns:
        Dict avec les résultats de modération
    """
    return content_moderator.moderate_content(text, context)


def filter_bad_words(text: str) -> str:
    """
    Fonction utilitaire pour filtrer les mots inappropriés
    
    Args:
        text: Le texte à filtrer
    
    Returns:
        str: Texte filtré
    """
    return content_moderator.get_filtered_text(text)