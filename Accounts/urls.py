from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    RegisterView, AccountDetailView,
    TransactionCreateView, TransactionListView, TransferView,LoginView
)



urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('account/', AccountDetailView.as_view(), name='account-detail'),
    path('login/', LoginView.as_view(), name='login'), 
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('transactions/new/', TransactionCreateView.as_view(), name='transaction-create'),
    path('transfer/', TransferView.as_view(), name='transfer'),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)