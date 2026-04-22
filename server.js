const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const Razorpay = require('razorpay');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret
const JWT_SECRET = process.env.SECRET_KEY || 'your-secret-key-change-this';

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY || 'your-mailgun-api-key',
    url: 'https://api.mailgun.net' // Use EU endpoint if needed: https://api.eu.mailgun.net
});

console.log('🔧 Mailgun initialized');
console.log('📧 Mailgun Domain:', process.env.MAILGUN_DOMAIN);
console.log('📧 Mailgun API Key:', process.env.MAILGUN_API_KEY ? '✅ Set' : '❌ Not set');

// Initialize Razorpay client
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// MongoDB connection
let db;
let waitlistCollection;
let usersCollection;
let productsCollection;
let voteTransactionsCollection;
let suggestionsCollection;
let testReportsCollection;
let subscriptionTransactionsCollection;
let referralsCollection;
let rewardsCollection;
let feedbackCollection;
let isDbConnected = false;

async function connectToDatabase() {
    try {
        console.log('🔌 Attempting to connect to MongoDB...');
        console.log('📍 MONGO_URL:', process.env.MONGO_URL ? 'Set (length: ' + process.env.MONGO_URL.length + ')' : 'Not set');
        console.log('📍 DB_NAME:', process.env.DB_NAME);
        
        if (!process.env.MONGO_URL) {
            throw new Error('MONGO_URL environment variable is not set');
        }
        
        const client = new MongoClient(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            connectTimeoutMS: 10000,
        });
        
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        // Test the connection
        await client.db().admin().ping();
        console.log('✅ MongoDB ping successful');
        
        db = client.db(process.env.DB_NAME || 'choosepure_db');
        waitlistCollection = db.collection('waitlist');
        usersCollection = db.collection('users');
        productsCollection = db.collection('products');
        voteTransactionsCollection = db.collection('vote_transactions');
        
        // Verify collections exist
        const collections = await db.listCollections().toArray();
        console.log('📚 Available collections:', collections.map(c => c.name).join(', '));
        
        // Create index on email for uniqueness
        await waitlistCollection.createIndex({ email: 1 }, { unique: true });
        console.log('✅ Waitlist collection initialized');
        console.log('✅ Users collection initialized');
        
        // Create indexes for products collection
        await productsCollection.createIndex({ status: 1, totalVotes: -1 });
        console.log('✅ Products collection initialized');
        
        // Create indexes for vote_transactions collection
        await voteTransactionsCollection.createIndex({ productId: 1 });
        await voteTransactionsCollection.createIndex({ createdAt: -1 });
        console.log('✅ Vote transactions collection initialized');
        
        // Initialize product_suggestions collection
        suggestionsCollection = db.collection('product_suggestions');
        await suggestionsCollection.createIndex({ status: 1, upvotes: -1 });
        await suggestionsCollection.createIndex({ createdAt: -1 });
        console.log('✅ Product suggestions collection initialized');
        
        // Initialize test_reports collection
        testReportsCollection = db.collection('test_reports');
        await testReportsCollection.createIndex({ published: 1, createdAt: -1 });
        await testReportsCollection.createIndex({ category: 1 });
        console.log('✅ Test reports collection initialized');
        
        // Initialize subscription_transactions collection
        subscriptionTransactionsCollection = db.collection('subscription_transactions');
        await subscriptionTransactionsCollection.createIndex({ userId: 1 });
        await subscriptionTransactionsCollection.createIndex({ createdAt: -1 });
        console.log('✅ Subscription transactions collection initialized');
        
        // Create indexes for users collection
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await usersCollection.createIndex({ role: 1 });
        console.log('✅ Users collection indexes created');

        // Create unique sparse index on users.referral_code
        await usersCollection.createIndex({ referral_code: 1 }, { unique: true, sparse: true });
        console.log('✅ Users referral_code index created');

        // Initialize referrals collection
        referralsCollection = db.collection('referrals');
        await referralsCollection.createIndex({ referrer_user_id: 1 });
        await referralsCollection.createIndex({ referee_user_id: 1 });
        await referralsCollection.createIndex({ referrer_user_id: 1, referee_user_id: 1 }, { unique: true });
        console.log('✅ Referrals collection initialized');

        // Initialize rewards collection
        rewardsCollection = db.collection('rewards');
        await rewardsCollection.createIndex({ user_id: 1 });
        console.log('✅ Rewards collection initialized');

        // Initialize feedback collection
        feedbackCollection = db.collection('feedback');
        await feedbackCollection.createIndex({ createdAt: -1 });
        console.log('✅ Feedback collection initialized');

        // Check if admin user exists
        const adminCount = await usersCollection.countDocuments({ role: 'admin' });
        console.log('👤 Admin users found:', adminCount);
        
        isDbConnected = true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('Full error:', error);
        isDbConnected = false;
        
        // Retry connection after 5 seconds
        setTimeout(() => {
            console.log('🔄 Retrying database connection...');
            connectToDatabase();
        }, 5000);
    }
}

connectToDatabase();

// Generate a unique referral code in the format CP-XXXXX
async function generateReferralCode(usersCol) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const bytes = crypto.randomBytes(5);
        let code = 'CP-';
        for (let i = 0; i < 5; i++) {
            code += chars[bytes[i] % chars.length];
        }

        const existing = await usersCol.findOne({ referral_code: code });
        if (!existing) {
            return code;
        }
    }

    throw new Error('Failed to generate unique referral code after ' + maxRetries + ' attempts');
}

// Extend a user's subscription expiry by 1 calendar month and increment freeMonthsEarned
async function extendSubscriptionExpiry(usersCollection, userId) {
    const user = await usersCollection.findOne({ _id: userId });
    const now = new Date();
    let baseDate;

    if (user && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > now) {
        baseDate = new Date(user.subscriptionExpiry);
    } else {
        baseDate = now;
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + 1);

    await usersCollection.updateOne(
        { _id: userId },
        {
            $set: { subscriptionExpiry: newExpiry },
            $inc: { freeMonthsEarned: 1 }
        }
    );

    return newExpiry;
}

// Middleware
// CORS: Static origin array allows listed web origins with credentials.
// React Native mobile clients send no Origin header — the cors package
// does not block requests without an Origin, so mobile requests pass through.
app.use(cors({
    origin: ['https://choosepure.in', 'https://www.choosepure.in', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// WhatsApp integration function
async function addToWhatsAppCommunity(phone, name) {
    // Option 1: Using WhatsApp Business API (requires setup)
    // You'll need to implement this based on your WhatsApp Business API setup
    
    // Option 2: Generate WhatsApp group invite link
    const whatsappGroupLink = process.env.WHATSAPP_GROUP_LINK;
    const message = `Hi ${name}! Welcome to ChoosePure. Join our community: ${whatsappGroupLink}`;
    
    // For now, we'll return the invite link to send via email
    return whatsappGroupLink;
}

// Authentication middleware
function authenticateAdmin(req, res, next) {
    const token = req.cookies.admin_token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
}

// User authentication middleware
async function authenticateUser(req, res, next) {
    // Check Authorization header first (mobile), then fall back to cookie (web)
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    }
    if (!token) {
        token = req.cookies.user_token;
    }
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { ObjectId } = require('mongodb');
        const user = await usersCollection.findOne({ 
            _id: new ObjectId(decoded.id), 
            role: 'user' 
        });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }
        
        req.user = { 
            id: user._id, 
            email: user.email, 
            name: user.name, 
            phone: user.phone,
            subscriptionStatus: user.subscriptionStatus || 'free',
            referral_code: user.referral_code || null,
            freeMonthsEarned: user.freeMonthsEarned || 0,
            subscriptionExpiry: user.subscriptionExpiry || null,
            auth_provider: user.auth_provider || 'email'
        };
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication required' 
        });
    }
}

// Subscribed user authentication middleware
async function authenticateSubscribedUser(req, res, next) {
    // First run authenticateUser
    await authenticateUser(req, res, () => {
        // After authenticateUser succeeds, check subscription status
        if (!req.user || req.user.subscriptionStatus !== 'subscribed' && req.user.subscriptionStatus !== 'cancelled') {
            return res.status(403).json({ 
                success: false, 
                message: 'Subscription required',
                redirect: '/purity-wall'
            });
        }
        next();
    });
}

// User registration endpoint
app.post('/api/user/register', async (req, res) => {
    try {
        if (!isDbConnected || !usersCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { name, email, phone, pincode, password, referral_code } = req.body;

        // Validate required fields
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!email) missingFields.push('email');
        if (!phone) missingFields.push('phone');
        if (!pincode) missingFields.push('pincode');
        if (!password) missingFields.push('password');

        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email address' 
            });
        }

        // Validate phone (exactly 10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid 10-digit phone number' 
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 8 characters' 
            });
        }

        // Check email uniqueness
        const existingUser = await usersCollection.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already registered' 
            });
        }

        // Check phone uniqueness
        const existingPhone = await usersCollection.findOne({ phone: phone });
        if (existingPhone) {
            return res.status(400).json({ 
                success: false, 
                message: 'This phone number is already registered' 
            });
        }

        // Validate referral code if provided
        let referrerUser = null;
        if (referral_code) {
            referrerUser = await usersCollection.findOne({ referral_code: referral_code });
            if (!referrerUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid referral code' 
                });
            }

            // Check self-referral (same email or phone)
            if (referrerUser.email === email || referrerUser.phone === phone) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Cannot use own referral code' 
                });
            }
        }

        // Generate unique referral code for the new user
        const newUserReferralCode = await generateReferralCode(usersCollection);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user document
        const result = await usersCollection.insertOne({
            name,
            email,
            phone,
            pincode,
            password: hashedPassword,
            role: 'user',
            subscriptionStatus: 'free',
            referral_code: newUserReferralCode,
            referred_by: referrerUser ? referrerUser._id : null,
            freeMonthsEarned: 0,
            subscriptionExpiry: null,
            createdAt: new Date()
        });

        // Create referral record if a valid referral code was used
        if (referrerUser) {
            await referralsCollection.insertOne({
                referrer_user_id: referrerUser._id,
                referee_user_id: result.insertedId,
                status: 'pending',
                reward_granted: false,
                created_at: new Date(),
                completed_at: null
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: result.insertedId, 
                email: email, 
                role: 'user' 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set httpOnly cookie
        res.cookie('user_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log('✅ User registered:', email, referrerUser ? `(referred by ${referrerUser.email})` : '(no referral)');

        res.json({ 
            success: true, 
            token,
            user: { name, email, subscriptionStatus: 'free', referral_code: newUserReferralCode } 
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Registration failed' 
        });
    }
});

// User login endpoint
app.post('/api/user/login', async (req, res) => {
    try {
        if (!isDbConnected || !usersCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user with matching email and role
        const user = await usersCollection.findOne({ 
            email: email, 
            role: 'user' 
        });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Backfill referral code for existing users who don't have one
        let referralCode = user.referral_code;
        if (!referralCode) {
            referralCode = await generateReferralCode(usersCollection);
            await usersCollection.updateOne(
                { _id: user._id },
                { $set: { referral_code: referralCode } }
            );
        }

        // Update last_login timestamp
        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { last_login: new Date() } }
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email, 
                role: 'user' 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set httpOnly cookie
        res.cookie('user_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log('✅ User logged in:', email);

        res.json({ 
            success: true, 
            token,
            user: { 
                name: user.name, 
                email: user.email, 
                phone: user.phone,
                subscriptionStatus: user.subscriptionStatus || 'free',
                referral_code: referralCode
            } 
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed' 
        });
    }
});

// User logout endpoint
app.post('/api/user/logout', (req, res) => {
    res.clearCookie('user_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.json({ success: true, message: 'Logged out successfully' });
});

// Get Google Client ID for frontend initialization
app.get('/api/config/google-client-id', (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return res.status(503).json({
            success: false,
            message: 'Google authentication is not configured'
        });
    }
    res.json({ clientId });
});

// Google authentication endpoint (sign-in and auto-registration)
app.post('/api/user/google-auth', async (req, res) => {
    try {
        if (!isDbConnected || !usersCollection) {
            return res.status(500).json({
                success: false,
                message: 'Database not connected'
            });
        }

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
            return res.status(503).json({
                success: false,
                message: 'Google authentication is not configured'
            });
        }

        const { credential, referral_code } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }

        // Verify Google ID token
        let payload;
        try {
            const client = new OAuth2Client(googleClientId);
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: googleClientId
            });
            payload = ticket.getPayload();
        } catch (verifyError) {
            console.error('❌ Google token verification failed:', verifyError.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token'
            });
        }

        const { email, name, sub, email_verified } = payload;

        // Check email is verified
        if (!email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Google account email is not verified'
            });
        }

        // Look up user by email
        const existingUser = await usersCollection.findOne({ email: email });

        if (existingUser) {
            // Check auth_provider
            const authProvider = existingUser.auth_provider || 'email';

            if (authProvider === 'email') {
                // Existing email/password user — reject
                return res.status(409).json({
                    success: false,
                    message: 'This email is registered with email/password. Please sign in with your password.'
                });
            }

            // Existing Google user — sign in
            await usersCollection.updateOne(
                { _id: existingUser._id },
                { $set: { last_login: new Date() } }
            );

            // Backfill referral code if missing
            let referralCode = existingUser.referral_code;
            if (!referralCode) {
                referralCode = await generateReferralCode(usersCollection);
                await usersCollection.updateOne(
                    { _id: existingUser._id },
                    { $set: { referral_code: referralCode } }
                );
            }

            const token = jwt.sign(
                { id: existingUser._id, email: existingUser.email, role: 'user' },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.cookie('user_token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            console.log('✅ Google user signed in:', email);

            return res.json({
                success: true,
                token,
                user: {
                    name: existingUser.name,
                    email: existingUser.email,
                    phone: existingUser.phone || null,
                    subscriptionStatus: existingUser.subscriptionStatus || 'free',
                    referral_code: referralCode,
                    auth_provider: 'google'
                },
                isNewUser: false
            });
        }

        // New user — auto-register
        const newUserReferralCode = await generateReferralCode(usersCollection);

        // Handle referral code
        let referrerUser = null;
        if (referral_code) {
            referrerUser = await usersCollection.findOne({ referral_code: referral_code });
            // Ignore invalid codes silently
            if (referrerUser) {
                // Check self-referral
                if (referrerUser.email === email) {
                    referrerUser = null; // Ignore self-referral
                }
            }
        }

        const newUser = {
            name: name || email.split('@')[0],
            email,
            phone: null,
            pincode: null,
            password: null,
            role: 'user',
            auth_provider: 'google',
            google_id: sub,
            subscriptionStatus: 'free',
            referral_code: newUserReferralCode,
            referred_by: referrerUser ? referrerUser._id : null,
            freeMonthsEarned: 0,
            subscriptionExpiry: null,
            createdAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);

        // Create referral record if valid referrer
        if (referrerUser) {
            await referralsCollection.insertOne({
                referrer_user_id: referrerUser._id,
                referee_user_id: result.insertedId,
                status: 'pending',
                reward_granted: false,
                created_at: new Date(),
                completed_at: null
            });
        }

        const token = jwt.sign(
            { id: result.insertedId, email: email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('user_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log('✅ Google user registered:', email, referrerUser ? `(referred by ${referrerUser.email})` : '(no referral)');

        return res.json({
            success: true,
            token,
            user: {
                name: newUser.name,
                email: newUser.email,
                phone: null,
                subscriptionStatus: 'free',
                referral_code: newUserReferralCode,
                auth_provider: 'google'
            },
            isNewUser: true
        });
    } catch (error) {
        console.error('❌ Google auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
});

// Get current user profile (session check)
app.get('/api/user/me', authenticateUser, (req, res) => {
    res.json({ 
        success: true, 
        user: { 
            name: req.user.name, 
            email: req.user.email, 
            phone: req.user.phone,
            subscriptionStatus: req.user.subscriptionStatus,
            referral_code: req.user.referral_code,
            freeMonthsEarned: req.user.freeMonthsEarned,
            subscriptionExpiry: req.user.subscriptionExpiry,
            auth_provider: req.user.auth_provider
        } 
    });
});

// Profile completion endpoint (for Google users to add phone/pincode)
app.put('/api/user/profile', authenticateUser, async (req, res) => {
    try {
        if (!isDbConnected || !usersCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { phone, pincode } = req.body;

        // Validate phone (exactly 10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phone || !phoneRegex.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid 10-digit phone number' 
            });
        }

        // Validate pincode (exactly 6 digits)
        const pincodeRegex = /^[0-9]{6}$/;
        if (!pincode || !pincodeRegex.test(pincode)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid 6-digit pincode' 
            });
        }

        // Check phone uniqueness (exclude current user)
        const { ObjectId } = require('mongodb');
        const existingPhone = await usersCollection.findOne({ 
            phone: phone, 
            _id: { $ne: new ObjectId(req.user.id) } 
        });
        if (existingPhone) {
            return res.status(400).json({ 
                success: false, 
                message: 'This phone number is already registered' 
            });
        }

        // Update user document
        await usersCollection.updateOne(
            { _id: new ObjectId(req.user.id) },
            { $set: { phone, pincode } }
        );

        console.log('✅ Profile updated for user:', req.user.email);

        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });
    } catch (error) {
        console.error('❌ Profile update error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Profile update failed' 
        });
    }
});

// User forgot password endpoint
app.post('/api/user/forgot-password', async (req, res) => {
    const { email } = req.body;

    // Always return this same response to prevent email enumeration
    const successResponse = {
        success: true,
        message: 'If the email exists, a reset link has been sent'
    };

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    try {
        if (!isDbConnected || !usersCollection) {
            return res.status(500).json({
                success: false,
                message: 'Database not connected'
            });
        }

        // Find user with role "user"
        const user = await usersCollection.findOne({
            email: email,
            role: 'user'
        });

        // If user not found, still return success to prevent email enumeration
        if (!user) {
            console.log('⚠️ User password reset requested for non-existent email:', email);
            return res.json(successResponse);
        }

        // Reject password reset for Google users
        if ((user.auth_provider || 'email') === 'google') {
            return res.status(400).json({
                success: false,
                message: 'This account uses Google sign-in. Please sign in with Google.'
            });
        }

        // Generate JWT reset token (valid for 1 hour)
        const resetToken = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store reset token and expiry in user document
        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    reset_token: resetToken,
                    reset_token_expires: new Date(Date.now() + 3600000) // 1 hour
                }
            }
        );

        // Send password reset email via Mailgun
        const resetLink = `https://choosepure.in/user/reset-password?token=${resetToken}`;

        console.log('📧 Sending user password reset email to:', email);
        console.log('🔗 Reset link:', resetLink);

        try {
            const messageData = {
                from: process.env.MAILGUN_FROM_EMAIL ? `ChoosePure <${process.env.MAILGUN_FROM_EMAIL}>` : 'ChoosePure <support@choosepure.in>',
                to: email,
                subject: 'Password Reset - ChoosePure',
                'h:Reply-To': 'support@choosepure.in',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1E7F5C;">Password Reset Request</h2>
                        <p>You requested to reset your password for your ChoosePure account.</p>
                        
                        <p>Click the button below to reset your password:</p>
                        
                        <div style="margin: 30px 0;">
                            <a href="${resetLink}" 
                               style="background: #1E7F5C; color: white; padding: 15px 30px; 
                                      text-decoration: none; border-radius: 8px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            This link will expire in 1 hour.<br>
                            If you didn't request this, please ignore this email.
                        </p>
                        
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            Or copy and paste this link:<br>
                            ${resetLink}
                        </p>
                    </div>
                `
            };

            const result = await mg.messages.create(process.env.MAILGUN_DOMAIN || 'choosepure.in', messageData);
            console.log('✅ User password reset email sent successfully:', result);
        } catch (emailError) {
            // Log error server-side but still return success to user
            console.error('❌ Failed to send user reset email:', emailError);
            console.error('Error details:', {
                message: emailError.message,
                status: emailError.status,
                details: emailError.details
            });
        }

        res.json(successResponse);
    } catch (error) {
        console.error('❌ User forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again.'
        });
    }
});

// User reset password endpoint
app.post('/api/user/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 8 characters'
        });
    }

    try {
        if (!isDbConnected || !usersCollection) {
            return res.status(500).json({
                success: false,
                message: 'Database not connected'
            });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Find user with matching reset_token
        const { ObjectId } = require('mongodb');
        const user = await usersCollection.findOne({
            _id: new ObjectId(decoded.id),
            reset_token: token,
            role: 'user'
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check if reset token has expired
        if (user.reset_token_expires && new Date() > new Date(user.reset_token_expires)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Hash new password with bcrypt (cost 12)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update password and clear reset token fields
        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    password: hashedPassword,
                    reset_token: null,
                    reset_token_expires: null
                }
            }
        );

        console.log('✅ User password reset successful for:', user.email);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('❌ User reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again.'
        });
    }
});

// Send email to user
async function sendUserEmail(email, name, whatsappLink) {
    try {
        const messageData = {
            from: 'ChoosePure <support@choosepure.in>',
            to: email,
            subject: 'Welcome to ChoosePure Community!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1E7F5C;">Welcome to ChoosePure, ${name}!</h2>
                    <p>Thank you for joining our community of parents who care about food purity.</p>
                    
                    <h3>What's Next?</h3>
                    <ol>
                        <li>Join our WhatsApp community to stay updated</li>
                        <li>Participate in voting for products to test</li>
                        <li>Get access to test reports as they're published</li>
                    </ol>
                    
                    <div style="margin: 30px 0;">
                        <a href="${whatsappLink}" 
                           style="background: #1E7F5C; color: white; padding: 15px 30px; 
                                  text-decoration: none; border-radius: 8px; display: inline-block;">
                            Join WhatsApp Community
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you have any questions, feel free to reply to this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        ChoosePure - Independent Food Testing for Parents<br>
                        No brand sponsorship. Only facts parents can trust.
                    </p>
                </div>
            `
        };
        
        const result = await mg.messages.create(process.env.MAILGUN_DOMAIN || 'choosepure.in', messageData);
        console.log('✅ User email sent:', result);
        return result;
    } catch (error) {
        console.error('❌ Failed to send user email:', error);
        throw error;
    }
}

// Send notification to admin
async function sendAdminEmail(userData) {
    try {
        console.log('📧 Preparing admin notification email...');
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'support@choosepure.in';
        
        const messageData = {
            from: 'ChoosePure Notifications <noreply@choosepure.in>',
            to: adminEmail,
            subject: 'New Waitlist Signup - ChoosePure',
            'h:Reply-To': 'support@choosepure.in',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>New Waitlist Signup</h2>
                    <table style="border-collapse: collapse; width: 100%;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${userData.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${userData.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${userData.phone}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Pincode:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${userData.pincode}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Signed up:</strong></td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
            `
        };
        
        console.log('📤 Sending admin notification to:', adminEmail);
        const result = await mg.messages.create(process.env.MAILGUN_DOMAIN || 'choosepure.in', messageData);
        console.log('✅ Admin email sent successfully:', result.id);
        return result;
    } catch (error) {
        console.error('❌ Failed to send admin email:', error.message);
        console.error('Error details:', {
            status: error.status,
            details: error.details
        });
        throw error;
    }
}

// Waitlist submission endpoint
app.post('/api/waitlist', async (req, res) => {
    const { name, email, phone, pincode } = req.body;
    
    // Validation
    if (!name || !email || !phone || !pincode) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please enter a valid email address' 
        });
    }
    
    // Validate phone format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please enter a valid 10-digit phone number' 
        });
    }
    
    // Validate pincode format (6 digits)
    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(pincode)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Please enter a valid 6-digit pincode' 
        });
    }
    
    try {
        const userData = { 
            name, 
            email, 
            phone, 
            pincode, 
            created_at: new Date(),
            status: 'active'
        };
        
        // Save to MongoDB database
        let dbSaveSuccess = false;
        try {
            if (!waitlistCollection) {
                console.error('❌ Database collection not initialized!');
                console.log('Attempting to reconnect...');
                await connectToDatabase();
                
                // Wait a bit for connection
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            if (waitlistCollection) {
                console.log('💾 Saving to database:', { name, email, phone, pincode });
                const result = await waitlistCollection.insertOne(userData);
                console.log('✅ User saved to database with ID:', result.insertedId);
                userData._id = result.insertedId;
                dbSaveSuccess = true;
            } else {
                console.error('❌ Database still not connected after reconnect attempt');
            }
        } catch (dbError) {
            if (dbError.code === 11000) { // Duplicate email in MongoDB
                console.log('⚠️ Duplicate email detected:', email);
                return res.status(400).json({ 
                    success: false, 
                    message: 'This email is already registered' 
                });
            }
            console.error('❌ Database error:', dbError);
            console.error('Error stack:', dbError.stack);
        }
        
        if (!dbSaveSuccess) {
            console.error('⚠️ WARNING: User data was not saved to database!');
        }
        
        // Get WhatsApp community link
        const whatsappLink = process.env.WHATSAPP_GROUP_LINK || 'https://chat.whatsapp.com/your-group-invite-link';
        
        // Send emails (both user and admin)
        console.log('📧 Attempting to send emails...');
        try {
            const emailPromises = [
                sendUserEmail(email, name, whatsappLink)
                    .then(() => console.log('✅ User email sent to:', email))
                    .catch(err => console.error('❌ Failed to send user email:', err.message)),
                sendAdminEmail(userData)
                    .then(() => console.log('✅ Admin email sent to: support@choosepure.in'))
                    .catch(err => console.error('❌ Failed to send admin email:', err.message))
            ];
            
            await Promise.allSettled(emailPromises);
            console.log('📧 Email sending completed');
        } catch (emailError) {
            console.error('❌ Email sending error:', emailError);
        }
        
        // Log to console for debugging
        console.log('📝 New waitlist signup:', userData);
        
        // Always return success to user
        res.json({ 
            success: true, 
            message: 'Successfully joined the waitlist! Check your email for the WhatsApp community link.',
            whatsappLink: whatsappLink
        });
        
    } catch (error) {
        console.error('❌ Error processing waitlist:', error);
        
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred. Please try again.' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        database: isDbConnected ? 'connected' : 'disconnected',
        collections: {
            waitlist: waitlistCollection ? 'initialized' : 'not initialized',
            users: usersCollection ? 'initialized' : 'not initialized'
        },
        timestamp: new Date().toISOString()
    });
});

// Test database write
app.get('/api/test-db-write', async (req, res) => {
    try {
        if (!waitlistCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }
        
        const testData = {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            phone: '9999999999',
            pincode: '560001',
            created_at: new Date(),
            status: 'test'
        };
        
        console.log('🧪 Testing database write...');
        const result = await waitlistCollection.insertOne(testData);
        console.log('✅ Test data inserted:', result.insertedId);
        
        // Count total entries
        const count = await waitlistCollection.countDocuments();
        
        res.json({ 
            success: true, 
            message: 'Test data inserted successfully',
            insertedId: result.insertedId,
            totalEntries: count
        });
    } catch (error) {
        console.error('❌ Test write failed:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Test write failed',
            error: error.message
        });
    }
});

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
    try {
        console.log('🧪 Testing Mailgun configuration...');
        console.log('   API Key:', process.env.MAILGUN_API_KEY ? `${process.env.MAILGUN_API_KEY.substring(0, 10)}...` : 'Not set');
        console.log('   Domain:', process.env.MAILGUN_DOMAIN);
        console.log('   From Email:', process.env.MAILGUN_FROM_EMAIL);
        
        if (!process.env.MAILGUN_API_KEY) {
            throw new Error('MAILGUN_API_KEY is not set');
        }
        
        if (!process.env.MAILGUN_DOMAIN) {
            throw new Error('MAILGUN_DOMAIN is not set');
        }
        
        const testEmail = req.query.email || 'support@choosepure.in';
        
        const messageData = {
            from: 'ChoosePure <support@choosepure.in>',
            to: testEmail,
            subject: 'Test Email from ChoosePure',
            text: 'This is a test email to verify Mailgun configuration.',
            html: '<h1>Test Email</h1><p>This is a test email to verify Mailgun configuration.</p>'
        };
        
        console.log('📤 Sending test email to:', testEmail);
        const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
        console.log('✅ Test email sent successfully:', result);
        
        res.json({ 
            success: true, 
            message: `Test email sent successfully to ${testEmail}! Check inbox.`,
            messageId: result.id,
            status: result.status,
            details: result
        });
    } catch (error) {
        console.error('❌ Test email failed:', error);
        console.error('Error details:', {
            message: error.message,
            status: error.status,
            details: error.details
        });
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send test email',
            error: error.message,
            status: error.status,
            details: error.details || 'No additional details'
        });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve polling page
app.get('/polling', (req, res) => {
    res.sendFile(path.join(__dirname, 'polling.html'));
});

// Serve admin login page
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

// Serve forgot password page
app.get('/admin/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-forgot-password.html'));
});

// Serve reset password page
app.get('/admin/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-reset-password.html'));
});

// Serve user reset password page
app.get('/user/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'user-reset-password.html'));
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
        });
    }
    
    try {
        // Wait for database connection if not ready
        if (!isDbConnected || !usersCollection) {
            console.log('⏳ Waiting for database connection...');
            
            // Wait up to 10 seconds for connection
            let attempts = 0;
            while ((!isDbConnected || !usersCollection) && attempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
            if (!isDbConnected || !usersCollection) {
                console.error('❌ Database still not connected after waiting');
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database not connected' 
                });
            }
        }
        
        console.log('🔍 Looking up admin user:', email);
        
        // Find admin user
        const admin = await usersCollection.findOne({ 
            email: email,
            role: 'admin'
        });
        
        if (!admin) {
            console.log('❌ Admin not found:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        console.log('✅ Admin found, verifying password...');
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
        
        // Update last login
        await usersCollection.updateOne(
            { _id: admin._id },
            { $set: { last_login: new Date() } }
        );
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email, 
                role: admin.role 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Set cookie
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        console.log('✅ Admin logged in:', email);
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            admin: {
                name: admin.fname,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Login failed: ' + error.message 
        });
    }
});

// Admin logout endpoint
app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Forgot password endpoint
app.post('/api/admin/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required' 
        });
    }
    
    try {
        if (!isDbConnected || !usersCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }
        
        // Find admin user
        const admin = await usersCollection.findOne({ 
            email: email,
            role: 'admin'
        });
        
        // Always return success to prevent email enumeration
        if (!admin) {
            console.log('⚠️ Password reset requested for non-existent email:', email);
            return res.json({ 
                success: true, 
                message: 'If the email exists, a reset link has been sent' 
            });
        }
        
        // Generate reset token (valid for 1 hour)
        const resetToken = jwt.sign(
            { id: admin._id, email: admin.email },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // Save reset token to database
        await usersCollection.updateOne(
            { _id: admin._id },
            { 
                $set: { 
                    reset_token: resetToken,
                    reset_token_expires: new Date(Date.now() + 3600000) // 1 hour
                } 
            }
        );
        
        // Send reset email
        const resetLink = `${req.protocol}://${req.get('host')}/admin/reset-password?token=${resetToken}`;
        
        console.log('📧 Sending password reset email to:', email);
        console.log('🔗 Reset link:', resetLink);
        
        try {
            const messageData = {
                from: 'ChoosePure Admin <noreply@choosepure.in>',
                to: email,
                subject: 'Password Reset - ChoosePure Admin',
                'h:Reply-To': 'support@choosepure.in',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1E7F5C;">Password Reset Request</h2>
                        <p>You requested to reset your password for the ChoosePure Admin Panel.</p>
                        
                        <p>Click the button below to reset your password:</p>
                        
                        <div style="margin: 30px 0;">
                            <a href="${resetLink}" 
                               style="background: #1E7F5C; color: white; padding: 15px 30px; 
                                      text-decoration: none; border-radius: 8px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #666; font-size: 14px;">
                            This link will expire in 1 hour.<br>
                            If you didn't request this, please ignore this email.
                        </p>
                        
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            Or copy and paste this link:<br>
                            ${resetLink}
                        </p>
                    </div>
                `
            };
            
            console.log('📤 Calling Mailgun API...');
            const result = await mg.messages.create(process.env.MAILGUN_DOMAIN || 'choosepure.in', messageData);
            console.log('✅ Password reset email sent successfully:', result);
        } catch (emailError) {
            console.error('❌ Failed to send reset email:', emailError);
            console.error('Error details:', {
                message: emailError.message,
                status: emailError.status,
                details: emailError.details
            });
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send reset email: ' + emailError.message 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Password reset link sent to your email' 
        });
    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process request' 
        });
    }
});

// Reset password endpoint
app.post('/api/admin/reset-password', async (req, res) => {
    const { token, password } = req.body;
    
    if (!token || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Token and password are required' 
        });
    }
    
    if (password.length < 8) {
        return res.status(400).json({ 
            success: false, 
            message: 'Password must be at least 8 characters' 
        });
    }
    
    try {
        if (!isDbConnected || !usersCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }
        
        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired reset token' 
            });
        }
        
        // Find admin user
        const { ObjectId } = require('mongodb');
        const admin = await usersCollection.findOne({ 
            _id: new ObjectId(decoded.id),
            reset_token: token
        });
        
        if (!admin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid reset token' 
            });
        }
        
        // Check if token is expired
        if (admin.reset_token_expires && new Date() > new Date(admin.reset_token_expires)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reset token has expired' 
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Update password and clear reset token
        await usersCollection.updateOne(
            { _id: admin._id },
            { 
                $set: { 
                    password: hashedPassword,
                    last_password_change: new Date()
                },
                $unset: {
                    reset_token: "",
                    reset_token_expires: ""
                }
            }
        );
        
        console.log('✅ Password reset successful for:', admin.email);
        
        res.json({ 
            success: true, 
            message: 'Password reset successful' 
        });
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reset password' 
        });
    }
});

// Serve admin panel (protected)
app.get('/admin', (req, res) => {
    const token = req.cookies.admin_token;
    
    if (!token) {
        return res.redirect('/admin/login');
    }
    
    try {
        jwt.verify(token, JWT_SECRET);
        res.sendFile(path.join(__dirname, 'admin.html'));
    } catch (error) {
        res.redirect('/admin/login');
    }
});

// Admin API: Get all registered users (protected)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const users = await usersCollection
            .find({ role: 'user' })
            .sort({ createdAt: -1 })
            .project({ password: 0, reset_token: 0, reset_token_expires: 0 })
            .toArray();

        const totalUsers = users.length;
        const subscribedUsers = users.filter(u => u.subscriptionStatus === 'subscribed').length;
        const cancelledUsers = users.filter(u => u.subscriptionStatus === 'cancelled').length;
        const freeUsers = users.filter(u => !u.subscriptionStatus || u.subscriptionStatus === 'free').length;

        res.json({
            success: true,
            users,
            summary: { totalUsers, subscribedUsers, cancelledUsers, freeUsers }
        });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// Admin API: Get all waitlist members (protected)
app.get('/api/admin/waitlist', authenticateAdmin, async (req, res) => {
    try {
        if (!waitlistCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }
        
        const members = await waitlistCollection
            .find({})
            .sort({ created_at: -1 })
            .toArray();
        
        console.log(`📊 Retrieved ${members.length} waitlist members`);
        
        res.json({ 
            success: true, 
            members: members,
            count: members.length
        });
    } catch (error) {
        console.error('❌ Error fetching waitlist:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch waitlist members' 
        });
    }
});

// Admin API: Add new member manually (protected)
app.post('/api/admin/waitlist', authenticateAdmin, async (req, res) => {
    const { name, email, phone, pincode } = req.body;
    
    if (!name || !email || !phone || !pincode) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required' 
        });
    }
    
    try {
        if (!waitlistCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }
        
        const userData = {
            name,
            email,
            phone,
            pincode,
            created_at: new Date(),
            status: 'active',
            source: 'admin'
        };
        
        const result = await waitlistCollection.insertOne(userData);
        console.log('✅ Admin added member:', result.insertedId);
        
        res.json({ 
            success: true, 
            message: 'Member added successfully',
            id: result.insertedId
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already registered' 
            });
        }
        
        console.error('❌ Error adding member:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add member' 
        });
    }
});

// Admin API: Delete member (protected)
app.delete('/api/admin/waitlist/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!waitlistCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }
        
        const { ObjectId } = require('mongodb');
        const result = await waitlistCollection.deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });
        
        if (result.deletedCount > 0) {
            console.log('✅ Admin deleted member:', req.params.id);
            res.json({ 
                success: true, 
                message: 'Member deleted successfully' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
    } catch (error) {
        console.error('❌ Error deleting member:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete member' 
        });
    }
});

// Admin API: Send bulk email (protected)
app.post('/api/admin/bulk-email', authenticateAdmin, async (req, res) => {
    const { recipients, subject, message, messageType } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'No recipients provided' 
        });
    }
    
    if (!subject || !message) {
        return res.status(400).json({ 
            success: false, 
            message: 'Subject and message are required' 
        });
    }
    
    try {
        console.log(`📧 Sending bulk email to ${recipients.length} recipients...`);
        console.log(`📝 Message type: ${messageType || 'text'}`);
        
        let successCount = 0;
        let failCount = 0;
        
        // Send emails one by one
        for (const recipient of recipients) {
            try {
                // Replace {{name}} placeholder with actual name (case-insensitive)
                const personalizedMessage = message.replace(/\{\{name\}\}/gi, recipient.name);
                
                let emailContent;
                
                if (messageType === 'html') {
                    // User provided HTML - wrap it with basic email structure
                    emailContent = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            ${personalizedMessage}
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px;">
                                ChoosePure - Independent Food Testing for Parents<br>
                                No brand sponsorship. Only facts parents can trust.
                            </p>
                        </div>
                    `;
                } else {
                    // Plain text - convert to HTML with line breaks
                    const htmlMessage = personalizedMessage
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/\n/g, '<br>');
                    
                    emailContent = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="line-height: 1.6;">${htmlMessage}</div>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="color: #999; font-size: 12px;">
                                ChoosePure - Independent Food Testing for Parents<br>
                                No brand sponsorship. Only facts parents can trust.
                            </p>
                        </div>
                    `;
                }
                
                const messageData = {
                    from: 'ChoosePure <support@choosepure.in>',
                    to: recipient.email,
                    subject: subject,
                    html: emailContent
                };
                
                await mg.messages.create(process.env.MAILGUN_DOMAIN || 'choosepure.in', messageData);
                successCount++;
                console.log(`✅ Email sent to ${recipient.email}`);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (emailError) {
                console.error(`❌ Failed to send email to ${recipient.email}:`, emailError.message);
                failCount++;
            }
        }
        
        console.log(`📊 Bulk email complete: ${successCount} sent, ${failCount} failed`);
        
        res.json({ 
            success: true, 
            message: `Emails sent successfully`,
            sent: successCount,
            failed: failCount,
            total: recipients.length
        });
        
    } catch (error) {
        console.error('❌ Bulk email error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send bulk emails' 
        });
    }
});

// ==========================================
// Product Polling Admin Endpoints
// ==========================================

// Admin API: Create a new product (protected)
app.post('/api/admin/polls/products', authenticateAdmin, async (req, res) => {
    try {
        if (!productsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { name, imageUrl, description, minAmount } = req.body;

        // Validate required fields
        const missingFields = [];
        if (!name) missingFields.push('name');
        if (!imageUrl) missingFields.push('imageUrl');
        if (!description) missingFields.push('description');
        if (minAmount === undefined || minAmount === null || minAmount === '') missingFields.push('minAmount');

        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        // Validate minAmount is a positive number
        if (typeof minAmount !== 'number' || minAmount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Minimum amount must be greater than 0' 
            });
        }

        const now = new Date();
        const product = {
            name,
            imageUrl,
            description,
            minAmount,
            totalVotes: 0,
            status: 'active',
            createdAt: now,
            updatedAt: now
        };

        const result = await productsCollection.insertOne(product);
        console.log('✅ Product created:', result.insertedId);

        res.json({ 
            success: true, 
            message: 'Product created successfully',
            product: { ...product, _id: result.insertedId }
        });
    } catch (error) {
        console.error('❌ Error creating product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create product' 
        });
    }
});

// Admin API: List all products including inactive (protected)
app.get('/api/admin/polls/products', authenticateAdmin, async (req, res) => {
    try {
        if (!productsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const products = await productsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json({ 
            success: true, 
            products: products 
        });
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch products' 
        });
    }
});

// Admin API: Toggle product status (protected)
app.put('/api/admin/polls/products/:id/status', authenticateAdmin, async (req, res) => {
    try {
        if (!productsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { ObjectId } = require('mongodb');
        const productId = new ObjectId(req.params.id);

        // Find the product first
        const product = await productsCollection.findOne({ _id: productId });

        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        const newStatus = product.status === 'active' ? 'inactive' : 'active';

        await productsCollection.updateOne(
            { _id: productId },
            { $set: { status: newStatus, updatedAt: new Date() } }
        );

        console.log(`✅ Product ${req.params.id} status toggled to ${newStatus}`);

        res.json({ 
            success: true, 
            message: `Product status updated to ${newStatus}`,
            status: newStatus
        });
    } catch (error) {
        console.error('❌ Error toggling product status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update product status' 
        });
    }
});

// Admin API: Delete product (protected)
app.delete('/api/admin/polls/products/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!productsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { ObjectId } = require('mongodb');
        const result = await productsCollection.deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        console.log('✅ Product deleted:', req.params.id);

        res.json({ 
            success: true, 
            message: 'Product deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete product' 
        });
    }
});

// Admin API: Get vote transactions with summary stats (protected)
app.get('/api/admin/polls/transactions', authenticateAdmin, async (req, res) => {
    try {
        if (!voteTransactionsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        // Fetch 100 most recent transactions sorted by createdAt descending
        const transactions = await voteTransactionsCollection
            .find({})
            .sort({ createdAt: -1 })
            .limit(100)
            .project({ 
                userName: 1, 
                userEmail: 1, 
                productName: 1, 
                voteCount: 1, 
                amount: 1, 
                razorpayPaymentId: 1, 
                createdAt: 1,
                isManualVote: 1,
                reason: 1,
                adminEmail: 1 
            })
            .toArray();

        // Aggregate summary stats: total votes and total revenue
        const summaryResult = await voteTransactionsCollection.aggregate([
            {
                $group: {
                    _id: null,
                    totalVotes: { $sum: '$voteCount' },
                    totalRevenue: { $sum: '$amount' }
                }
            }
        ]).toArray();

        const summary = summaryResult.length > 0 
            ? { totalVotes: summaryResult[0].totalVotes, totalRevenue: summaryResult[0].totalRevenue }
            : { totalVotes: 0, totalRevenue: 0 };

        res.json({ 
            success: true, 
            transactions,
            summary
        });
    } catch (error) {
        console.error('❌ Error fetching transactions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch transactions' 
        });
    }
});

// Admin API: Cast manual vote for a product (protected)
app.post('/api/admin/polls/manual-vote', authenticateAdmin, async (req, res) => {
    try {
        if (!isDbConnected || !productsCollection || !voteTransactionsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { productId, voteCount, voterName, voterEmail, voterPhone, reason } = req.body;

        // Validate required fields
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product selection is required' 
            });
        }

        if (!Number.isInteger(voteCount) || voteCount < 1 || voteCount > 50) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vote count must be between 1 and 50' 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (voterEmail && !emailRegex.test(voterEmail)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email address' 
            });
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (voterPhone && !phoneRegex.test(voterPhone)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid 10-digit phone number' 
            });
        }

        // Verify product exists and is active
        const { ObjectId } = require('mongodb');
        let product;
        try {
            product = await productsCollection.findOne({ 
                _id: new ObjectId(productId), 
                status: 'active' 
            });
        } catch (err) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found or not active' 
            });
        }

        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found or not active' 
            });
        }

        // Insert vote transaction record
        const voteTransaction = {
            productId: new ObjectId(productId),
            productName: product.name,
            userName: voterName ? voterName.trim() : '',
            userEmail: voterEmail || '',
            userPhone: voterPhone || '',
            voteCount: voteCount,
            amount: 0,
            isManualVote: true,
            adminEmail: req.admin.email,
            reason: reason || '',
            status: 'completed',
            createdAt: new Date()
        };

        await voteTransactionsCollection.insertOne(voteTransaction);

        // Increment product's totalVotes
        await productsCollection.updateOne(
            { _id: new ObjectId(productId) },
            { $inc: { totalVotes: voteCount } }
        );

        // Fetch updated product to get new totalVotes
        const updatedProduct = await productsCollection.findOne({ _id: new ObjectId(productId) });

        console.log(`✅ Manual vote: ${voteCount} votes cast for ${product.name} by admin ${req.admin.email}`);

        res.json({ 
            success: true, 
            message: `Successfully cast ${voteCount} votes for ${product.name}`,
            updatedVoteCount: updatedProduct.totalVotes
        });
    } catch (error) {
        console.error('❌ Error casting manual vote:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to cast manual vote' 
        });
    }
});

// ==========================================
// Public Polling Endpoints
// ==========================================

// Public API: List active products sorted by totalVotes descending
app.get('/api/polls/products', async (req, res) => {
    try {
        if (!productsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const products = await productsCollection
            .find({ status: 'active' })
            .sort({ totalVotes: -1 })
            .project({ name: 1, imageUrl: 1, description: 1, minAmount: 1, totalVotes: 1 })
            .toArray();

        res.json({ 
            success: true, 
            products: products 
        });
    } catch (error) {
        console.error('❌ Error fetching public products:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch products' 
        });
    }
});

// Authenticated API: Create Razorpay order for vote payment
app.post('/api/polls/vote', authenticateUser, async (req, res) => {
    try {
        if (!productsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { productId, voteCount } = req.body;
        const userName = req.user.name;
        const userEmail = req.user.email;
        const userPhone = req.user.phone;

        // Validate voteCount (1–50)
        if (!voteCount || typeof voteCount !== 'number' || voteCount < 1 || voteCount > 50 || !Number.isInteger(voteCount)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vote count must be between 1 and 50' 
            });
        }

        // Validate productId
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID is required' 
            });
        }

        const { ObjectId } = require('mongodb');
        const product = await productsCollection.findOne({ 
            _id: new ObjectId(productId), 
            status: 'active' 
        });

        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found or not active' 
            });
        }

        // Calculate total amount
        const amount = voteCount * product.minAmount;

        // Create Razorpay order (amount in paise)
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: `v_${Date.now()}`
        });

        console.log('✅ Razorpay order created:', order.id);

        res.json({ 
            success: true, 
            orderId: order.id, 
            amount: amount, 
            key: process.env.RAZORPAY_KEY_ID 
        });
    } catch (error) {
        console.error('❌ Error creating vote order:', error.message || error);
        console.error('   Razorpay Key ID set:', process.env.RAZORPAY_KEY_ID ? '✅' : '❌ NOT SET');
        console.error('   Razorpay Key Secret set:', process.env.RAZORPAY_KEY_SECRET ? '✅' : '❌ NOT SET');
        console.error('   Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        res.status(500).json({ 
            success: false, 
            message: 'Payment initialization failed: ' + (error.message || 'Unknown error')
        });
    }
});

// Authenticated API: Verify payment and record votes
app.post('/api/polls/verify-payment', authenticateUser, async (req, res) => {
    try {
        if (!productsCollection || !voteTransactionsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            productId, 
            voteCount
        } = req.body;

        const userName = req.user.name;
        const userEmail = req.user.email;
        const userPhone = req.user.phone;

        // Validate required payment fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment verification details are incomplete' 
            });
        }

        // Verify signature using HMAC SHA256
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Payment verification failed' 
            });
        }

        const { ObjectId } = require('mongodb');
        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });

        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        const amount = voteCount * product.minAmount;

        // Insert vote transaction record
        await voteTransactionsCollection.insertOne({
            productId: new ObjectId(productId),
            productName: product.name,
            userId: req.user.id,
            userName,
            userEmail,
            userPhone,
            voteCount,
            amount,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: 'completed',
            createdAt: new Date()
        });

        // Increment product totalVotes
        const updateResult = await productsCollection.findOneAndUpdate(
            { _id: new ObjectId(productId) },
            { $inc: { totalVotes: voteCount } },
            { returnDocument: 'after' }
        );

        console.log(`✅ Payment verified and ${voteCount} votes recorded for product ${productId}`);

        res.json({ 
            success: true, 
            updatedVoteCount: updateResult.totalVotes 
        });
    } catch (error) {
        console.error('❌ Error verifying payment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment verification failed' 
        });
    }
});

// ==========================================
// FEEDBACK / CUSTOMER CARE API
// ==========================================

// Public API: Submit feedback message
app.post('/api/feedback', async (req, res) => {
    try {
        if (!feedbackCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
        }

        await feedbackCollection.insertOne({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: (phone || '').trim(),
            message: message.trim(),
            status: 'new',
            createdAt: new Date()
        });

        console.log('📩 New feedback from:', name, email);
        res.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (error) {
        console.error('❌ Error submitting feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
});

// Admin API: Get all feedback messages
app.get('/api/admin/feedback', authenticateAdmin, async (req, res) => {
    try {
        if (!feedbackCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const messages = await feedbackCollection.find().sort({ createdAt: -1 }).toArray();
        res.json({ success: true, messages });
    } catch (error) {
        console.error('❌ Error fetching feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
    }
});

// Admin API: Delete feedback message
app.delete('/api/admin/feedback/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!feedbackCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }
        const { ObjectId } = require('mongodb');
        await feedbackCollection.deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting feedback:', error);
        res.status(500).json({ success: false, message: 'Failed to delete feedback' });
    }
});

// ==========================================
// REFERRAL PROGRAM API
// ==========================================

// Authenticated API: Get referral stats for current user
app.get('/api/user/referral-stats', authenticateUser, async (req, res) => {
    try {
        if (!referralsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const { ObjectId } = require('mongodb');
        const userId = new ObjectId(req.user.id);

        const referrals = await referralsCollection.find({ referrer_user_id: userId }).toArray();
        const totalInvited = referrals.length;
        const completed = referrals.filter(r => r.status === 'completed').length;
        const pending = totalInvited - completed;

        const referralCode = req.user.referral_code || '';
        const referralLink = referralCode ? `https://choosepure.in/purity-wall?ref=${referralCode}` : '';

        res.json({
            success: true,
            referral_code: referralCode,
            referral_link: referralLink,
            total_invited: totalInvited,
            completed,
            pending,
            free_months_earned: req.user.freeMonthsEarned || 0
        });
    } catch (error) {
        console.error('❌ Error fetching referral stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch referral stats' });
    }
});

// Admin API: Referral program overview stats
app.get('/api/admin/referral-overview', authenticateAdmin, async (req, res) => {
    try {
        if (!referralsCollection || !rewardsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const totalReferrals = await referralsCollection.countDocuments();
        const completedReferrals = await referralsCollection.countDocuments({ status: 'completed' });

        const rewardAgg = await rewardsCollection.aggregate([
            { $group: { _id: null, totalMonths: { $sum: '$months' } } }
        ]).toArray();
        const totalFreeMonths = rewardAgg.length > 0 ? rewardAgg[0].totalMonths : 0;

        res.json({
            success: true,
            total_referrals: totalReferrals,
            completed_referrals: completedReferrals,
            total_free_months_granted: totalFreeMonths
        });
    } catch (error) {
        console.error('❌ Error fetching referral overview:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch referral overview' });
    }
});

// Admin API: List all referral records
app.get('/api/admin/referrals', authenticateAdmin, async (req, res) => {
    try {
        if (!referralsCollection || !usersCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const referrals = await referralsCollection.find().sort({ created_at: -1 }).toArray();

        // Get all unique user IDs
        const userIds = new Set();
        referrals.forEach(r => {
            userIds.add(r.referrer_user_id.toString());
            userIds.add(r.referee_user_id.toString());
        });

        const { ObjectId } = require('mongodb');
        const users = await usersCollection.find({
            _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) }
        }).project({ name: 1, email: 1 }).toArray();

        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u.name || u.email; });

        const mapped = referrals.map(r => ({
            referrer_name: userMap[r.referrer_user_id.toString()] || 'Unknown',
            referee_name: userMap[r.referee_user_id.toString()] || 'Unknown',
            status: r.status,
            reward_granted: r.reward_granted,
            created_at: r.created_at
        }));

        res.json({ success: true, referrals: mapped });
    } catch (error) {
        console.error('❌ Error fetching referrals:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch referrals' });
    }
});

// ==========================================
// FREE VOTE FOR SUBSCRIBERS
// ==========================================

// Check if subscriber has a free vote available this month
app.get('/api/polls/free-vote-status', authenticateUser, async (req, res) => {
    try {
        if (!voteTransactionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        if (req.user.subscriptionStatus !== 'subscribed' && req.user.subscriptionStatus !== 'cancelled') {
            return res.json({ success: true, eligible: false, reason: 'not_subscribed' });
        }

        // Check if user already used free vote this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const freeVoteThisMonth = await voteTransactionsCollection.findOne({
            userId: req.user.id,
            isFreeVote: true,
            createdAt: { $gte: monthStart }
        });

        res.json({ 
            success: true, 
            eligible: !freeVoteThisMonth,
            reason: freeVoteThisMonth ? 'already_used' : 'available'
        });
    } catch (error) {
        console.error('❌ Error checking free vote status:', error);
        res.status(500).json({ success: false, message: 'Failed to check free vote status' });
    }
});

// Cast a free vote (1 per month for subscribers)
app.post('/api/polls/free-vote', authenticateUser, async (req, res) => {
    try {
        if (!productsCollection || !voteTransactionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        // Must be subscribed
        if (req.user.subscriptionStatus !== 'subscribed' && req.user.subscriptionStatus !== 'cancelled') {
            return res.status(403).json({ success: false, message: 'Subscription required for free votes' });
        }

        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Check if already used free vote this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const freeVoteThisMonth = await voteTransactionsCollection.findOne({
            userId: req.user.id,
            isFreeVote: true,
            createdAt: { $gte: monthStart }
        });

        if (freeVoteThisMonth) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already used your free vote this month' 
            });
        }

        const { ObjectId } = require('mongodb');
        const product = await productsCollection.findOne({ 
            _id: new ObjectId(productId), 
            status: 'active' 
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found or not active' });
        }

        // Record the free vote
        await voteTransactionsCollection.insertOne({
            productId: new ObjectId(productId),
            productName: product.name,
            userId: req.user.id,
            userName: req.user.name,
            userEmail: req.user.email,
            userPhone: req.user.phone || '',
            voteCount: 1,
            amount: 0,
            isFreeVote: true,
            status: 'completed',
            createdAt: new Date()
        });

        // Increment product totalVotes
        const updateResult = await productsCollection.findOneAndUpdate(
            { _id: new ObjectId(productId) },
            { $inc: { totalVotes: 1 } },
            { returnDocument: 'after' }
        );

        console.log(`✅ Free vote recorded for product ${product.name} by ${req.user.email}`);

        res.json({ 
            success: true, 
            updatedVoteCount: updateResult.totalVotes 
        });
    } catch (error) {
        console.error('❌ Error casting free vote:', error);
        res.status(500).json({ success: false, message: 'Failed to cast free vote' });
    }
});

// ==========================================
// PRODUCT SUGGESTIONS API
// ==========================================

// Protected API: Submit a product suggestion (requires authentication)
app.post('/api/suggestions', authenticateUser, async (req, res) => {
    try {
        if (!suggestionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const { productName, category, reason } = req.body;
        const userName = req.user.name;
        const userEmail = req.user.email;

        // Validate required fields
        const missing = [];
        if (!productName) missing.push('productName');
        if (!category) missing.push('category');
        if (missing.length > 0) {
            return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
        }

        const suggestion = {
            productName,
            category,
            reason: reason || '',
            userName,
            userEmail,
            userId: req.user.id,
            upvotes: 0,
            status: 'pending',
            createdAt: new Date()
        };

        const result = await suggestionsCollection.insertOne(suggestion);
        suggestion._id = result.insertedId;

        console.log('✅ New product suggestion:', productName, 'by', userName);
        res.json({ success: true, suggestion });
    } catch (error) {
        console.error('❌ Error creating suggestion:', error);
        res.status(500).json({ success: false, message: 'Failed to submit suggestion' });
    }
});

// Public API: List approved suggestions sorted by upvotes descending
app.get('/api/suggestions', async (req, res) => {
    try {
        if (!suggestionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const suggestions = await suggestionsCollection
            .find({ status: 'approved' })
            .sort({ upvotes: -1 })
            .toArray();

        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('❌ Error fetching suggestions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
    }
});

// Authenticated API: Upvote a suggestion
app.post('/api/suggestions/:id/upvote', authenticateUser, async (req, res) => {
    try {
        if (!suggestionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const { ObjectId } = require('mongodb');
        const suggestionId = new ObjectId(req.params.id);
        const userId = req.user.id;

        // Check if user has already upvoted this suggestion
        const suggestion = await suggestionsCollection.findOne({ _id: suggestionId });

        if (!suggestion) {
            return res.status(404).json({ success: false, message: 'Suggestion not found' });
        }

        const upvotedBy = suggestion.upvotedBy || [];
        if (upvotedBy.some(id => id.toString() === userId.toString())) {
            return res.status(400).json({ success: false, message: 'You have already upvoted this suggestion' });
        }

        // Add user to upvotedBy array and increment upvotes
        const result = await suggestionsCollection.findOneAndUpdate(
            { _id: suggestionId },
            { 
                $inc: { upvotes: 1 },
                $addToSet: { upvotedBy: userId }
            },
            { returnDocument: 'after' }
        );

        res.json({ success: true, upvotes: result.upvotes });
    } catch (error) {
        console.error('❌ Error upvoting suggestion:', error);
        res.status(500).json({ success: false, message: 'Failed to upvote suggestion' });
    }
});

// Admin API: List all suggestions (any status)
app.get('/api/admin/suggestions', authenticateAdmin, async (req, res) => {
    try {
        if (!suggestionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const suggestions = await suggestionsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json({ success: true, suggestions });
    } catch (error) {
        console.error('❌ Error fetching admin suggestions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch suggestions' });
    }
});

// Admin API: Update suggestion status
app.put('/api/admin/suggestions/:id/status', authenticateAdmin, async (req, res) => {
    try {
        if (!suggestionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be one of: pending, approved, rejected' });
        }

        const { ObjectId } = require('mongodb');
        const result = await suggestionsCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { status, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ success: false, message: 'Suggestion not found' });
        }

        res.json({ success: true, suggestion: result });
    } catch (error) {
        console.error('❌ Error updating suggestion status:', error);
        res.status(500).json({ success: false, message: 'Failed to update suggestion status' });
    }
});

// Admin API: Delete a suggestion
app.delete('/api/admin/suggestions/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!suggestionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const { ObjectId } = require('mongodb');
        const result = await suggestionsCollection.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Suggestion not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting suggestion:', error);
        res.status(500).json({ success: false, message: 'Failed to delete suggestion' });
    }
});

// Admin API: Convert approved suggestion to poll product
app.post('/api/admin/suggestions/:id/convert', authenticateAdmin, async (req, res) => {
    try {
        if (!suggestionsCollection || !productsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }

        const { imageUrl, description, minAmount } = req.body;

        // Validate required fields
        const missing = [];
        if (!imageUrl) missing.push('imageUrl');
        if (!description) missing.push('description');
        if (!minAmount) missing.push('minAmount');
        if (missing.length > 0) {
            return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
        }

        if (Number(minAmount) <= 0) {
            return res.status(400).json({ success: false, message: 'Minimum amount must be greater than 0' });
        }

        const { ObjectId } = require('mongodb');
        const suggestion = await suggestionsCollection.findOne({ _id: new ObjectId(req.params.id) });

        if (!suggestion) {
            return res.status(404).json({ success: false, message: 'Suggestion not found' });
        }

        if (suggestion.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'Only approved suggestions can be converted' });
        }

        // Create product from suggestion
        const product = {
            name: suggestion.productName,
            imageUrl,
            description,
            minAmount: Number(minAmount),
            totalVotes: 0,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const productResult = await productsCollection.insertOne(product);
        product._id = productResult.insertedId;

        // Update suggestion status to converted
        await suggestionsCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { status: 'converted', updatedAt: new Date() } }
        );

        console.log('✅ Suggestion converted to product:', suggestion.productName);
        res.json({ success: true, product });
    } catch (error) {
        console.error('❌ Error converting suggestion:', error);
        res.status(500).json({ success: false, message: 'Failed to convert suggestion' });
    }
});

// Admin API: Create a new test report (protected)
app.post('/api/admin/reports', authenticateAdmin, async (req, res) => {
    try {
        if (!testReportsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { productName, brandName, category, imageUrl, reportUrl, purityScore, testParameters,
                expertCommentary, statusBadges, batchCode, shelfLife, testDate, methodology } = req.body;

        // Validate required fields
        const missingFields = [];
        if (!productName) missingFields.push('productName');
        if (!brandName) missingFields.push('brandName');
        if (!category) missingFields.push('category');
        if (!imageUrl) missingFields.push('imageUrl');
        if (purityScore === undefined || purityScore === null || purityScore === '') missingFields.push('purityScore');
        if (!testParameters) missingFields.push('testParameters');

        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        // Validate purityScore range
        if (typeof purityScore !== 'number' || purityScore < 0 || purityScore > 100) {
            return res.status(400).json({ 
                success: false, 
                message: 'Purity score must be between 0 and 100' 
            });
        }

        const now = new Date();
        const report = {
            productName,
            brandName,
            category,
            imageUrl,
            purityScore,
            testParameters,
            expertCommentary: expertCommentary || '',
            statusBadges: statusBadges || [],
            batchCode: batchCode || '',
            shelfLife: shelfLife || '',
            testDate: testDate ? new Date(testDate) : null,
            methodology: methodology || '',
            reportUrl: reportUrl || '',
            published: true,
            createdAt: now,
            updatedAt: now
        };

        const result = await testReportsCollection.insertOne(report);
        console.log('✅ Test report created:', result.insertedId);

        res.json({ 
            success: true, 
            message: 'Test report created successfully',
            report: { ...report, _id: result.insertedId }
        });
    } catch (error) {
        console.error('❌ Error creating test report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create test report' 
        });
    }
});

// Admin API: List all test reports including unpublished (protected)
app.get('/api/admin/reports', authenticateAdmin, async (req, res) => {
    try {
        if (!testReportsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const reports = await testReportsCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json({ 
            success: true, 
            reports: reports 
        });
    } catch (error) {
        console.error('❌ Error fetching test reports:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch test reports' 
        });
    }
});

// Admin API: Update a test report (protected)
app.put('/api/admin/reports/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!testReportsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { ObjectId } = require('mongodb');
        const reportId = new ObjectId(req.params.id);

        // Check if report exists
        const existingReport = await testReportsCollection.findOne({ _id: reportId });
        if (!existingReport) {
            return res.status(404).json({ 
                success: false, 
                message: 'Report not found' 
            });
        }

        // Validate purityScore range if provided
        if (req.body.purityScore !== undefined && req.body.purityScore !== null) {
            if (typeof req.body.purityScore !== 'number' || req.body.purityScore < 0 || req.body.purityScore > 100) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Purity score must be between 0 and 100' 
                });
            }
        }

        // Build update object from provided fields
        const updateFields = {};
        const allowedFields = ['productName', 'brandName', 'category', 'imageUrl', 'reportUrl', 'purityScore',
            'testParameters', 'expertCommentary', 'statusBadges', 'batchCode', 'shelfLife',
            'testDate', 'methodology', 'published'];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateFields[field] = req.body[field];
            }
        }

        // Convert testDate string to Date if provided
        if (updateFields.testDate && typeof updateFields.testDate === 'string') {
            updateFields.testDate = new Date(updateFields.testDate);
        }

        updateFields.updatedAt = new Date();

        await testReportsCollection.updateOne(
            { _id: reportId },
            { $set: updateFields }
        );

        const updatedReport = await testReportsCollection.findOne({ _id: reportId });
        console.log('✅ Test report updated:', req.params.id);

        res.json({ 
            success: true, 
            message: 'Test report updated successfully',
            report: updatedReport
        });
    } catch (error) {
        console.error('❌ Error updating test report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update test report' 
        });
    }
});

// Admin API: Delete a test report (protected)
app.delete('/api/admin/reports/:id', authenticateAdmin, async (req, res) => {
    try {
        if (!testReportsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { ObjectId } = require('mongodb');
        const result = await testReportsCollection.deleteOne({ 
            _id: new ObjectId(req.params.id) 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Report not found' 
            });
        }

        console.log('✅ Test report deleted:', req.params.id);

        res.json({ 
            success: true, 
            message: 'Test report deleted successfully' 
        });
    } catch (error) {
        console.error('❌ Error deleting test report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete test report' 
        });
    }
});

// Public API: List published test reports (optional auth for subscription check)
app.get('/api/reports', async (req, res) => {
    try {
        if (!testReportsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        // Optional auth check — try to read JWT but don't fail if absent
        let isSubscribed = false;
        let token = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        if (!token) {
            token = req.cookies.user_token;
        }
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const { ObjectId } = require('mongodb');
                const user = await usersCollection.findOne({ 
                    _id: new ObjectId(decoded.id), 
                    role: 'user' 
                });
                if (user && (user.subscriptionStatus === 'subscribed' || user.subscriptionStatus === 'cancelled')) {
                    isSubscribed = true;
                }
            } catch (e) {
                // Token invalid or expired — treat as unauthenticated
            }
        }

        const reports = await testReportsCollection
            .find({ published: true })
            .sort({ createdAt: -1 })
            .toArray();

        // Sort so the free/sample report (Akshayakalpa) always appears first
        reports.sort((a, b) => {
            const aFree = (a.reportUrl || '').includes('akshayakalpa');
            const bFree = (b.reportUrl || '').includes('akshayakalpa');
            if (aFree && !bFree) return -1;
            if (!aFree && bFree) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const mapped = reports.map((report, index) => {
            const base = {
                _id: report._id,
                productName: report.productName,
                brandName: report.brandName,
                category: report.category,
                imageUrl: report.imageUrl,
                statusBadges: report.statusBadges || [],
                reportUrl: report.reportUrl || ''
            };

            // Subscribed users get purityScore on all reports
            // Non-subscribed/unauthenticated get purityScore only on the first report
            if (isSubscribed || index === 0) {
                base.purityScore = report.purityScore;
            }

            return base;
        });

        res.json({ success: true, reports: mapped });
    } catch (error) {
        console.error('❌ Error fetching public reports:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch reports' 
        });
    }
});

// Public API: Get full test report for deep-dive (subscribed users only)
app.get('/api/reports/:id', authenticateSubscribedUser, async (req, res) => {
    try {
        if (!testReportsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { ObjectId } = require('mongodb');
        let reportId;
        try {
            reportId = new ObjectId(req.params.id);
        } catch (e) {
            return res.status(404).json({ 
                success: false, 
                message: 'Report not found' 
            });
        }

        const report = await testReportsCollection.findOne({ 
            _id: reportId, 
            published: true 
        });

        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: 'Report not found' 
            });
        }

        res.json({ success: true, report });
    } catch (error) {
        console.error('❌ Error fetching report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch report' 
        });
    }
});

// Public API: Download PDF report (subscribed users only)
app.get('/api/reports/:id/pdf', authenticateSubscribedUser, async (req, res) => {
    try {
        if (!testReportsCollection) {
            return res.status(500).json({ 
                success: false, 
                message: 'Database not connected' 
            });
        }

        const { ObjectId } = require('mongodb');
        let reportId;
        try {
            reportId = new ObjectId(req.params.id);
        } catch (e) {
            return res.status(404).json({ 
                success: false, 
                message: 'Report not found' 
            });
        }

        const report = await testReportsCollection.findOne({ 
            _id: reportId, 
            published: true 
        });

        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: 'Report not found' 
            });
        }

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });

        const safeName = (report.productName || 'report').replace(/[^a-zA-Z0-9-_ ]/g, '');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}-purity-report.pdf"`);

        doc.pipe(res);

        // Title
        doc.fontSize(22).font('Helvetica-Bold').text('ChoosePure Lab Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').fillColor('#666666').text('Independent Food Testing for Parents', { align: 'center' });
        doc.moveDown(1.5);

        // Product info
        doc.fillColor('#000000');
        doc.fontSize(16).font('Helvetica-Bold').text(report.productName);
        doc.moveDown(0.3);
        doc.fontSize(12).font('Helvetica').text(`Brand: ${report.brandName}`);
        doc.text(`Category: ${report.category}`);
        doc.moveDown(0.5);

        // Purity score
        const scoreColor = report.purityScore >= 70 ? '#1F6B4E' : report.purityScore >= 40 ? '#FFB703' : '#D62828';
        doc.fontSize(14).font('Helvetica-Bold').fillColor(scoreColor).text(`Purity Score: ${Math.round(report.purityScore)}/100`);
        doc.fillColor('#000000');
        doc.moveDown(1);

        // Test parameters
        if (report.testParameters && report.testParameters.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('Test Parameters');
            doc.moveDown(0.5);

            for (const section of report.testParameters) {
                doc.fontSize(12).font('Helvetica-Bold').text(section.section || 'Test Section');
                doc.moveDown(0.3);

                if (section.parameters && section.parameters.length > 0) {
                    for (const param of section.parameters) {
                        const statusIcon = param.status === 'pass' ? '✓' : param.status === 'warning' ? '⚠' : '✗';
                        doc.fontSize(10).font('Helvetica')
                            .text(`${statusIcon} ${param.name}: ${param.measuredValue} (Acceptable: ${param.acceptableRange})`, {
                                indent: 20
                            });
                    }
                }
                doc.moveDown(0.5);
            }
        }

        // Expert commentary
        if (report.expertCommentary) {
            doc.moveDown(0.5);
            doc.fontSize(14).font('Helvetica-Bold').text('Expert Commentary');
            doc.moveDown(0.3);
            doc.fontSize(10).font('Helvetica').text(report.expertCommentary);
        }

        // Status badges
        if (report.statusBadges && report.statusBadges.length > 0) {
            doc.moveDown(1);
            doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Status: ${report.statusBadges.join(', ')}`);
        }

        // Footer
        doc.moveDown(2);
        doc.fillColor('#999999').fontSize(8).text(`Generated on ${new Date().toLocaleDateString()} by ChoosePure`, { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('❌ Error generating PDF report:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate PDF report' 
        });
    }
});

// ==========================================
// ==========================================
// SUBSCRIPTION PAYMENT API (Razorpay Subscriptions)
// ==========================================

// Authenticated API: Create Razorpay subscription
app.post('/api/subscription/create-order', authenticateUser, async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }
        if (req.user.subscriptionStatus === 'subscribed') {
            return res.status(400).json({ success: false, message: 'Already subscribed' });
        }
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1,
            total_count: 12,
            notes: { userId: req.user.id.toString(), userEmail: req.user.email }
        });
        console.log('Subscription created:', subscription.id);
        res.json({ success: true, subscriptionId: subscription.id, key: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Error creating subscription:', error.message || error);
        res.status(500).json({ success: false, message: 'Payment initialization failed. Please try again.' });
    }
});

// Authenticated API: Verify subscription payment
app.post('/api/subscription/verify-payment', authenticateUser, async (req, res) => {
    try {
        if (!usersCollection || !subscriptionTransactionsCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }
        const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification details are incomplete' });
        }
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_payment_id + '|' + razorpay_subscription_id)
            .digest('hex');
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
        const { ObjectId } = require('mongodb');
        await usersCollection.updateOne(
            { _id: new ObjectId(req.user.id) },
            { $set: { subscriptionStatus: 'subscribed', subscribedAt: new Date(), razorpaySubscriptionId: razorpay_subscription_id } }
        );
        await subscriptionTransactionsCollection.insertOne({
            userId: new ObjectId(req.user.id),
            userName: req.user.name,
            userEmail: req.user.email,
            amount: 299,
            razorpaySubscriptionId: razorpay_subscription_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: 'active',
            createdAt: new Date()
        });
        console.log('Subscription activated for:', req.user.email);

        // Referral reward logic: check if this user was referred
        try {
            if (referralsCollection && rewardsCollection) {
                const pendingReferral = await referralsCollection.findOne({
                    referee_user_id: new ObjectId(req.user.id),
                    status: 'pending',
                    reward_granted: false
                });

                if (pendingReferral) {
                    // Update referral to completed
                    await referralsCollection.updateOne(
                        { _id: pendingReferral._id },
                        { $set: { status: 'completed', reward_granted: true, completed_at: new Date() } }
                    );

                    // Create reward for referrer
                    await rewardsCollection.insertOne({
                        user_id: pendingReferral.referrer_user_id,
                        reward_type: 'referral',
                        months: 1,
                        source: new ObjectId(req.user.id),
                        created_at: new Date()
                    });

                    // Create reward for referee
                    await rewardsCollection.insertOne({
                        user_id: new ObjectId(req.user.id),
                        reward_type: 'referral_signup',
                        months: 1,
                        source: pendingReferral.referrer_user_id,
                        created_at: new Date()
                    });

                    // Extend subscription expiry for both
                    await extendSubscriptionExpiry(usersCollection, pendingReferral.referrer_user_id);
                    await extendSubscriptionExpiry(usersCollection, new ObjectId(req.user.id));

                    console.log('🎁 Referral rewards granted for referrer:', pendingReferral.referrer_user_id, 'and referee:', req.user.email);
                }
            }
        } catch (refError) {
            console.error('⚠️ Referral reward error (non-blocking):', refError.message);
        }

        res.json({ success: true, message: 'Subscription activated successfully' });
    } catch (error) {
        console.error('Error verifying subscription:', error);
        res.status(500).json({ success: false, message: 'Payment verification failed' });
    }
});

// Authenticated API: Cancel subscription
app.post('/api/subscription/cancel', authenticateUser, async (req, res) => {
    try {
        if (!usersCollection) {
            return res.status(500).json({ success: false, message: 'Database not connected' });
        }
        const { ObjectId } = require('mongodb');
        const user = await usersCollection.findOne({ _id: new ObjectId(req.user.id) });
        if (!user || !user.razorpaySubscriptionId) {
            return res.status(400).json({ success: false, message: 'No active subscription found' });
        }
        await razorpay.subscriptions.cancel(user.razorpaySubscriptionId, { cancel_at_cycle_end: 1 });
        await usersCollection.updateOne(
            { _id: new ObjectId(req.user.id) },
            { $set: { subscriptionStatus: 'cancelled', cancelledAt: new Date() } }
        );
        await subscriptionTransactionsCollection.updateOne(
            { userId: new ObjectId(req.user.id), status: 'active' },
            { $set: { status: 'cancelled', cancelledAt: new Date() } }
        );
        console.log('Subscription cancelled for:', req.user.email);
        res.json({ success: true, message: 'Subscription cancelled. Access continues until end of billing cycle.' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel subscription.' });
    }
});

// ==========================================
// RAZORPAY WEBHOOK
// ==========================================
app.post('/api/razorpay/webhook', async (req, res) => {
    try {
        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error('❌ RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({ success: false });
        }

        const signature = req.headers['x-razorpay-signature'];
        if (!signature) {
            console.error('❌ Webhook: Missing signature header');
            return res.status(400).json({ success: false });
        }

        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (expectedSignature !== signature) {
            console.error('❌ Webhook: Invalid signature');
            return res.status(400).json({ success: false });
        }

        const event = req.body.event;
        const payload = req.body.payload;
        console.log('🔔 Razorpay webhook:', event);

        const { ObjectId } = require('mongodb');

        // Handle subscription events
        if (event === 'subscription.activated') {
            const subscriptionId = payload.subscription?.entity?.id;
            if (subscriptionId && usersCollection) {
                const user = await usersCollection.findOne({ razorpaySubscriptionId: subscriptionId });
                if (user && user.subscriptionStatus !== 'subscribed') {
                    await usersCollection.updateOne(
                        { _id: user._id },
                        { $set: { subscriptionStatus: 'subscribed', subscribedAt: new Date() } }
                    );
                    console.log('✅ Webhook: Subscription activated for', user.email);
                }
            }
        }

        if (event === 'subscription.cancelled') {
            const subscriptionId = payload.subscription?.entity?.id;
            if (subscriptionId && usersCollection) {
                const user = await usersCollection.findOne({ razorpaySubscriptionId: subscriptionId });
                if (user && user.subscriptionStatus !== 'cancelled') {
                    await usersCollection.updateOne(
                        { _id: user._id },
                        { $set: { subscriptionStatus: 'cancelled', cancelledAt: new Date() } }
                    );
                    if (subscriptionTransactionsCollection) {
                        await subscriptionTransactionsCollection.updateOne(
                            { userId: user._id, status: 'active' },
                            { $set: { status: 'cancelled', cancelledAt: new Date() } }
                        );
                    }
                    console.log('✅ Webhook: Subscription cancelled for', user.email);
                }
            }
        }

        if (event === 'subscription.charged') {
            const subscriptionId = payload.subscription?.entity?.id;
            const paymentId = payload.payment?.entity?.id;
            if (subscriptionId && usersCollection) {
                const user = await usersCollection.findOne({ razorpaySubscriptionId: subscriptionId });
                if (user) {
                    // Ensure user is marked as subscribed on each successful charge
                    await usersCollection.updateOne(
                        { _id: user._id },
                        { $set: { subscriptionStatus: 'subscribed', lastChargedAt: new Date() } }
                    );
                    console.log('✅ Webhook: Subscription charged for', user.email, 'payment:', paymentId);
                }
            }
        }

        if (event === 'payment.captured') {
            const paymentId = payload.payment?.entity?.id;
            const amount = payload.payment?.entity?.amount;
            console.log('✅ Webhook: Payment captured', paymentId, 'amount:', amount);
        }

        if (event === 'payment.failed') {
            const paymentId = payload.payment?.entity?.id;
            const error = payload.payment?.entity?.error_description;
            console.log('⚠️ Webhook: Payment failed', paymentId, 'error:', error);
        }

        // Always return 200 to acknowledge receipt
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Webhook error:', error);
        // Still return 200 to prevent Razorpay from retrying
        res.status(200).json({ success: true });
    }
});

// Serve purity wall / dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'purity-wall.html'));
});

app.get('/purity-wall', (req, res) => {
    res.sendFile(path.join(__dirname, 'purity-wall.html'));
});

// Serve deep dive report page
app.get('/deep-dive', (req, res) => {
    res.sendFile(path.join(__dirname, 'deep-dive.html'));
});

// Serve Namdhari report page
app.get('/namdhari-report', (req, res) => {
    res.sendFile(path.join(__dirname, 'namdhari-report.html'));
});

// Serve contact us page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact-us.html'));
});


// Admin API: Parse existing report HTML to extract test parameters
app.get('/api/admin/parse-report/:filename', authenticateAdmin, async (req, res) => {
    try {
        const fs = require('fs');
        const filePath = path.join(__dirname, req.params.filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Report file not found' });
        }
        
        const html = fs.readFileSync(filePath, 'utf8');
        
        // Extract product name from h1
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        const productName = h1Match ? h1Match[1].trim() : '';
        
        // Extract brand name
        const brandMatch = html.match(/class="brand-name"[^>]*>([^<]+)</);
        const brandName = brandMatch ? brandMatch[1].trim() : '';
        
        // Extract score
        const scoreMatch = html.match(/class="score-circle"[^>]*>([\d.]+)/);
        const purityScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
        
        // Extract meta info
        const batchMatch = html.match(/Batch No\..*?class="meta-value"[^>]*>([^<]+)/s);
        const batchCode = batchMatch ? batchMatch[1].trim() : '';
        
        const dateMatch = html.match(/Report Date.*?class="meta-value"[^>]*>([^<]+)/s);
        const testDate = dateMatch ? dateMatch[1].trim() : '';
        
        const labMatch = html.match(/Testing Lab.*?class="meta-value"[^>]*>([^<]+)/s);
        const methodology = labMatch ? 'Tested by ' + labMatch[1].trim() : '';
        
        // Extract sections and parameters from tables
        const testParameters = [];
        const sectionRegex = /class="section-title"[^>]*>([^<]+)<\/h2>[\s\S]*?<table class="parameters-table">[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/g;
        let sectionMatch;
        
        while ((sectionMatch = sectionRegex.exec(html)) !== null) {
            const sectionName = sectionMatch[1].replace(/^[\d️⃣]+\s*/, '').trim();
            const tbody = sectionMatch[2];
            const parameters = [];
            
            const rowRegex = /<tr>[\s\S]*?<td>([^<]*)<\/td>[\s\S]*?<td>([^<]*)<\/td>[\s\S]*?<td>([^<]*)<\/td>[\s\S]*?status-(pass|warning|fail)/g;
            let rowMatch;
            
            while ((rowMatch = rowRegex.exec(tbody)) !== null) {
                parameters.push({
                    name: rowMatch[1].trim(),
                    measuredValue: rowMatch[2].trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                    acceptableRange: rowMatch[3].trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                    status: rowMatch[4]
                });
            }
            
            if (parameters.length > 0) {
                testParameters.push({ section: sectionName, parameters });
            }
        }
        
        // Extract expert commentary / summary
        const summaryMatch = html.match(/Executive Summary[\s\S]*?<p>([^<]+)/);
        const expertCommentary = summaryMatch ? summaryMatch[1].trim() : '';
        
        res.json({
            success: true,
            data: {
                productName,
                brandName: brandName || productName.split(' ')[0],
                category: 'Dairy',
                purityScore: Math.min(purityScore, 10),
                testParameters,
                expertCommentary,
                batchCode,
                testDate,
                methodology,
                statusBadges: purityScore >= 7 ? ['Top Rated'] : purityScore >= 4 ? ['Recent Test'] : ['Alert']
            }
        });
    } catch (error) {
        console.error('Error parsing report:', error);
        res.status(500).json({ success: false, message: 'Failed to parse report' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📧 Email Configuration:');
    console.log('   MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('   MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || '❌ Not set');
    console.log('   MAILGUN_FROM_EMAIL:', process.env.MAILGUN_FROM_EMAIL || '❌ Not set');
    console.log('   WHATSAPP_GROUP_LINK:', process.env.WHATSAPP_GROUP_LINK ? '✅ Set' : '❌ Not set');
});
