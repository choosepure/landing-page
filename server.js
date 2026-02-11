const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

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
    const mailOptions = {
        from: process.env.EMAIL_USER,
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
    
    return transporter.sendMail(mailOptions);
}

// Send notification to admin
async function sendAdminEmail(userData) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
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
    
    return transporter.sendMail(mailOptions);
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
    
    try {
        // Save to database
        const insertQuery = `
            INSERT INTO waitlist (name, email, phone, pincode)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const result = await pool.query(insertQuery, [name, email, phone, pincode]);
        const userData = result.rows[0];
        
        // Get WhatsApp community link
        const whatsappLink = await addToWhatsAppCommunity(phone, name);
        
        // Send emails in parallel
        await Promise.all([
            sendUserEmail(email, name, whatsappLink),
            sendAdminEmail(userData)
        ]);
        
        res.json({ 
            success: true, 
            message: 'Successfully joined the waitlist!',
            whatsappLink: whatsappLink
        });
        
    } catch (error) {
        console.error('Error processing waitlist:', error);
        
        if (error.code === '23505') { // Duplicate email
            return res.status(400).json({ 
                success: false, 
                message: 'This email is already registered' 
            });
        }
        
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

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
