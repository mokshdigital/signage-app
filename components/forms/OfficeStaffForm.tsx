'use client';

import { useState, useEffect } from 'react';
import { OfficeStaff } from '@/types/database';
import { Input, Button } from '@/components/ui';

export interface OfficeStaffFormData {
    name: string;
    email: string;
    phone: string;
    title: string;
}

interface OfficeStaffFormProps {
    initialData?: OfficeStaff;
    onSubmit: (data: OfficeStaffFormData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function OfficeStaffForm({
    initialData,
    onSubmit,
    isLoading = false,
    onCancel,
}: OfficeStaffFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setEmail(initialData.email || '');
            setPhone(initialData.phone || '');
            setTitle(initialData.title || '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            name,
            email,
            phone,
            title,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Full Name"
                fullWidth
            />

            <Input
                label="Title / Role"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Office Manager"
                fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    fullWidth
                />

                <Input
                    label="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
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
                    {initialData ? 'Update Staff Member' : 'Add Staff Member'}
                </Button>
            </div>
        </form>
    );
}
