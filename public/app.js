// Show message to user
function showMessage(text, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type} active`;
    setTimeout(() => {
        messageEl.classList.remove('active');
    }, 3000);
}

// Check authentication status on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/auth-status');
        const data = await response.json();
        
        if (data.isAuthenticated) {
            showMainContent();
            loadKeys();
        } else {
            showLoginForm();
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('mainContent').classList.remove('active');
}

// Show main content
function showMainContent() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('mainContent').classList.add('active');
}

// Login function
async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('Login successful!', 'success');
            showMainContent();
            loadKeys();
        } else {
            showMessage('Invalid credentials', 'error');
        }
    } catch (error) {
        showMessage('Login failed', 'error');
        console.error('Login error:', error);
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        showMessage('Logged out successfully', 'success');
        showLoginForm();
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    } catch (error) {
        showMessage('Logout failed', 'error');
        console.error('Logout error:', error);
    }
}

// Load all API keys
async function loadKeys() {
    try {
        const response = await fetch('/api/keys');
        const keys = await response.json();
        
        const keysList = document.getElementById('keysList');
        
        if (keys.length === 0) {
            keysList.innerHTML = '<div class="no-keys">No API keys stored yet. Add your first one above!</div>';
            return;
        }
        
        keysList.innerHTML = keys.map(key => `
            <div class="key-item">
                <div class="key-header">
                    <div>
                        <div class="key-name">${escapeHtml(key.name)}</div>
                        <div class="key-date">${new Date(key.createdAt).toLocaleString()}</div>
                    </div>
                </div>
                <div class="key-value">${escapeHtml(key.apiKey)}</div>
                <div class="key-actions">
                    <button class="btn-secondary" onclick="copyKey('${escapeHtml(key.apiKey)}')">📋 Copy</button>
                    <button class="btn-danger" onclick="deleteKey('${key._id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showMessage('Failed to load API keys', 'error');
        console.error('Load keys error:', error);
    }
}

// Add new API key
async function addKey() {
    const name = document.getElementById('keyName').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!name || !apiKey) {
        showMessage('Please enter both name and API key', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, apiKey })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('API key added successfully!', 'success');
            document.getElementById('keyName').value = '';
            document.getElementById('apiKey').value = '';
            loadKeys();
        } else {
            showMessage(data.error || 'Failed to add API key', 'error');
        }
    } catch (error) {
        showMessage('Failed to add API key', 'error');
        console.error('Add key error:', error);
    }
}

// Copy API key to clipboard
async function copyKey(apiKey) {
    try {
        await navigator.clipboard.writeText(apiKey);
        showMessage('API key copied to clipboard!', 'success');
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = apiKey;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showMessage('API key copied to clipboard!', 'success');
        } catch (err) {
            showMessage('Failed to copy API key', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Delete API key
async function deleteKey(id) {
    if (!confirm('Are you sure you want to delete this API key?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/keys/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage('API key deleted successfully!', 'success');
            loadKeys();
        } else {
            showMessage('Failed to delete API key', 'error');
        }
    } catch (error) {
        showMessage('Failed to delete API key', 'error');
        console.error('Delete key error:', error);
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Handle Enter key press on login form
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    document.getElementById('password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('apiKey').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addKey();
        }
    });
});
