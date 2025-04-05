import django_filters

from .models import Transaction

class TransactionFilters(django_filters.FilterSet):
    start_date=django_filters.DateFilter(field_name='timestamp',lookup_expr='gte')
    end_date=django_filters.DateFilter(field_name='timestamp',looup_expr='lte')
    transation_type=django_filters.CharFilter(field_name='transaction_type')

    class Meta:
        model=Transaction
        fields=['Transaction_type', 'start_date', 'end_date']