const express = require('express');
const cors = require('cors');
const path = require('path');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
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

// MongoDB connection
let db;
let waitlistCollection;
let usersCollection;
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
        
        // Verify collections exist
        const collections = await db.listCollections().toArray();
        console.log('📚 Available collections:', collections.map(c => c.name).join(', '));
        
        // Create index on email for uniqueness
        await waitlistCollection.createIndex({ email: 1 }, { unique: true });
        console.log('✅ Waitlist collection initialized');
        console.log('✅ Users collection initialized');
        
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

// Middleware
app.use(cors());
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

// Send email to user
async function sendUserEmail(email, name, whatsappLink) {
    try {
        const messageData = {
            from: process.env.MAILGUN_FROM_EMAIL || 'support@choosepure.in',
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
        try {
            if (!waitlistCollection) {
                console.error('❌ Database collection not initialized!');
                console.log('Attempting to reconnect...');
                await connectToDatabase();
            }
            
            if (waitlistCollection) {
                console.log('💾 Saving to database:', { name, email, phone, pincode });
                const result = await waitlistCollection.insertOne(userData);
                console.log('✅ User saved to database with ID:', result.insertedId);
                userData._id = result.insertedId;
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
        timestamp: new Date().toISOString()
    });
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
            from: process.env.MAILGUN_FROM_EMAIL || 'support@choosepure.in',
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
        const messageData = {
            from: process.env.MAILGUN_FROM_EMAIL || 'support@choosepure.in',
            to: 'support@choosepure.in',
            subject: 'Test Email from ChoosePure',
            text: 'This is a test email to verify Mailgun configuration.',
            html: '<h1>Test Email</h1><p>This is a test email to verify Mailgun configuration.</p>'
        };
        
        console.log('📤 Sending test email...');
        const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, messageData);
        console.log('✅ Test email sent successfully:', result);
        
        res.json({ 
            success: true, 
            message: 'Test email sent successfully! Check support@choosepure.in inbox.',
            messageId: result.id,
            status: result.status
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📧 Email Configuration:');
    console.log('   MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('   MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || '❌ Not set');
    console.log('   MAILGUN_FROM_EMAIL:', process.env.MAILGUN_FROM_EMAIL || '❌ Not set');
    console.log('   WHATSAPP_GROUP_LINK:', process.env.WHATSAPP_GROUP_LINK ? '✅ Set' : '❌ Not set');
});
