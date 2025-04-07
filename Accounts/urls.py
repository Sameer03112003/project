from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import (
    RegisterView, AccountDetailView, LogoutView,
    TransactionCreateView, TransactionListView, TransferView, LoginView,
    # Manager views
    UserListView, ManagerUserDetailView, UserUpdateView, UserDeleteView
)



urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('account/', AccountDetailView.as_view(), name='account-detail'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('transactions/new/', TransactionCreateView.as_view(), name='transaction-create'),
    path('transfer/', TransferView.as_view(), name='transfer'),

    # Manager URLs
    path('manager/users/', UserListView.as_view(), name='manager-user-list'),
    path('manager/users/<int:pk>/', ManagerUserDetailView.as_view(), name='manager-user-detail'),
    path('manager/users/<int:pk>/update/', UserUpdateView.as_view(), name='manager-user-update'),
    path('manager/users/<int:pk>/delete/', UserDeleteView.as_view(), name='manager-user-delete'),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)