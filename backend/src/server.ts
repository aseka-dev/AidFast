
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

import connectDB from './config/db';

// Load environment variables from backend/.env
dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());

// Test API route
app.get('/', (req, res) => {
    res.send('Backend server is running!');
});

// Health Check API
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'AidFast Backend API is running',
        status: 'OK'
    });
});
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Server port
const PORT = Number(process.env.PORT) || 5000;

// Start server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`AidFast server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start AidFast server:', error);
        process.exit(1);
    }
};

startServer();
