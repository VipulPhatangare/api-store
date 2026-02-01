// Show toast notification
function showToast(text, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '✕';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-content">${text}</span>
        <button class="toast-close" onclick="closeToast(this)">×</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        closeToast(toast.querySelector('.toast-close'));
    }, 3000);
}

// Global variable to track editing state
let editingHackathonId = null;

// Close toast notification
function closeToast(button) {
    const toast = button.parentElement;
    toast.classList.add('hiding');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Show confirmation modal
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirm');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.add('active');
    
    // Remove old event listeners and add new one
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    document.getElementById('modalConfirm').onclick = () => {
        closeConfirmModal();
        onConfirm();
    };
}

// Close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
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
        showToast('Please enter both email and password', 'error');
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
            showToast('Login successful!', 'success');
            showMainContent();
            loadKeys();
        } else {
            showToast('Invalid credentials', 'error');
        }
    } catch (error) {
        showToast('Login failed', 'error');
        console.error('Login error:', error);
    }
}

// Logout function
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        showToast('Logged out successfully', 'success');
        showLoginForm();
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    } catch (error) {
        showToast('Logout failed', 'error');
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
                ${key.description ? `<div class="key-description">${escapeHtml(key.description)}</div>` : ''}
                <div class="key-value">${escapeHtml(key.apiKey)}</div>
                <div class="key-actions">
                    <button class="btn-secondary" onclick="copyKey('${escapeHtml(key.apiKey)}')">📋 Copy</button>
                    <button class="btn-danger" onclick="deleteKey('${key._id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast('Failed to load API keys', 'error');
        console.error('Load keys error:', error);
    }
}

// Add new API key
async function addKey() {
    const name = document.getElementById('keyName').value.trim();
    const description = document.getElementById('keyDescription').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!name || !apiKey) {
        showToast('Please enter both name and API key', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/keys', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, description, apiKey })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('API key added successfully!', 'success');
            document.getElementById('keyName').value = '';
            document.getElementById('keyDescription').value = '';
            document.getElementById('apiKey').value = '';
            loadKeys();
        } else {
            showToast(data.error || 'Failed to add API key', 'error');
        }
    } catch (error) {
        showToast('Failed to add API key', 'error');
        console.error('Add key error:', error);
    }
}

// Copy API key to clipboard
async function copyKey(apiKey) {
    try {
        await navigator.clipboard.writeText(apiKey);
        showToast('API key copied to clipboard!', 'success');
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
            showToast('API key copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy API key', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Delete API key
async function deleteKey(id) {
    showConfirmModal(
        'Delete API Key',
        'Are you sure you want to delete this API key? This action cannot be undone.',
        async () => {
            try {
                const response = await fetch(`/api/keys/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('API key deleted successfully!', 'success');
                    loadKeys();
                } else {
                    showToast('Failed to delete API key', 'error');
                }
            } catch (error) {
                showToast('Failed to delete API key', 'error');
                console.error('Delete key error:', error);
            }
        }
    );
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Switch between tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Deactivate all tab buttons
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    if (tabName === 'apiKeys') {
        document.getElementById('apiKeysTab').classList.add('active');
        document.querySelector('.tab:first-child').classList.add('active');
    } else if (tabName === 'hackathons') {
        document.getElementById('hackathonsTab').classList.add('active');
        document.querySelector('.tab:last-child').classList.add('active');
        loadHackathons();
    }
}

// Load all hackathons
async function loadHackathons() {
    try {
        const response = await fetch('/api/hackathons');
        const hackathons = await response.json();
        
        const hackathonsList = document.getElementById('hackathonsList');
        
        if (hackathons.length === 0) {
            hackathonsList.innerHTML = '<div class="no-keys">No hackathons saved yet. Add your first one above!</div>';
            return;
        }
        
        hackathonsList.innerHTML = hackathons.map(h => `
            <div class="hackathon-item">
                <div class="hackathon-title">${escapeHtml(h.hackathon_name || 'N/A')}</div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Organizer:</span>
                    <span class="hackathon-value">${escapeHtml(h.organizer || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Deadline:</span>
                    <span class="hackathon-value">${escapeHtml(h.deadline || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Event Date:</span>
                    <span class="hackathon-value">${escapeHtml(h.event_date_duration || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Location:</span>
                    <span class="hackathon-value">${escapeHtml(h.location || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Registration Fee:</span>
                    <span class="hackathon-value">${escapeHtml(h.registration_fee || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Prize Pool:</span>
                    <span class="hackathon-value">${escapeHtml(h.prize_pool || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Eligibility:</span>
                    <span class="hackathon-value">${escapeHtml(h.eligibility || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Team Size:</span>
                    <span class="hackathon-value">${escapeHtml(h.team_size || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Description:</span>
                    <span class="hackathon-value">${escapeHtml(h.short_description || 'N/A')}</span>
                </div>
                
                <div class="hackathon-detail">
                    <span class="hackathon-label">Link:</span>
                    <a href="${escapeHtml(h.official_link)}" target="_blank" class="hackathon-link">${escapeHtml(h.official_link || 'N/A')}</a>
                </div>
                
                <div class="key-date" style="margin-top: 15px; margin-bottom: 10px;">
                    Saved: ${new Date(h.createdAt).toLocaleString()}
                </div>
                
                <div class="key-actions">
                    <button class="btn-secondary" onclick="editHackathon('${h._id}')">✏️ Edit</button>
                    <button class="btn-danger" onclick="deleteHackathon('${h._id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        showToast('Failed to load hackathons', 'error');
        console.error('Load hackathons error:', error);
    }
}

// Add new hackathon
async function addHackathon() {
    const hackathon_name = document.getElementById('hackathonName').value.trim();
    const organizer = document.getElementById('hackathonOrganizer').value.trim();
    const deadline = document.getElementById('hackathonDeadline').value.trim();
    const event_date_duration = document.getElementById('hackathonEventDate').value.trim();
    const location = document.getElementById('hackathonLocation').value.trim();
    const registration_fee = document.getElementById('hackathonRegFee').value.trim();
    const prize_pool = document.getElementById('hackathonPrize').value.trim();
    const short_description = document.getElementById('hackathonDescription').value.trim();
    const eligibility = document.getElementById('hackathonEligibility').value.trim();
    const team_size = document.getElementById('hackathonTeamSize').value.trim();
    const official_link = document.getElementById('hackathonLink').value.trim();
    
    if (!hackathon_name) {
        showToast('Please enter hackathon name', 'error');
        return;
    }
    
    try {
        const isEditing = editingHackathonId !== null;
        const url = isEditing ? `/api/hackathons/${editingHackathonId}` : '/api/hackathons';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                hackathon_name,
                organizer,
                deadline,
                event_date_duration,
                location,
                registration_fee,
                prize_pool,
                short_description,
                eligibility,
                team_size,
                official_link
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(isEditing ? 'Hackathon updated successfully!' : 'Hackathon added successfully!', 'success');
            clearHackathonForm();
            loadHackathons();
        } else {
            showToast(data.error || `Failed to ${isEditing ? 'update' : 'add'} hackathon`, 'error');
        }
    } catch (error) {
        showToast(`Failed to ${editingHackathonId ? 'update' : 'add'} hackathon`, 'error');
        console.error('Add/Update hackathon error:', error);
    }
}

// Edit hackathon - populate form with existing data
async function editHackathon(id) {
    try {
        const response = await fetch('/api/hackathons');
        const hackathons = await response.json();
        
        const hackathon = hackathons.find(h => h._id === id);
        
        if (!hackathon) {
            showToast('Hackathon not found', 'error');
            return;
        }
        
        // Populate form
        document.getElementById('hackathonName').value = hackathon.hackathon_name || '';
        document.getElementById('hackathonOrganizer').value = hackathon.organizer || '';
        document.getElementById('hackathonDeadline').value = hackathon.deadline || '';
        document.getElementById('hackathonEventDate').value = hackathon.event_date_duration || '';
        document.getElementById('hackathonLocation').value = hackathon.location || '';
        document.getElementById('hackathonRegFee').value = hackathon.registration_fee || '';
        document.getElementById('hackathonPrize').value = hackathon.prize_pool || '';
        document.getElementById('hackathonDescription').value = hackathon.short_description || '';
        document.getElementById('hackathonEligibility').value = hackathon.eligibility || '';
        document.getElementById('hackathonTeamSize').value = hackathon.team_size || '';
        document.getElementById('hackathonLink').value = hackathon.official_link || '';
        
        // Set editing state
        editingHackathonId = id;
        
        // Update button text
        document.getElementById('hackathonSubmitBtn').textContent = 'Update Hackathon';
        document.getElementById('hackathonCancelBtn').style.display = 'inline-block';
        
        // Scroll to form
        document.querySelector('.add-key-section').scrollIntoView({ behavior: 'smooth' });
        
        showToast('Edit mode: Modify the details and click Update', 'success');
    } catch (error) {
        showToast('Failed to load hackathon details', 'error');
        console.error('Edit hackathon error:', error);
    }
}

// Clear hackathon form
function clearHackathonForm() {
    document.getElementById('hackathonName').value = '';
    document.getElementById('hackathonOrganizer').value = '';
    document.getElementById('hackathonDeadline').value = '';
    document.getElementById('hackathonEventDate').value = '';
    document.getElementById('hackathonLocation').value = '';
    document.getElementById('hackathonRegFee').value = '';
    document.getElementById('hackathonPrize').value = '';
    document.getElementById('hackathonDescription').value = '';
    document.getElementById('hackathonEligibility').value = '';
    document.getElementById('hackathonTeamSize').value = '';
    document.getElementById('hackathonLink').value = '';
    
    // Reset editing state
    editingHackathonId = null;
    
    // Reset button text
    document.getElementById('hackathonSubmitBtn').textContent = 'Add Hackathon';
    document.getElementById('hackathonCancelBtn').style.display = 'none';
}

// Delete hackathon
async function deleteHackathon(id) {
    showConfirmModal(
        'Delete Hackathon',
        'Are you sure you want to delete this hackathon? This action cannot be undone.',
        async () => {
            try {
                const response = await fetch(`/api/hackathons/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('Hackathon deleted successfully!', 'success');
                    loadHackathons();
                } else {
                    showToast('Failed to delete hackathon', 'error');
                }
            } catch (error) {
                showToast('Failed to delete hackathon', 'error');
                console.error('Delete hackathon error:', error);
            }
        }
    );
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Close modal when clicking outside
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeConfirmModal();
            }
        });
    }
    
    // Handle Enter key press
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
