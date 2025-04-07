// Main JavaScript file for the Bank System

// Base API URL
const API_BASE_URL = '/api/';

// Helper function to show alerts
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alert-container');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show custom-alert" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// API request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('access_token');
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(API_BASE_URL + endpoint, options);
        
        // If token expired, try to refresh
        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry the request with new token
                return apiRequest(endpoint, method, data);
            } else {
                // Redirect to login if refresh failed
                window.location.href = '/login';
                return null;
            }
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'An error occurred');
        }
        
        // For DELETE requests or other requests that might not return JSON
        if (response.status === 204 || method === 'DELETE') {
            return { success: true };
        }
        
        return await response.json();
    } catch (error) {
        showAlert(error.message, 'danger');
        console.error('API Request Error:', error);
        return null;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Update navigation based on authentication status
    updateNavigation();
    
    // Setup logout functionality
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Initialize page-specific functionality
    const currentPath = window.location.pathname;
    
    if (currentPath === '/' || currentPath === '/account') {
        initAccountPage();
    } else if (currentPath === '/transactions') {
        initTransactionsPage();
    } else if (currentPath === '/transfer') {
        initTransferPage();
    } else if (currentPath.startsWith('/manager')) {
        initManagerPage();
    }
});

// Update navigation based on authentication status
function updateNavigation() {
    const isAuthenticated = !!localStorage.getItem('access_token');
    const isManager = localStorage.getItem('is_manager') === 'true';
    
    // Elements to show when logged in
    document.getElementById('nav-account').style.display = isAuthenticated ? 'block' : 'none';
    document.getElementById('nav-transactions').style.display = isAuthenticated ? 'block' : 'none';
    document.getElementById('nav-transfer').style.display = isAuthenticated ? 'block' : 'none';
    document.getElementById('nav-logout').style.display = isAuthenticated ? 'block' : 'none';
    
    // Elements to show when logged out
    document.getElementById('nav-login').style.display = !isAuthenticated ? 'block' : 'none';
    document.getElementById('nav-register').style.display = !isAuthenticated ? 'block' : 'none';
    
    // Manager-specific elements
    document.getElementById('nav-manager').style.display = isAuthenticated && isManager ? 'block' : 'none';
    
    // Highlight current page in navigation
    const currentPath = window.location.pathname;
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (currentPath === '/') {
        document.getElementById('nav-home').classList.add('active');
    } else if (currentPath === '/account') {
        document.getElementById('nav-account').classList.add('active');
    } else if (currentPath === '/transactions') {
        document.getElementById('nav-transactions').classList.add('active');
    } else if (currentPath === '/transfer') {
        document.getElementById('nav-transfer').classList.add('active');
    } else if (currentPath.startsWith('/manager')) {
        document.getElementById('nav-manager').classList.add('active');
    } else if (currentPath === '/login') {
        document.getElementById('nav-login').classList.add('active');
    } else if (currentPath === '/register') {
        document.getElementById('nav-register').classList.add('active');
    }
}

// Initialize account page
async function initAccountPage() {
    const accountContainer = document.getElementById('account-container');
    if (!accountContainer) return;
    
    try {
        const accountData = await apiRequest('account/');
        if (!accountData) return;
        
        const accountHTML = `
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="card balance-card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Current Balance</h5>
                            <p class="balance-amount">${formatCurrency(accountData.balance)}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">Account Information</h5>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Account ID:</span>
                                    <span>${accountData.id}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Username:</span>
                                    <span>${accountData.user.username}</span>
                                </li>
                                <li class="list-group-item d-flex justify-content-between">
                                    <span>Email:</span>
                                    <span>${accountData.user.email}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <i class="fas fa-plus-circle me-2"></i>Deposit
                        </div>
                        <div class="card-body">
                            <form id="deposit-form">
                                <div class="mb-3">
                                    <label for="deposit-amount" class="form-label">Amount</label>
                                    <input type="number" class="form-control" id="deposit-amount" min="1" step="0.01" required>
                                </div>
                                <div class="mb-3">
                                    <label for="deposit-description" class="form-label">Description (Optional)</label>
                                    <input type="text" class="form-control" id="deposit-description">
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Deposit Funds</button>
                            </form>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header bg-danger text-white">
                            <i class="fas fa-minus-circle me-2"></i>Withdraw
                        </div>
                        <div class="card-body">
                            <form id="withdraw-form">
                                <div class="mb-3">
                                    <label for="withdraw-amount" class="form-label">Amount</label>
                                    <input type="number" class="form-control" id="withdraw-amount" min="1" step="0.01" required>
                                </div>
                                <div class="mb-3">
                                    <label for="withdraw-description" class="form-label">Description (Optional)</label>
                                    <input type="text" class="form-control" id="withdraw-description">
                                </div>
                                <button type="submit" class="btn btn-danger w-100">Withdraw Funds</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        accountContainer.innerHTML = accountHTML;
        
        // Setup deposit form
        const depositForm = document.getElementById('deposit-form');
        depositForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const amount = document.getElementById('deposit-amount').value;
            const description = document.getElementById('deposit-description').value;
            
            const data = {
                transaction_type: 'deposit',
                amount,
                description
            };
            
            const result = await apiRequest('transactions/new/', 'POST', data);
            if (result) {
                showAlert('Deposit successful!');
                setTimeout(() => window.location.reload(), 1000);
            }
        });
        
        // Setup withdraw form
        const withdrawForm = document.getElementById('withdraw-form');
        withdrawForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const amount = document.getElementById('withdraw-amount').value;
            const description = document.getElementById('withdraw-description').value;
            
            const data = {
                transaction_type: 'withdraw',
                amount,
                description
            };
            
            const result = await apiRequest('transactions/new/', 'POST', data);
            if (result) {
                showAlert('Withdrawal successful!');
                setTimeout(() => window.location.reload(), 1000);
            }
        });
        
    } catch (error) {
        console.error('Error initializing account page:', error);
        accountContainer.innerHTML = '<div class="alert alert-danger">Error loading account information</div>';
    }
}

// Initialize transactions page
async function initTransactionsPage() {
    const transactionsContainer = document.getElementById('transactions-container');
    if (!transactionsContainer) return;
    
    try {
        const transactions = await apiRequest('transactions/');
        if (!transactions) return;
        
        if (transactions.results.length === 0) {
            transactionsContainer.innerHTML = '<div class="alert alert-info">No transactions found</div>';
            return;
        }
        
        let transactionsHTML = '<div class="list-group">';
        
        transactions.results.forEach(transaction => {
            const transactionClass = `transaction-${transaction.transaction_type.toLowerCase().replace('_', '-')}`;
            const icon = getTransactionIcon(transaction.transaction_type);
            const amountClass = transaction.transaction_type === 'deposit' || transaction.transaction_type === 'transfer_in' 
                ? 'text-success' : 'text-danger';
            
            transactionsHTML += `
                <div class="list-group-item transaction-item ${transactionClass}">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">
                            ${icon} ${formatTransactionType(transaction.transaction_type)}
                        </h5>
                        <small>${formatDate(transaction.timestamp)}</small>
                    </div>
                    <p class="mb-1">${transaction.description || 'No description'}</p>
                    <div class="d-flex w-100 justify-content-between">
                        <small>Transaction ID: ${transaction.id}</small>
                        <strong class="${amountClass}">${formatCurrency(transaction.amount)}</strong>
                    </div>
                </div>
            `;
        });
        
        transactionsHTML += '</div>';
        
        // Add pagination if needed
        if (transactions.count > transactions.results.length) {
            const totalPages = Math.ceil(transactions.count / 10);
            const currentPage = transactions.current || 1;
            
            transactionsHTML += `
                <nav aria-label="Transaction pagination" class="mt-4">
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
                        </li>
            `;
            
            for (let i = 1; i <= totalPages; i++) {
                transactionsHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }
            
            transactionsHTML += `
                        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
                        </li>
                    </ul>
                </nav>
            `;
        }
        
        transactionsContainer.innerHTML = transactionsHTML;
        
        // Setup pagination event listeners
        const pageLinks = document.querySelectorAll('.page-link');
        pageLinks.forEach(link => {
            link.addEventListener('click', async function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                if (page) {
                    const pageTransactions = await apiRequest(`transactions/?page=${page}`);
                    if (pageTransactions) {
                        initTransactionsPage();
                    }
                }
            });
        });
        
    } catch (error) {
        console.error('Error initializing transactions page:', error);
        transactionsContainer.innerHTML = '<div class="alert alert-danger">Error loading transactions</div>';
    }
}

// Get icon for transaction type
function getTransactionIcon(type) {
    switch (type.toLowerCase()) {
        case 'deposit':
            return '<i class="fas fa-plus-circle text-success"></i>';
        case 'withdraw':
            return '<i class="fas fa-minus-circle text-danger"></i>';
        case 'transfer_in':
            return '<i class="fas fa-arrow-right text-info"></i>';
        case 'transfer_out':
            return '<i class="fas fa-arrow-left text-warning"></i>';
        default:
            return '<i class="fas fa-exchange-alt"></i>';
    }
}

// Format transaction type for display
function formatTransactionType(type) {
    switch (type.toLowerCase()) {
        case 'deposit':
            return 'Deposit';
        case 'withdraw':
            return 'Withdrawal';
        case 'transfer_in':
            return 'Transfer Received';
        case 'transfer_out':
            return 'Transfer Sent';
        default:
            return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Initialize transfer page
function initTransferPage() {
    const transferForm = document.getElementById('transfer-form');
    if (!transferForm) return;
    
    transferForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const toUsername = document.getElementById('transfer-username').value;
        const amount = document.getElementById('transfer-amount').value;
        
        const data = {
            to_username: toUsername,
            amount
        };
        
        const result = await apiRequest('transfer/', 'POST', data);
        if (result) {
            showAlert('Transfer successful!');
            transferForm.reset();
        }
    });
}

// Initialize manager page
async function initManagerPage() {
    const usersContainer = document.getElementById('users-container');
    if (!usersContainer) return;
    
    try {
        const users = await apiRequest('manager/users/');
        if (!users) return;
        
        if (users.results.length === 0) {
            usersContainer.innerHTML = '<div class="alert alert-info">No users found</div>';
            return;
        }
        
        let usersHTML = '<div class="row">';
        
        users.results.forEach(user => {
            const statusBadge = user.is_active 
                ? '<span class="badge bg-success">Active</span>' 
                : '<span class="badge bg-danger">Inactive</span>';
                
            const managerBadge = user.is_manager 
                ? '<span class="badge bg-primary ms-1">Manager</span>' 
                : '';
                
            usersHTML += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card user-card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="card-title mb-0">${user.username}</h5>
                                <div>
                                    ${statusBadge}
                                    ${managerBadge}
                                </div>
                            </div>
                            <p class="card-text">
                                <strong>Name:</strong> ${user.first_name} ${user.last_name}<br>
                                <strong>Email:</strong> ${user.email}<br>
                                <strong>Phone:</strong> ${user.phone || 'N/A'}<br>
                                <strong>Joined:</strong> ${formatDate(user.date_joined)}
                            </p>
                            <div class="d-flex justify-content-between mt-3 user-actions">
                                <button class="btn btn-sm btn-primary view-user" data-user-id="${user.id}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-sm btn-warning edit-user" data-user-id="${user.id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-danger delete-user" data-user-id="${user.id}" data-user-name="${user.username}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        usersHTML += '</div>';
        
        // Add pagination if needed
        if (users.count > users.results.length) {
            const totalPages = Math.ceil(users.count / 10);
            const currentPage = users.current || 1;
            
            usersHTML += `
                <nav aria-label="Users pagination" class="mt-4">
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
                        </li>
            `;
            
            for (let i = 1; i <= totalPages; i++) {
                usersHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            }
            
            usersHTML += `
                        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
                        </li>
                    </ul>
                </nav>
            `;
        }
        
        usersContainer.innerHTML = usersHTML;
        
        // Setup event listeners for user actions
        setupUserActionListeners();
        
        // Setup pagination event listeners
        const pageLinks = document.querySelectorAll('.page-link');
        pageLinks.forEach(link => {
            link.addEventListener('click', async function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                if (page) {
                    const pageUsers = await apiRequest(`manager/users/?page=${page}`);
                    if (pageUsers) {
                        initManagerPage();
                    }
                }
            });
        });
        
    } catch (error) {
        console.error('Error initializing manager page:', error);
        usersContainer.innerHTML = '<div class="alert alert-danger">Error loading users</div>';
    }
}

// Setup user action listeners for manager page
function setupUserActionListeners() {
    // View user details
    const viewButtons = document.querySelectorAll('.view-user');
    viewButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const userId = this.getAttribute('data-user-id');
            window.location.href = `/manager/users/${userId}`;
        });
    });
    
    // Edit user
    const editButtons = document.querySelectorAll('.edit-user');
    editButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const userId = this.getAttribute('data-user-id');
            window.location.href = `/manager/users/${userId}/edit`;
        });
    });
    
    // Delete user
    const deleteButtons = document.querySelectorAll('.delete-user');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const userId = this.getAttribute('data-user-id');
            const username = this.getAttribute('data-user-name');
            
            if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
                const result = await apiRequest(`manager/users/${userId}/delete/`, 'DELETE');
                if (result) {
                    showAlert(`User "${username}" has been deleted successfully.`);
                    setTimeout(() => window.location.reload(), 1000);
                }
            }
        });
    });
}
