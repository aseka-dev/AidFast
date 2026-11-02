import mongoose, { Schema, Document } from 'mongoose';

export interface IPharmacy extends Document {
    name: string;
    registrationNumber?: string;
    address: string;
    contactNumber?: string;
    email?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

const pharmacySchema = new Schema<IPharmacy>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        registrationNumber: {
            type: String,
            trim: true,
            sparse: true,
            unique: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        contactNumber: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
            default: 'PENDING'
        }
    },
    {
        timestamps: true,
        collection: 'pharmacies'
    }
);

export default mongoose.model<IPharmacy>(
    'Pharmacy',
    pharmacySchema
);