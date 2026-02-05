const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const debugRegistration = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastq';
        await mongoose.connect(uri);
        console.log('Connected.');

        const uniqueEmail = `debug${Date.now()}@example.com`;
        console.log(`Attempting to create user with email: ${uniqueEmail}`);

        const user = new User({
            name: 'Debug User',
            email: uniqueEmail,
            password: 'password123',
            role: 'user'
        });

        console.log('Saving user...');
        await user.save();
        console.log('User saved successfully!');

    } catch (error) {
        console.error('FATAL ERROR:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
};

debugRegistration();
