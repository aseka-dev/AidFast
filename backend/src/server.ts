
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import connectDB from './config/db';

import authRoutes from './routes/authRoutes';
import pharmacyRoutes from './routes/pharmacyRoutes';
import settingsRoutes from './routes/settingsRoutes';
import userRoutes from './routes/userRoutes';

import supplierRoutes from './routes/supplierRoutes';
import grnRoutes from './routes/grnRoutes';

import medicineRequestRoutes from './routes/medicineRequestRoutes';
import publicMedicineRoutes from './routes/publicMedicineRoutes';
import publicPharmacyRoutes from './routes/publicPharmacyRoutes';
import alertRoutes from './routes/alertRoutes';
import safetyRoutes from './routes/safetyRoutes';

import medicineRoutes from './routes/medicineRoutes';
import batchRoutes from './routes/batchRoutes';

import {
  authenticate,
  requireSelectedPharmacy
} from './middleware/authMiddleware';

import matchPharmacyParam from './middleware/matchPharmacyParam';

// Load environment variables from backend/.env
dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:8080')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
    origin: allowedOrigins,
    credentials: true
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
  
  // Alerts and Safety API (Member 5)
  app.use('/api/v1', alertRoutes);
  app.use('/api/v1', safetyRoutes);
 
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

// Medicine Catalog API
app.use(
  '/api/v1/pharmacies/:pharmacyId/medicines',
  authenticate,
  requireSelectedPharmacy,
  matchPharmacyParam,
  medicineRoutes
);

// Batch Management API
app.use(
  '/api/v1/pharmacies/:pharmacyId/batches',
  authenticate,
  requireSelectedPharmacy,
  matchPharmacyParam,
  batchRoutes
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

        app.listen(PORT, "0.0.0.0" , () => {
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
