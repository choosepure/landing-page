const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        const client = new MongoClient(process.env.MONGO_URL);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db(process.env.DB_NAME || 'choosepure_db');
        const usersCollection = db.collection('users');
        
        // Admin details. Password MUST come from the environment — never commit
        // a plaintext admin password (this repo is public).
        const email = process.env.ADMIN_EMAIL || 'priyank@choosepure.in';
        const password = process.env.ADMIN_PASSWORD;
        const name = process.env.ADMIN_NAME || 'Priyank Barthwal';

        if (!password) {
            console.error('❌ ADMIN_PASSWORD environment variable is not set. Refusing to create admin.');
            await client.close();
            process.exit(1);
        }
        
        // Check if admin already exists
        const existingAdmin = await usersCollection.findOne({ email });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists:', email);
            await client.close();
            return;
        }
        
        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create admin user
        const adminUser = {
            fname: name,
            email: email,
            mobile: '9999999999',
            password: hashedPassword,
            role: 'admin',
            created_at: new Date(),
            last_login: null
        };
        
        console.log('💾 Creating admin user...');
        const result = await usersCollection.insertOne(adminUser);
        
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', email);
        console.log('🆔 User ID:', result.insertedId);
        console.log('\n⚠️ IMPORTANT: Change the password after first login!');
        
        await client.close();
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
}

createAdmin();
