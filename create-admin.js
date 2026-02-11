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
        
        // Admin details
        const email = 'priyank@choosepure.in';
        const password = 'ChoosePure@2026'; // Change this to your desired password
        const name = 'Priyank Barthwal';
        
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
        console.log('🔑 Password:', password);
        console.log('🆔 User ID:', result.insertedId);
        console.log('\n⚠️ IMPORTANT: Change the password after first login!');
        
        await client.close();
    } catch (error) {
        console.error('❌ Error creating admin:', error);
    }
}

createAdmin();
