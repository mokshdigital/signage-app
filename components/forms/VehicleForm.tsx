'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/types/database';
import { Input, Button, Select } from '@/components/ui';

export interface VehicleFormData {
    name: string;
    make: string;
    license_plate: string;
    driver: string;
    registration: string;
    gross_weight: string;
    vin: string;
    type: string;
    status: 'available' | 'in-use' | 'maintenance';
}

interface VehicleFormProps {
    initialData?: Vehicle;
    onSubmit: (data: VehicleFormData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function VehicleForm({
    initialData,
    onSubmit,
    isLoading = false,
    onCancel,
}: VehicleFormProps) {
    const [name, setName] = useState('');
    const [make, setMake] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [driver, setDriver] = useState('');
    const [registration, setRegistration] = useState('');
    const [grossWeight, setGrossWeight] = useState('');
    const [vin, setVin] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState<VehicleFormData['status']>('available');

    // Initialize form with data if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setMake(initialData.make || '');
            setLicensePlate(initialData.license_plate || '');
            setDriver(initialData.driver || '');
            setRegistration(initialData.registration || '');
            setGrossWeight(initialData.gross_weight || '');
            setVin(initialData.vin || '');
            setType(initialData.type || '');
            setStatus(initialData.status);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            name,
            make,
            license_plate: licensePlate,
            driver,
            registration,
            gross_weight: grossWeight,
            vin,
            type,
            status,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Identity Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
                    Vehicle Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Enter vehicle name"
                        fullWidth
                    />
                    <Input
                        label="Make"
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="e.g., Ford, Toyota"
                        fullWidth
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        placeholder="e.g., Van, Truck, SUV"
                        fullWidth
                    />
                    <Input
                        label="Driver"
                        value={driver}
                        onChange={(e) => setDriver(e.target.value)}
                        placeholder="Assigned driver name"
                        fullWidth
                    />
                </div>
            </div>

            {/* Registration Details Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
                    Registration Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="License Plate"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        placeholder="XYZ-1234"
                        fullWidth
                    />
                    <Input
                        label="Registration"
                        value={registration}
                        onChange={(e) => setRegistration(e.target.value)}
                        placeholder="Registration number"
                        fullWidth
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="VIN"
                        value={vin}
                        onChange={(e) => setVin(e.target.value)}
                        placeholder="Vehicle Identification Number"
                        fullWidth
                    />
                    <Input
                        label="Gross Weight (GVW)"
                        value={grossWeight}
                        onChange={(e) => setGrossWeight(e.target.value)}
                        placeholder="e.g., 5000 lbs"
                        fullWidth
                    />
                </div>
            </div>

            {/* Status Section */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
                    Status
                </h3>
                <Select
                    label="Current Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    options={[
                        { value: 'available', label: 'Available' },
                        { value: 'in-use', label: 'In Use' },
                        { value: 'maintenance', label: 'Maintenance' },
                    ]}
                    fullWidth
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                {onCancel && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    loading={isLoading}
                >
                    {initialData ? 'Update Vehicle' : 'Add Vehicle'}
                </Button>
            </div>
        </form>
    );
}
