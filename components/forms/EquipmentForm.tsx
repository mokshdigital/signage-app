'use client';

import { useState, useEffect } from 'react';
import { Equipment } from '@/types/database';
import { Input, Button, Select } from '@/components/ui';

export interface EquipmentFormData {
    name: string;
    type: string;
    status: 'available' | 'in-use' | 'maintenance';
}

interface EquipmentFormProps {
    initialData?: Equipment;
    onSubmit: (data: EquipmentFormData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function EquipmentForm({
    initialData,
    onSubmit,
    isLoading = false,
    onCancel,
}: EquipmentFormProps) {
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [status, setStatus] = useState<EquipmentFormData['status']>('available');

    // Initialize form with data if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setType(initialData.type || '');
            setStatus(initialData.status);
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            name,
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
                placeholder="Enter equipment name"
                fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder="e.g., Ladder, Drill, Lift"
                    fullWidth
                />

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
                    {initialData ? 'Update Equipment' : 'Add Equipment'}
                </Button>
            </div>
        </form>
    );
}
