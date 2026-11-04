
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

import connectDB from './config/db';

import authRoutes from './routes/authRoutes';
import pharmacyRoutes from './routes/pharmacyRoutes';
import settingsRoutes from './routes/settingsRoutes';
import userRoutes from './routes/userRoutes';

import supplierRoutes from './routes/supplierRoutes';
import grnRoutes from './routes/grnRoutes';

import medicineRequestRoutes from './routes/medicineRequestRoutes';

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

app.use('/api/auth', authRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);

// Versioned aliases for platform routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/pharmacies', pharmacyRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/users', userRoutes);


 // Public Medicine Request API (Member 6)
app.use(
    '/api/v1/public/medicine-requests',
    medicineRequestRoutes
);

// Public Medicine Search API (Member 6)
app.use(
    '/api/v1/public/medicines',
    publicMedicineRoutes
);

// Public Pharmacy Directory API (Member 6)
app.use(
    '/api/v1/public/pharmacies',
    publicPharmacyRoutes
);

// Supplier API
app.use(
    '/api/v1/pharmacies/:pharmacyId/suppliers',
    supplierRoutes
);

// GRN API
app.use(
    '/api/v1/pharmacies/:pharmacyId/grns',
    grnRoutes
);


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
            console.log(
                `Health check: http://localhost:${PORT}/api/health`
            );
        });
    } catch (error) {
        console.error('Failed to start AidFast server:', error);
        process.exit(1);
    }
};

startServer();
