
import mongoose from 'mongoose';
import Pharmacy from '../models/Pharmacy';

// Escape special characters in the selected area.
function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Find active pharmacies in the selected area.
export async function findPharmaciesByArea(area: string) {
    const town = area.trim();

    if (!town || town.length > 100) {
        throw new Error('Valid town or area is required');
    }

    return Pharmacy.find({
    status: 'ACTIVE',
    address: {
        $regex: escapeRegex(town),
        $options: 'i'
    }
});
}

// Find one active pharmacy selected by the customer.
export async function findSpecificPharmacy(pharmacyId: string) {
    if (!mongoose.isValidObjectId(pharmacyId)) {
        throw new Error('Invalid pharmacy ID');
    }

    return Pharmacy.findOne({
    _id: pharmacyId,
    status: 'ACTIVE'
});
}
