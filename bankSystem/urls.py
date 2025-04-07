"""
URL configuration for bankSystem project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
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
from django.conf import settings
from django.conf.urls.static import static
from Accounts.frontend_views import (
    home_view, login_view, register_view, account_view,
    transactions_view, transfer_view, manager_view
)

urlpatterns = [
    # Admin URLs
    path('admin/', admin.site.urls),

    # API URLs
    path('api/', include('Accounts.urls')),

    # Frontend URLs
    path('', home_view, name='home'),
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('account/', account_view, name='account'),
    path('transactions/', transactions_view, name='transactions'),
    path('transfer/', transfer_view, name='transfer'),
    path('manager/', manager_view, name='manager'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
