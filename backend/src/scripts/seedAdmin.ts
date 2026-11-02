
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import connectDB from '../config/db';
import Pharmacy from '../models/Pharmacy';
import User from '../models/User';
import Role from '../models/Role';
import PharmacyUser from '../models/PharmacyUser';
import PharmacySetting from '../models/PharmacySetting';
import { RoleName } from '../models/Role';

// Load environment variables from backend/.env
dotenv.config({
    path: path.resolve(__dirname, '../../.env')
});

// Role definitions
const roleDefinitions: {
    name: RoleName;
    description: string;
    permissions: string[];
}[] = [
        {
            name: 'ADMIN',
            description: 'Full pharmacy administration access',
            permissions: ['*']
        },
        {
            name: 'PHARMACIST',
            description: 'Pharmacist access',
            permissions: [
                'users:read',
                'inventory:read',
                'sales:create',
                'reports:read',
                'pharmacy:settings'
            ]
        },
        {
            name: 'STAFF',
            description: 'Pharmacy staff access',
            permissions: [
                'inventory:read',
                'sales:create'
            ]
        },
        {
            name: 'VERIFIER',
            description: 'Verification access',
            permissions: [
                'users:read'
            ]
        }
    ];

const seedAdmin = async (): Promise<void> => {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();

        // 1. Create or find the pharmacy
        console.log('Creating pharmacy...');

        let pharmacy = await Pharmacy.findOne({
            name: 'Gimshani Pharmacy'
        });

        if (!pharmacy) {
            pharmacy = await Pharmacy.create({
                name: 'Gimshani Pharmacy',
                address: 'Kandana, Sri Lanka',
                contactNumber: '',
                email: 'info@gimshanipharmacy.lk',
                status: 'ACTIVE'
            });
        }

        console.log('Pharmacy ready:', pharmacy.name);

        // 2. Create or update roles
        console.log('Creating roles...');

        const createdRoles = new Map<RoleName, mongoose.Types.ObjectId>();

        for (const roleData of roleDefinitions) {
            const role = await Role.findOneAndUpdate(
                { name: roleData.name },
                {
                    $set: {
                        name: roleData.name,
                        description: roleData.description,
                        permissions: roleData.permissions
                    }
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true
                }
            );

            createdRoles.set(
                roleData.name,
                role._id as mongoose.Types.ObjectId
            );

            console.log(`Role ready: ${roleData.name}`);
        }

        // 3. Create or find the admin user
        console.log('Creating admin user...');

        const adminEmail = 'admin@aidfast.lk';
        const adminPassword = 'AidFast@123';

        let admin = await User.findOne({
            email: adminEmail
        }).select('+password');

        if (!admin) {
            const hashedPassword = await bcrypt.hash(
                adminPassword,
                12
            );

            admin = await User.create({
                fullName: 'AidFast Administrator',
                email: adminEmail,
                password: hashedPassword,
                isActive: true
            });
        } else {
            console.log('Existing admin account found. Password unchanged.');
        }

        console.log('Admin user ready:', admin.email);

        // 4. Create or update admin pharmacy membership
        console.log('Creating admin pharmacy membership...');

        const adminRoleId = createdRoles.get('ADMIN');

        if (!adminRoleId) {
            throw new Error('ADMIN role was not created.');
        }

        await PharmacyUser.findOneAndUpdate(
            {
                userId: admin._id,
                pharmacyId: pharmacy._id
            },
            {
                $set: {
                    userId: admin._id,
                    pharmacyId: pharmacy._id,
                    roleId: adminRoleId,
                    isActive: true
                }
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        console.log('Admin membership ready.');

        // 5. Create or find pharmacy settings
        console.log('Creating pharmacy settings...');

        await PharmacySetting.findOneAndUpdate(
            {
                pharmacyId: pharmacy._id
            },
            {
                $setOnInsert: {
                    pharmacyId: pharmacy._id,
                    timezone: 'Asia/Colombo',
                    lowStockThreshold: 10,
                    publicAvailabilityEnabled: true,
                    expiryAlertMonths: [12, 9, 6]
                }
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        console.log('Pharmacy settings ready.');

        console.log('\n================================');
        console.log('AidFast database seeding complete!');
        console.log('================================');
        console.log('Pharmacy: Gimshani Pharmacy');
        console.log('Admin email:', adminEmail);
        console.log('Initial admin password:', adminPassword);
        console.log('================================');
        console.log('Keep these credentials private.');

    } catch (error) {
        console.error('Database seeding failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
    }
};

seedAdmin();
