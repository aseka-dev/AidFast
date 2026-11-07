import mongoose, { Schema, Document } from 'mongoose';

export interface IPharmacySetting extends Document {
    pharmacyId: mongoose.Types.ObjectId;
    timezone: string;
    lowStockThreshold: number;
    publicAvailabilityEnabled: boolean;
    expiryAlertMonths: number[];
    dateFormat: string;
    currency: string;
}

const pharmacySettingSchema = new Schema<IPharmacySetting>(
    {
        pharmacyId: {
            type: Schema.Types.ObjectId,
            ref: 'Pharmacy',
            required: true,
            unique: true
        },
        timezone: {
            type: String,
            default: 'Asia/Colombo'
        },
        lowStockThreshold: {
            type: Number,
            default: 10,
            min: 0
        },
        publicAvailabilityEnabled: {
            type: Boolean,
            default: true
        },
        expiryAlertMonths: {
            type: [Number],
            default: [12, 9, 6]
        },
        dateFormat: {
            type: String,
            default: 'DD MMM YYYY'
        },
        currency: {
            type: String,
            default: 'LKR — Sri Lankan Rupee'
        }
    },
    {
        timestamps: true,
        collection: 'pharmacySettings'
    }
);

export default mongoose.model<IPharmacySetting>(
    'PharmacySetting',
    pharmacySettingSchema
);
