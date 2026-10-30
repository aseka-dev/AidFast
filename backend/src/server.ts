import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';

// Ensure .env is loaded from the backend directory regardless of cwd
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());

// Test API route
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

// Server port
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
