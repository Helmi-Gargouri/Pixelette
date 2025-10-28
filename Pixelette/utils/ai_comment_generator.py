"""
Générateur de commentaires IA avec OpenAI
Génère automatiquement des commentaires intelligents basés sur les œuvres d'art
"""

import openai
from django.conf import settings
import logging
from typing import Dict, List, Optional
import json

logger = logging.getLogger(__name__)

class CommentAIGenerator:
    """
    Générateur de commentaires IA utilisant OpenAI GPT
    """
    
    def __init__(self):
        # Configuration OpenAI
        self.client = openai.OpenAI(
            api_key=getattr(settings, 'OPENAI_API_KEY', None)
        )
        self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-3.5-turbo')
        
    def generate_comment(self, oeuvre_data: Dict) -> Dict:
        """
        Génère un commentaire intelligent basé sur les données de l'œuvre
        
        Args:
            oeuvre_data (Dict): {
                'titre': str,
                'description': str,
                'technique': str,
                'dimension': str,
                'auteur_nom': str,
                'image_url': str (optionnel)
            }
        
        Returns:
            Dict: {
                'success': bool,
                'comment': str,
                'style': str,  # 'enthusiastic', 'analytical', 'poetic'
                'confidence': float,
                'metadata': dict
            }
        """
        
        try:
            # Vérifier la clé API
            if not self.client.api_key:
                return {
                    'success': False,
                    'error': 'Clé API OpenAI non configurée'
                }
            
            # Construire le prompt intelligent
            prompt = self._build_intelligent_prompt(oeuvre_data)
            
            logger.info(f"🤖 Génération de commentaire IA pour: {oeuvre_data.get('titre', 'Œuvre')}")
            
            # Appeler OpenAI
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=200,
                temperature=0.8,  # Créativité modérée
                top_p=0.9
            )
            
            # Extraire la réponse
            ai_response = response.choices[0].message.content.strip()
            
            # Analyser et structurer la réponse
            result = self._parse_ai_response(ai_response, oeuvre_data)
            
            logger.info(f"✅ Commentaire IA généré: {result['style']} (confiance: {result['confidence']:.2f})")
            
            return result
            
        except openai.RateLimitError:
            logger.error("❌ Limite de taux OpenAI atteinte")
            return self._generate_fallback_comment(oeuvre_data, "Limite de requêtes API atteinte")
        except openai.AuthenticationError:
            logger.error("❌ Erreur d'authentification OpenAI")
            return self._generate_fallback_comment(oeuvre_data, "Clé API OpenAI invalide")
        except Exception as e:
            logger.error(f"❌ Erreur génération IA: {e}")
            return self._generate_fallback_comment(oeuvre_data, str(e))
    
    def _get_system_prompt(self) -> str:
        """Prompt système pour définir le comportement de l'IA"""
        return """Tu es un critique d'art passionné et bienveillant qui écrit des commentaires authentiques sur des œuvres d'art. 

CONSIGNES:
- Écris des commentaires naturels comme si tu étais un visiteur passionné
- Sois positif et constructif, même pour des critiques
- Utilise un langage accessible, pas trop technique
- Varie les styles: enthousiaste, analytique, poétique, personnel
- Maximum 150 mots
- Écris en français
- Inclus des émojis occasionnellement pour l'authenticité
- Évite les clichés d'art trop pompeux

STYLES À ALTERNER:
- Enthousiaste: "Wow, cette œuvre me transporte..."
- Analytique: "J'observe ici l'usage subtil de..."
- Poétique: "Cette création évoque en moi..."
- Personnel: "Cette œuvre me rappelle..."

Réponds UNIQUEMENT avec le commentaire, pas d'introduction."""

    def _build_intelligent_prompt(self, oeuvre_data: Dict) -> str:
        """Construit un prompt intelligent basé sur les données de l'œuvre"""
        
        titre = oeuvre_data.get('titre', 'Sans titre')
        description = oeuvre_data.get('description', '')
        technique = oeuvre_data.get('technique', '')
        dimension = oeuvre_data.get('dimension', '')
        auteur_nom = oeuvre_data.get('auteur_nom', 'Artiste')
        
        prompt_parts = [f"Œuvre: '{titre}' par {auteur_nom}"]
        
        if description:
            prompt_parts.append(f"Description: {description}")
        
        if technique:
            prompt_parts.append(f"Technique: {technique}")
            
        if dimension:
            prompt_parts.append(f"Dimensions: {dimension}")
        
        # Ajouter des instructions contextuelles
        prompt_parts.append("\nÉcris un commentaire authentique de visiteur sur cette œuvre.")
        
        return "\n".join(prompt_parts)
    
    def _parse_ai_response(self, ai_response: str, oeuvre_data: Dict) -> Dict:
        """Parse et analyse la réponse IA"""
        
        # Déterminer le style du commentaire
        style = self._detect_comment_style(ai_response)
        
        # Calculer un score de confiance basé sur la longueur et la richesse
        confidence = self._calculate_confidence(ai_response, oeuvre_data)
        
        # Nettoyer le commentaire
        clean_comment = ai_response.strip()
        
        return {
            'success': True,
            'comment': clean_comment,
            'style': style,
            'confidence': confidence,
            'metadata': {
                'length': len(clean_comment),
                'words': len(clean_comment.split()),
                'model_used': self.model
            }
        }
    
    def _detect_comment_style(self, comment: str) -> str:
        """Détecte le style du commentaire généré"""
        
        comment_lower = comment.lower()
        
        # Mots-clés par style
        enthusiastic_keywords = ['wow', 'magnifique', 'incroyable', 'superbe', 'époustouflant', '!']
        analytical_keywords = ['observe', 'analyse', 'technique', 'composition', 'structure']
        poetic_keywords = ['évoque', 'transporte', 'ressent', 'âme', 'émotion', 'poésie']
        personal_keywords = ['me rappelle', 'j\'aime', 'pour moi', 'personnellement']
        
        scores = {
            'enthusiastic': sum(1 for word in enthusiastic_keywords if word in comment_lower),
            'analytical': sum(1 for word in analytical_keywords if word in comment_lower),
            'poetic': sum(1 for word in poetic_keywords if word in comment_lower),
            'personal': sum(1 for word in personal_keywords if word in comment_lower)
        }
        
        return max(scores, key=scores.get) or 'general'
    
    def _calculate_confidence(self, comment: str, oeuvre_data: Dict) -> float:
        """Calcule un score de confiance pour le commentaire généré"""
        
        confidence = 0.5  # Base
        
        # Longueur appropriée
        word_count = len(comment.split())
        if 20 <= word_count <= 100:
            confidence += 0.2
        
        # Mention des éléments de l'œuvre
        titre = oeuvre_data.get('titre', '').lower()
        if titre and any(word in comment.lower() for word in titre.split()):
            confidence += 0.15
            
        # Richesse du vocabulaire
        unique_words = len(set(comment.lower().split()))
        if unique_words > word_count * 0.7:  # 70% de mots uniques
            confidence += 0.15
        
        return min(confidence, 1.0)

    def _generate_fallback_comment(self, oeuvre_data: Dict, error_reason: str) -> Dict:
        """Génère un commentaire de fallback si OpenAI échoue"""
        
        titre = oeuvre_data.get('titre', 'cette œuvre')
        description = oeuvre_data.get('description', '')
        technique = oeuvre_data.get('technique', '')
        auteur_nom = oeuvre_data.get('auteur_nom', 'l\'artiste')
        
        # Templates de commentaires intelligents basés sur les données
        templates = [
            f"Cette œuvre '{titre}' de {auteur_nom} est vraiment captivante ! J'apprécie particulièrement la façon dont l'artiste a su transmettre son message à travers cette création. 🎨",
            f"Magnifique travail ! '{titre}' démontre un vrai talent artistique. {auteur_nom} a créé quelque chose de très expressif qui ne laisse pas indifférent.",
            f"J'aime beaucoup cette œuvre. '{titre}' a une personnalité unique qui reflète bien le style de {auteur_nom}. Bravo pour cette belle création ! ✨",
            f"Très belle réalisation ! Cette pièce '{titre}' montre une maîtrise technique impressionnante. {auteur_nom} sait vraiment capter l'attention du spectateur.",
            f"Quelle inspiration ! '{titre}' est une œuvre qui interpelle et fait réfléchir. J'admire la créativité de {auteur_nom} dans cette composition."
        ]
        
        # Personnaliser selon la technique si disponible
        if technique:
            technique_comments = {
                'peinture': f"La technique de peinture utilisée dans '{titre}' est remarquable. {auteur_nom} maîtrise parfaitement son art ! 🎨",
                'sculpture': f"Cette sculpture '{titre}' de {auteur_nom} est impressionnante ! La forme et les volumes sont parfaitement maîtrisés.",
                'photographie': f"Belle capture ! Cette photographie '{titre}' de {auteur_nom} saisit un moment unique avec une grande sensibilité.",
                'dessin': f"Le dessin '{titre}' révèle tout le talent de {auteur_nom}. Chaque trait semble pensé et maîtrisé.",
                'digital': f"Excellent travail numérique ! '{titre}' montre que {auteur_nom} maîtrise parfaitement les outils digitaux."
            }
            
            for tech_key, comment in technique_comments.items():
                if tech_key.lower() in technique.lower():
                    templates.insert(0, comment)
                    break
        
        # Personnaliser selon la description si disponible
        if description and len(description) > 10:
            if 'couleur' in description.lower():
                templates.insert(0, f"Les couleurs de '{titre}' sont magnifiques ! {auteur_nom} a un sens artistique remarquable pour les harmonies colorées. 🌈")
            elif 'lumière' in description.lower():
                templates.insert(0, f"Le jeu de lumières dans '{titre}' est fascinant ! {auteur_nom} maîtrise parfaitement les contrastes et les nuances.")
        
        # Sélectionner un template aléatoirement
        import random
        selected_comment = random.choice(templates)
        
        # Détecter le style du commentaire fallback
        style = 'enthusiastic' if any(word in selected_comment.lower() for word in ['magnifique', 'excellent', 'bravo', '!']) else 'general'
        
        logger.info(f"🔄 Fallback: Commentaire généré localement (raison: {error_reason[:50]}...)")
        
        return {
            'success': True,
            'comment': selected_comment,
            'style': style,
            'confidence': 0.75,  # Bonne confiance pour les templates
            'metadata': {
                'length': len(selected_comment),
                'words': len(selected_comment.split()),
                'model_used': 'fallback_template',
                'fallback_reason': error_reason
            }
        }

    def generate_multiple_suggestions(self, oeuvre_data: Dict, count: int = 3) -> List[Dict]:
        """
        Génère plusieurs suggestions de commentaires avec différents styles
        """
        suggestions = []
        
        for i in range(count):
            # Varier légèrement la température pour plus de diversité
            temp_client = openai.OpenAI(api_key=self.client.api_key)
            
            try:
                result = self.generate_comment(oeuvre_data)
                if result['success']:
                    suggestions.append(result)
            except Exception as e:
                logger.warning(f"Échec génération suggestion {i+1}: {e}")
        
        return suggestions


# Fonction utilitaire pour usage facile
def generate_ai_comment(oeuvre_data: Dict) -> Dict:
    """
    Fonction utilitaire pour générer un commentaire IA
    
    Usage:
        result = generate_ai_comment({
            'titre': 'La Joconde',
            'description': 'Portrait de Lisa Gherardini...',
            'auteur_nom': 'Léonard de Vinci'
        })
    """
    generator = CommentAIGenerator()
    return generator.generate_comment(oeuvre_data)


def generate_multiple_ai_comments(oeuvre_data: Dict, count: int = 3) -> List[Dict]:
    """Génère plusieurs suggestions de commentaires"""
    generator = CommentAIGenerator()
    return generator.generate_multiple_suggestions(oeuvre_data, count)