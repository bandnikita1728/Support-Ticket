from django.urls import path
from . import views
from django.views.decorators import csrf_exempt
from django.http import JsonResponse

@csrf_exempt
def get_csrf_token(request):
    """Return CSRF token for frontend"""
    return JsonResponse({'csrfToken': 'dummy-token-for-development'})

urlpatterns = [
    path('csrf/', get_csrf_token, name='get-csrf-token'),
    path('tickets/', views.ticket_list, name='ticket-list'),
    path('tickets/stats/', views.ticket_stats, name='ticket-stats'),
    path('tickets/classify/', views.classify, name='ticket-classify'),
    path('tickets/<int:pk>/', views.ticket_detail, name='ticket-detail'),
]
