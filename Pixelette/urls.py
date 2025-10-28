"""
URL configuration for Pixelette project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from django.conf import settings 
from django.conf.urls.static import static  
from .views import (
    UtilisateurViewSet, OeuvreViewSet, GalerieViewSet, InteractionViewSet, 
    StatistiqueViewSet, DemandeRoleViewSet, SavedStatViewSet, spotify_create_playlist, 
    spotify_auth_url, spotify_callback, whoami, SuiviViewSet,
    ContactArtisteViewSet, ConsultationOeuvreViewSet,PartageOeuvreViewSet,TempAuthStorageView
)
from .views import users_by_date
from .views import views_by_artist
from .views import generate_summary_pdf
from .views import ai_generate_chart


router = routers.DefaultRouter()
router.register(r'utilisateurs', UtilisateurViewSet)
router.register(r'oeuvres', OeuvreViewSet)
router.register(r'galeries', GalerieViewSet)
router.register(r'interactions', InteractionViewSet)
router.register(r'statistiques', StatistiqueViewSet)
router.register(r'saved-stats', SavedStatViewSet)
router.register(r'demandes', DemandeRoleViewSet) 
router.register(r'suivis', SuiviViewSet, basename='suivi') 
router.register(r'contacts', ContactArtisteViewSet) 
router.register(r'consultations', ConsultationOeuvreViewSet) 
router.register(r'partages', PartageOeuvreViewSet) 


urlpatterns = [
    path('admin/', admin.site.urls),
    # specific API routes first
    path('api/stats/views-by-artist/', views_by_artist, name='views_by_artist'),
    path('api/', include(router.urls)),
    path('api/spotify/create-playlist/', spotify_create_playlist, name='spotify_create_playlist'),
    path('api/spotify/auth-url/', spotify_auth_url, name='spotify_auth_url'),
    path('api/spotify/callback/', spotify_callback, name='spotify_callback'),
    path('api/whoami/', whoami, name='whoami'),
    path('api/users/by-date/', users_by_date, name='users_by_date'),
    path('api/stats/views-by-artist/', views_by_artist, name='views_by_artist'),
    path('api/reports/summary/', generate_summary_pdf, name='generate_summary_pdf'),
    path('api/ai/generate-chart/', ai_generate_chart, name='ai_generate_chart'),
    path('api/auth/store_temp/', TempAuthStorageView.as_view(), name='store_temp_auth'),
    path('api/auth/get_temp/<uuid:temp_id>/', TempAuthStorageView.as_view(), name='get_temp_auth'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
