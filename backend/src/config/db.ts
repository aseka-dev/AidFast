import mongoose from 'mongoose';

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            console.error('Database connection failed: MONGO_URI is not defined in .env');
            process.exit(1);
        }

        if (mongoUri.includes('<db_username>') || mongoUri.includes('<password>')) {
            console.error(
                'Database connection failed: MONGO_URI still contains placeholder values (<db_username> or <password>). Please update backend/.env with your actual MongoDB credentials.'
            );
            process.exit(1);
        }

        try {
            await mongoose.connect(mongoUri);
            console.log('MongoDB connected successfully');
        } catch (error) {
            console.error('Database connection failed:', error);
            process.exit(1);
        }
    };

    export default connectDB;