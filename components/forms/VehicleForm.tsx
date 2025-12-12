'use client';

import { useState, useEffect } from 'react';
import { Vehicle } from '@/types/database';
import { Input, Button, Select } from '@/components/ui';

export interface VehicleFormData {
    name: string;
    license_plate: string;
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
    const [licensePlate, setLicensePlate] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState<VehicleFormData['status']>('available');

    // Initialize form with data if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setLicensePlate(initialData.license_plate || '');
            setType(initialData.type || '');
            setStatus(initialData.status);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            name,
            license_plate: licensePlate,
            type,
            status,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter vehicle name"
                fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="License Plate"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="XYZ-1234"
                    fullWidth
                />

                <Input
                    label="Type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="e.g., Van, Truck"
                    fullWidth
                />
            </div>

            <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                options={[
                    { value: 'available', label: 'Available' },
                    { value: 'in-use', label: 'In Use' },
                    { value: 'maintenance', label: 'Maintenance' },
                ]}
                fullWidth
            />

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
