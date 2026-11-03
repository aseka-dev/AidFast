import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    pharmacyId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    alertId?: mongoose.Types.ObjectId;
    title: string;
    message: string;
    notificationType: string;
    isRead: boolean;
}

const notificationSchema = new Schema<INotification>(
    {
        pharmacyId: {
            type: Schema.Types.ObjectId,
            ref: 'Pharmacy',
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        alertId: {
            type: Schema.Types.ObjectId,
            ref: 'Alert'
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        notificationType: {
            type: String,
            required: true,
            trim: true
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        collection: 'notifications'
    }
);

notificationSchema.index({ pharmacyId: 1, userId: 1, isRead: 1 });

export default mongoose.model<INotification>('Notification', notificationSchema);
