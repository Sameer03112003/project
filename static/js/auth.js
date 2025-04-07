// Authentication related functions

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('access_token');
}

// Check if user is a manager
function isManager() {
    return localStorage.getItem('is_manager') === 'true';
}

// Login function
async function login(username, password) {
    try {
        const response = await fetch('/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }
        
        const data = await response.json();
        
        // Store tokens in localStorage
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        // Get user info to check if they're a manager
        await getUserInfo();
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// Register function
async function register(userData) {
    try {
        const response = await fetch('/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = Object.values(errorData).flat().join(', ');
            throw new Error(errorMessage || 'Registration failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Logout function
async function logout() {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
            // Call the logout API to blacklist the token
            await fetch('/api/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ refresh: refreshToken })
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear local storage regardless of API success
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('is_manager');
        
        // Redirect to login page
        window.location.href = '/login';
    }
}

// Refresh token
async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
        return false;
    }
    
    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (!response.ok) {
            throw new Error('Token refresh failed');
        }
        
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        
        return true;
    } catch (error) {
        console.error('Token refresh error:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('is_manager');
        return false;
    }
}

// Get user info to check if they're a manager
async function getUserInfo() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        return null;
    }
    
    try {
        const response = await fetch('/api/account/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get user info');
        }
        
        const userData = await response.json();
        
        // Check if user is a manager and store in localStorage
        if (userData.user && userData.user.is_manager !== undefined) {
            localStorage.setItem('is_manager', userData.user.is_manager);
        }
        
        return userData;
    } catch (error) {
        console.error('Get user info error:', error);
        return null;
    }
}

// Protect routes that require authentication
function protectRoute() {
    if (!isAuthenticated()) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    return true;
}

// Protect manager routes
function protectManagerRoute() {
    if (!isAuthenticated()) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }
    
    if (!isManager()) {
        window.location.href = '/account';
        return false;
    }
    
    return true;
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    
    // Routes that require authentication
    const protectedRoutes = ['/account', '/transactions', '/transfer'];
    
    // Routes that require manager role
    const managerRoutes = ['/manager', '/manager/users'];
    
    // Check if current path starts with any manager route
    const isManagerRoute = managerRoutes.some(route => currentPath.startsWith(route));
    
    // Check if current path is a protected route
    const isProtectedRoute = protectedRoutes.includes(currentPath);
    
    if (isManagerRoute) {
        protectManagerRoute();
    } else if (isProtectedRoute) {
        protectRoute();
    }
});
