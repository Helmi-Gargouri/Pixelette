# Pixelette/middleware.py
import logging
from django.http import HttpResponse

logger = logging.getLogger(__name__)

class CorsMiddleware:
    """
    Middleware CORS custom qui force les headers pour toutes les réponses
    et gère les requêtes OPTIONS (preflight)
    """
    def __init__(self, get_response):
        self.get_response = get_response
        self.allowed_origins = [
            'https://pixelette.onrender.com',
            'https://pixelette-backoffice.onrender.com',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
        ]

    def __call__(self, request):
        origin = request.META.get('HTTP_ORIGIN', '')
        
        # Log pour debug
        logger.info(f"🔍 Request: {request.method} {request.path} from {origin}")
        
        # Gérer les requêtes OPTIONS (preflight) - CRITIQUE
        if request.method == 'OPTIONS':
            response = self._build_cors_preflight_response(origin)
            logger.info(f"✅ OPTIONS preflight sent for {origin}")
            return response
        
        # Traiter la requête normale
        response = self.get_response(request)
        
        # Ajouter les headers CORS à TOUTES les réponses
        if origin in self.allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, x-csrftoken, x-requested-with, accept, accept-encoding, origin'
            response['Access-Control-Expose-Headers'] = 'content-type'
            logger.info(f"✅ CORS headers added for {origin}")
        elif origin:
            logger.warning(f"⚠️ Origin {origin} NOT in allowed list")
        
        return response
    
    def _build_cors_preflight_response(self, origin):
        """
        Construit une réponse pour les requêtes OPTIONS (preflight)
        """
        response = HttpResponse(status=200)
        
        if origin in self.allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, x-csrftoken, x-requested-with, accept, accept-encoding, origin, dnt, user-agent'
            response['Access-Control-Max-Age'] = '7200'  # 2 heures
            response['Content-Length'] = '0'
        
        return response