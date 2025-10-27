# Pixelette/middleware.py (créez ce fichier si inexistant)
class ForceCorsMiddleware:
    """
    Force les headers CORS pour TOUTES les réponses
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Ajouter les headers CORS manuellement
        origin = request.META.get('HTTP_ORIGIN', '')
        
        allowed_origins = [
            'https://pixelette.onrender.com',
            'https://pixelette-backoffice.onrender.com',
            'http://localhost:5173',
            'http://localhost:5174',
        ]
        
        if origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'authorization, content-type, x-csrftoken'
        
        return response