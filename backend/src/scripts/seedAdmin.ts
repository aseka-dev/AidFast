import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import connectDB from '../config/db';
import Pharmacy from '../models/Pharmacy';
import User from '../models/User';
import Role, { RoleName } from '../models/Role';
import PharmacyUser from '../models/PharmacyUser';
import PharmacySetting from '../models/PharmacySetting';
import { ROLE_PERMISSIONS } from '../config/permissions';

// Load environment variables from backend/.env
dotenv.config({
    path: path.resolve(__dirname, '../../.env')
});

const seedAdmin = async (): Promise<void> => {
    try {
        const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.SEED_ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) {
            throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
        }
        console.log('Connecting to MongoDB...');
        await connectDB();

        // 1. Create or find default test pharmacies (Multi-Tenant Demo)
        console.log('Creating demo pharmacies...');

        const pharmaciesToSeed = [
            {
                name: 'Greenway Community Pharmacy',
                address: '142 Galle Road, Colombo 03, Sri Lanka',
                contactNumber: '+94 11 234 5678',
                email: 'contact@greenwaypharmacy.lk',
                status: 'ACTIVE' as const
            },
            {
                name: 'Gimshani Pharmacy',
                address: 'Kandana, Sri Lanka',
                contactNumber: '+94 11 876 5432',
                email: 'info@gimshanipharmacy.lk',
                status: 'ACTIVE' as const
            }
        ];

        const seededPharmacies = [];
        for (const pData of pharmaciesToSeed) {
            let pharmacy = await Pharmacy.findOne({ name: pData.name });
            if (!pharmacy) {
                pharmacy = await Pharmacy.create(pData);
                console.log(`Created new pharmacy: ${pharmacy.name}`);
            } else {
                console.log(`Pharmacy exists: ${pharmacy.name}`);
            }
            seededPharmacies.push(pharmacy);
        }

        // 2. Create or update roles with the finalized Sprint 1 permissions matrix
        console.log('Creating finalized roles & permissions...');

        const createdRoles = new Map<RoleName, mongoose.Types.ObjectId>();

        for (const [roleName, roleData] of Object.entries(ROLE_PERMISSIONS)) {
            const role = await Role.findOneAndUpdate(
                { name: roleName as RoleName },
                {
                    $set: {
                        name: roleName as RoleName,
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
                roleName as RoleName,
                role._id as mongoose.Types.ObjectId
            );

            console.log(`Role ready: ${roleName} (${roleData.permissions.length} permissions)`);
        }

        // 3. Create or find the admin user
        console.log('Creating admin user...');


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

        // 4. Create admin pharmacy memberships for all seeded pharmacies
        console.log('Creating admin multi-tenant memberships...');

        const adminRoleId = createdRoles.get('ADMIN');
        if (!adminRoleId) {
            throw new Error('ADMIN role was not created.');
        }

        for (const pharmacy of seededPharmacies) {
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

            // 5. Create or find pharmacy settings for each pharmacy
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

            console.log(`Tenant linked & configured: ${pharmacy.name}`);
        }

        console.log('\n================================');
        console.log('AidFast database seeding complete!');
        console.log('================================');
        console.log('Available Pharmacies:');
        seededPharmacies.forEach((p) => console.log(` - ${p.name}`));
        console.log('Admin Email:   ', adminEmail);

        console.log('================================');

    } catch (error) {
        console.error('Database seeding failed:', error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
    }
};

seedAdmin();
