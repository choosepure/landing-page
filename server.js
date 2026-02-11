const express = require('express');
const cors = require('cors');
const path = require('path');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection (example with PostgreSQL)
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database table
async function initDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS waitlist (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(20) NOT NULL,
            pincode VARCHAR(6) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    try {
        await pool.query(createTableQuery);
        console.log('Database table initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initDatabase();

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
        const messageData = {
            from: process.env.MAILGUN_FROM_EMAIL || 'support@choosepure.in',
            to: 'support@choosepure.in',
            subject: 'New Waitlist Signup - ChoosePure',
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
        
        const result = await mg.messages.create(process.env.MAILGUN_DOMAIN || 'choosepure.in', messageData);
        console.log('✅ Admin email sent:', result);
        return result;
    } catch (error) {
        console.error('❌ Failed to send admin email:', error);
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
        const userData = { name, email, phone, pincode, created_at: new Date() };
        
        // Try to save to database
        try {
            const insertQuery = `
                INSERT INTO waitlist (name, email, phone, pincode)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            const result = await pool.query(insertQuery, [name, email, phone, pincode]);
            console.log('✅ User saved to database:', result.rows[0]);
        } catch (dbError) {
            if (dbError.code === '23505') { // Duplicate email
                return res.status(400).json({ 
                    success: false, 
                    message: 'This email is already registered' 
                });
            }
            console.error('⚠️ Database error (continuing anyway):', dbError.message);
        }
        
        // Get WhatsApp community link
        const whatsappLink = process.env.WHATSAPP_GROUP_LINK || 'https://chat.whatsapp.com/your-group-invite-link';
        
        // Try to send emails (don't block on failure but log errors)
        console.log('📧 Attempting to send emails...');
        try {
            await Promise.all([
                sendUserEmail(email, name, whatsappLink),
                sendAdminEmail(userData)
            ]);
            console.log('✅ Both emails sent successfully');
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            console.error('Full error:', JSON.stringify(emailError, null, 2));
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
    res.json({ status: 'ok' });
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

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📧 Email Configuration:');
    console.log('   MAILGUN_API_KEY:', process.env.MAILGUN_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('   MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN || '❌ Not set');
    console.log('   MAILGUN_FROM_EMAIL:', process.env.MAILGUN_FROM_EMAIL || '❌ Not set');
    console.log('   WHATSAPP_GROUP_LINK:', process.env.WHATSAPP_GROUP_LINK ? '✅ Set' : '❌ Not set');
});
