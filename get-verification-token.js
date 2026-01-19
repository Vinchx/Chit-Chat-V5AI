import mongoose from 'mongoose';
import User from './src/models/User.js';
import 'dotenv/config';

async function getVerificationToken() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ username: 'uitest_new_2' })
            .select('verificationToken email username displayName isVerified');

        if (user) {
            console.log('\n📧 User Information:');
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Display Name:', user.displayName);
            console.log('Verified:', user.isVerified);
            console.log('\n🔑 Verification Token:', user.verificationToken);
            console.log('\n🔗 Verification URL:');
            console.log(`https://breanne-unenrichable-aquatically.ngrok-free.dev/auth/verify/${user.verificationToken}`);
        } else {
            console.log('❌ User not found');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

getVerificationToken();
