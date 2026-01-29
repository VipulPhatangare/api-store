require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const CryptoJS = require('crypto-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// API Key Schema
const apiKeySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    encryptedKey: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};

// Routes

// Login endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === 'vipulphatangare3@gmail.com' && password === '0831') {
        req.session.isAuthenticated = true;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
});

// Check authentication status
app.get('/api/auth-status', (req, res) => {
    res.json({ isAuthenticated: !!req.session.isAuthenticated });
});

// Get all API keys
app.get('/api/keys', isAuthenticated, async (req, res) => {
    try {
        const keys = await ApiKey.find().sort({ createdAt: -1 });
        
        // Decrypt keys before sending
        const decryptedKeys = keys.map(key => ({
            _id: key._id,
            name: key.name,
            description: key.description,
            apiKey: CryptoJS.AES.decrypt(key.encryptedKey, process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8),
            createdAt: key.createdAt
        }));
        
        res.json(decryptedKeys);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
});

// Add new API key
app.post('/api/keys', isAuthenticated, async (req, res) => {
    try {
        const { name, description, apiKey } = req.body;
        
        if (!name || !apiKey) {
            return res.status(400).json({ error: 'Name and API key are required' });
        }
        
        // Encrypt the API key
        const encryptedKey = CryptoJS.AES.encrypt(apiKey, process.env.ENCRYPTION_KEY).toString();
        
        const newKey = new ApiKey({
            name,
            description: description || '',
            encryptedKey
        });
        
        await newKey.save();
        
        res.json({
            success: true,
            message: 'API key added successfully',
            data: {
                _id: newKey._id,
                name: newKey.name,
                description: newKey.description,
                apiKey: apiKey,
                createdAt: newKey.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add API key' });
    }
});

// Delete API key
app.delete('/api/keys/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await ApiKey.findByIdAndDelete(id);
        res.json({ success: true, message: 'API key deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/activate', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
