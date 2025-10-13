import spotipy
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth
from django.conf import settings
import random

# Mapping de thèmes vers des genres Spotify (genres officiels et validés uniquement)
# Genres testés et confirmés par Spotify API
THEME_TO_GENRES = {
    'portraits': ['indie', 'indie-pop', 'singer-songwriter', 'acoustic'],
    'paysages': ['ambient', 'chill', 'piano', 'classical'],
    'urbain': ['hip-hop', 'electronic', 'techno', 'house', 'dance'],
    'nature': ['ambient', 'world-music', 'acoustic', 'folk'],
    'animaux': ['world-music', 'children', 'ambient', 'acoustic'],
    'abstrait': ['electronic', 'experimental', 'ambient', 'edm', 'techno'],
    'noir et blanc': ['jazz', 'blues', 'classical', 'indie', 'soul'],
    'street art': ['hip-hop', 'rap', 'funk', 'indie'],
    'moderne': ['electronic', 'indie', 'alternative', 'pop', 'dance'],
    'classique': ['classical', 'opera', 'piano', 'jazz'],
    'romantique': ['romance', 'jazz', 'soul', 'r-n-b', 'acoustic'],
    'minimaliste': ['ambient', 'minimal-techno', 'piano', 'chill', 'classical'],
    'coloré': ['pop', 'disco', 'funk', 'dance', 'happy'],
    'sombre': ['goth', 'industrial', 'black-metal', 'metal', 'grunge'],
}

DEFAULT_GENRES = ['chill', 'indie', 'ambient', 'electronic', 'pop']


def get_spotify_client():
    """
    Initialise et retourne un client Spotify authentifié (pour lecture seule).
    """
    # Vérifie que les credentials sont configurés
    if not settings.SPOTIFY_CLIENT_ID or not settings.SPOTIFY_CLIENT_SECRET:
        raise Exception(
            "Les credentials Spotify ne sont pas configurés. "
            "Ajoutez SPOTIFY_CLIENT_ID et SPOTIFY_CLIENT_SECRET dans votre fichier .env. "
            "Consultez SPOTIFY_SETUP.md pour plus d'informations."
        )
    
    try:
        # Crée le gestionnaire d'authentification
        client_credentials_manager = SpotifyClientCredentials(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET
        )
        
        # Initialise le client Spotify
        sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)
        
        print(f"✅ Client Spotify initialisé avec succès")
        
        return sp
    except Exception as e:
        raise Exception(
            f"Erreur d'authentification Spotify: {str(e)}. "
            f"Vérifiez que vos credentials sont corrects dans le fichier .env."
        )


def get_spotify_oauth():
    """
    Retourne un gestionnaire OAuth pour créer des playlists dans le compte utilisateur.
    """
    redirect_uri = settings.SPOTIFY_REDIRECT_URI if hasattr(settings, 'SPOTIFY_REDIRECT_URI') else 'http://localhost:8000/api/spotify/callback/'
    
    return SpotifyOAuth(
        client_id=settings.SPOTIFY_CLIENT_ID,
        client_secret=settings.SPOTIFY_CLIENT_SECRET,
        redirect_uri=redirect_uri,
        scope='playlist-modify-public playlist-modify-private',
        cache_path=None  # Ne pas utiliser de cache fichier
    )


def create_playlist_in_user_account(access_token, user_id, playlist_name, track_uris, description=''):
    """
    Crée une playlist dans le compte Spotify de l'utilisateur.
    """
    try:
        sp = spotipy.Spotify(auth=access_token)
        
        # Crée la playlist
        playlist = sp.user_playlist_create(
            user=user_id,
            name=playlist_name,
            public=True,
            description=description
        )
        
        # Ajoute les tracks à la playlist
        if track_uris:
            sp.playlist_add_items(playlist['id'], track_uris)
        
        print(f"✅ Playlist créée: {playlist['name']} ({len(track_uris)} morceaux)")
        
        return {
            'success': True,
            'playlist_id': playlist['id'],
            'playlist_url': playlist['external_urls']['spotify'],
            'playlist_name': playlist['name']
        }
    except Exception as e:
        print(f"❌ Erreur création playlist: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def map_theme_to_genres(theme):
    """
    Mappe un thème de galerie vers des genres musicaux Spotify.
    """
    if not theme:
        return DEFAULT_GENRES
    
    theme_lower = theme.lower()
    
    # Cherche une correspondance exacte ou partielle
    for key, genres in THEME_TO_GENRES.items():
        if key in theme_lower or theme_lower in key:
            return genres
    
    # Si aucune correspondance, retourne les genres par défaut
    return DEFAULT_GENRES


def generate_playlist_for_gallery(galerie_nom, galerie_theme, galerie_description=''):
    """
    Génère des recommandations de musiques basées sur le thème de la galerie.
    Retourne une liste de tracks avec leurs informations.
    """
    try:
        sp = get_spotify_client()
        
        # Détermine les genres à utiliser
        genres = map_theme_to_genres(galerie_theme)
        
        # Sélectionne aléatoirement 1-2 genres pour la recherche
        # Spotify peut être capricieux avec trop de seed_genres
        selected_genres = random.sample(genres, min(2, len(genres)))
        
        print(f"🎵 Génération de playlist avec les genres: {selected_genres}")
        
        # Nouvelle approche : recherche de playlists puis extraction de tracks
        # Car l'endpoint recommendations semble avoir des problèmes
        tracks = []
        
        try:
            # Essaie d'abord avec recommendations
            recommendations = sp.recommendations(
                seed_genres=selected_genres,
                limit=20
            )
            
            print(f"✅ {len(recommendations['tracks'])} morceaux reçus via recommendations")
            
            # Formate les résultats
            for track in recommendations['tracks']:
                track_info = {
                    'id': track['id'],
                    'uri': track['uri'],  # Nécessaire pour créer la playlist
                    'name': track['name'],
                    'artist': ', '.join([artist['name'] for artist in track['artists']]),
                    'album': track['album']['name'],
                    'preview_url': track.get('preview_url'),
                    'external_url': track['external_urls']['spotify'],
                    'image': track['album']['images'][0]['url'] if track['album']['images'] else None,
                    'duration_ms': track['duration_ms']
                }
                tracks.append(track_info)
                
        except Exception as rec_error:
            print(f"⚠️ Recommendations échoué, utilisation de la recherche: {str(rec_error)}")
            
            # Plan B : Recherche de tracks par genre/thème
            search_query = galerie_theme or 'music'
            results = sp.search(q=f'genre:{selected_genres[0]}', type='track', limit=20)
            
            print(f"✅ {len(results['tracks']['items'])} morceaux trouvés via recherche")
            
            for track in results['tracks']['items']:
                track_info = {
                    'id': track['id'],
                    'uri': track['uri'],  # Nécessaire pour créer la playlist
                    'name': track['name'],
                    'artist': ', '.join([artist['name'] for artist in track['artists']]),
                    'album': track['album']['name'],
                    'preview_url': track.get('preview_url'),
                    'external_url': track['external_urls']['spotify'],
                    'image': track['album']['images'][0]['url'] if track['album']['images'] else None,
                    'duration_ms': track['duration_ms']
                }
                tracks.append(track_info)
        
        return {
            'success': True,
            'playlist_name': f"Playlist pour {galerie_nom}",
            'theme': galerie_theme,
            'genres_used': selected_genres,
            'tracks': tracks,
            'tracks_count': len(tracks)
        }
    
    except Exception as e:
        error_message = str(e)
        print(f"❌ Erreur Spotify: {error_message}")
        
        # Message plus explicite si credentials manquants
        if "credentials" in error_message.lower() or "not configured" in error_message.lower():
            return {
                'success': False,
                'error': error_message,
                'message': 'Configuration Spotify manquante. Consultez SPOTIFY_SETUP.md'
            }
        
        return {
            'success': False,
            'error': error_message,
            'message': 'Erreur lors de la génération de la playlist Spotify'
        }


def search_playlists_by_theme(theme, limit=5):
    """
    Recherche des playlists Spotify existantes basées sur un thème.
    """
    try:
        sp = get_spotify_client()
        
        # Recherche des playlists avec le thème comme mot-clé
        results = sp.search(q=theme, type='playlist', limit=limit)
        
        playlists = []
        for playlist in results['playlists']['items']:
            playlist_info = {
                'id': playlist['id'],
                'name': playlist['name'],
                'description': playlist.get('description', ''),
                'owner': playlist['owner']['display_name'],
                'tracks_count': playlist['tracks']['total'],
                'external_url': playlist['external_urls']['spotify'],
                'image': playlist['images'][0]['url'] if playlist['images'] else None
            }
            playlists.append(playlist_info)
        
        return {
            'success': True,
            'playlists': playlists
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'message': 'Erreur lors de la recherche de playlists'
        }

