from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('api/lessons', views.get_lessons_api, name='api_lessons'),
    path('api/chat', views.chat_api, name='api_chat'),
]
