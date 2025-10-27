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
        logger.info(f"🔍 CORS Request: {request.method} {request.path} from {origin}")
        
        # Gérer les requêtes OPTIONS (preflight)
        if request.method == 'OPTIONS':
            response = self._build_cors_preflight_response(origin)
            logger.info(f"✅ OPTIONS preflight response sent")
            return response
        
        # Traiter la requête normale
        response = self.get_response(request)
        
        # Ajouter les headers CORS à la réponse
        if origin in self.allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, x-csrftoken, x-requested-with'
            response['Access-Control-Expose-Headers'] = 'content-type, x-csrftoken'
            logger.info(f"✅ CORS headers added for {origin}")
        else:
            logger.warning(f"⚠️ Origin {origin} not in allowed list")
        
        return response
    
    def _build_cors_preflight_response(self, origin):
        """
        Construit une réponse pour les requêtes OPTIONS (preflight)
        """
        response = HttpResponse()
        
        if origin in self.allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, x-csrftoken, x-requested-with, accept, accept-encoding, dnt, origin, user-agent'
            response['Access-Control-Max-Age'] = '7200'  # 2 heures
        
        response.status_code = 200
        return response


class CorsDebugMiddleware:
    """
    Middleware de debug pour tracer les requêtes CORS
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.META.get('HTTP_ORIGIN', 'No Origin')
        method = request.method
        path = request.path
        
        logger.info(f"🔍 Request: {method} {path} from {origin}")
        logger.info(f"📋 Headers: {dict(request.headers)}")
        
        response = self.get_response(request)
        
        # Log les headers CORS de la réponse
        cors_headers = {
            k: v for k, v in response.items() 
            if k.lower().startswith('access-control')
        }
        logger.info(f"📤 Response Status: {response.status_code}")
        logger.info(f"📤 CORS Headers: {cors_headers}")
        
        return response