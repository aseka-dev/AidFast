import mongoose, { Schema, Document } from 'mongoose';

export interface IPharmacyUser extends Document {
    userId: mongoose.Types.ObjectId;
    pharmacyId: mongoose.Types.ObjectId;
    roleId: mongoose.Types.ObjectId;
    isActive: boolean;
}

const pharmacyUserSchema = new Schema<IPharmacyUser>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        pharmacyId: {
            type: Schema.Types.ObjectId,
            ref: 'Pharmacy',
            required: true
        },
        roleId: {
            type: Schema.Types.ObjectId,
            ref: 'Role',
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        collection: 'pharmacyUsers'
    }
);

pharmacyUserSchema.index(
    { userId: 1, pharmacyId: 1 },
    { unique: true }
);

pharmacyUserSchema.index(
    { pharmacyId: 1, isActive: 1 }
);

export default mongoose.model<IPharmacyUser>(
    'PharmacyUser',
    pharmacyUserSchema
);