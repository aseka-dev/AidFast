import mongoose, { Schema, Document } from 'mongoose';

export type RoleName =
    | 'ADMIN'
    | 'PHARMACIST'
    | 'STAFF'
    | 'VERIFIER';

export interface IRole extends Document {
    name: RoleName;
    description: string;
    permissions: string[];
}

const roleSchema = new Schema<IRole>(
    {
        name: {
            type: String,
            enum: ['ADMIN', 'PHARMACIST', 'STAFF', 'VERIFIER'],
            required: true,
            unique: true
        },
        description: {
            type: String,
            required: true
        },
        permissions: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true,
        collection: 'roles'
    }
);

export default mongoose.model<IRole>(
    'Role',
    roleSchema
);