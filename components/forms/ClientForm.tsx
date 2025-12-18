'use client';

import { useState, useEffect } from 'react';
import { Client } from '@/types/database';
import { Input, Button } from '@/components/ui';

export interface ClientFormData {
    name: string;
    address: string;
    notes: string;
}

interface ClientFormProps {
    initialData?: Client;
    onSubmit: (data: ClientFormData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function ClientForm({
    initialData,
    onSubmit,
    isLoading = false,
    onCancel,
}: ClientFormProps) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setAddress(initialData.address || '');
            setNotes(initialData.notes || '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            name,
            address,
            notes,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Company Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Acme Corporation"
                fullWidth
            />

            <Input
                label="Registered Office Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Main St, Suite 100, NYC, NY 10001"
                fullWidth
            />

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes about this client..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
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
                    {initialData ? 'Update Client' : 'Add Client'}
                </Button>
            </div>
        </form>
    );
}
