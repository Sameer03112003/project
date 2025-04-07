from rest_framework import generics, permissions, status, filters
from django.contrib.auth import get_user_model
from .models import *
from .serializers import *
from .filters import TransactionFilters
from rest_framework.views import APIView
from rest_framework.response import Response
from .permissions import IsManager

# Create your views here.
CustomUser = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset=CustomUser.objects.all()
    serializer_class=UserSerializer


class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = serializer.get_tokens_for_user(user)
        return Response(tokens, status=status.HTTP_200_OK)


class AccountDetailView(generics.RetrieveAPIView):
    serializer_class=AccountSerializer
    permission_classes=[permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.account

class TransactionCreateView(generics.CreateAPIView):
    serializer_class=TransactionSerializer
    permission_classes=[permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(account=self.request.user.account)

class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = TransactionFilters

    def get_queryset(self):
        return self.request.user.account.transactions.all()



class TransferView(generics.CreateAPIView):
    serializer_class = TransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(from_account=self.request.user.account)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


# Manager Views
class UserListView(generics.ListAPIView):
    """View for managers to list all users"""
    queryset = CustomUser.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [IsManager]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined']
    ordering = ['username']


class ManagerUserDetailView(generics.RetrieveAPIView):
    """View for managers to see user details"""
    queryset = CustomUser.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [IsManager]


class UserUpdateView(generics.UpdateAPIView):
    """View for managers to update user information"""
    queryset = CustomUser.objects.all()
    serializer_class = UserUpdateSerializer
    permission_classes = [IsManager]


class UserDeleteView(generics.DestroyAPIView):
    """View for managers to delete users"""
    queryset = CustomUser.objects.all()
    permission_classes = [IsManager]

    def perform_destroy(self, instance):
        # Check if the user has an account and delete it first
        try:
            if hasattr(instance, 'account'):
                instance.account.delete()
            instance.delete()
        except Exception as e:
            raise Exception(str(e))

    def destroy(self, request, pk=None):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return Response({"detail": "User deleted successfully."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)