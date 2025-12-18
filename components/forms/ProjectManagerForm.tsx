'use client';

import { useState, useEffect } from 'react';
import { ProjectManager } from '@/types/database';
import { Input, Button } from '@/components/ui';

export interface ProjectManagerFormData {
    name: string;
    email: string;
    phone: string;
    client_id: string;
}

interface ProjectManagerFormProps {
    clientId: string;
    initialData?: ProjectManager;
    onSubmit: (data: ProjectManagerFormData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

/**
 * Form for adding/editing Client Contacts (Project Managers)
 * Note: In the UI these are called "Client Contacts" to distinguish
 * them from internal office_staff.
 */
export function ProjectManagerForm({
    clientId,
    initialData,
    onSubmit,
    isLoading = false,
    onCancel,
}: ProjectManagerFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setEmail(initialData.email || '');
            setPhone(initialData.phone || '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            name,
            email,
            phone,
            client_id: clientId,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Contact Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Full Name"
                fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@company.com"
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
                    {initialData ? 'Update Contact' : 'Add Contact'}
                </Button>
            </div>
        </form>
    );
}
