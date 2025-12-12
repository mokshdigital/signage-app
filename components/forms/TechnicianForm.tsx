'use client';

import { useState, useEffect } from 'react';
import { Technician } from '@/types/database';
import { Input, Button, Textarea } from '@/components/ui';

export interface TechnicianFormData {
    name: string;
    email: string;
    phone: string;
    skills: string[];
}

interface TechnicianFormProps {
    initialData?: Technician;
    onSubmit: (data: TechnicianFormData) => Promise<void>;
    isLoading?: boolean;
    onCancel?: () => void;
}

export function TechnicianForm({
    initialData,
    onSubmit,
    isLoading = false,
    onCancel,
}: TechnicianFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [skillsInput, setSkillsInput] = useState('');

    // Initialize form with data if editing
    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setEmail(initialData.email || '');
            setPhone(initialData.phone || '');
            setSkillsInput(initialData.skills ? initialData.skills.join(', ') : '');
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Parse skills from comma-separated string
        const skills = skillsInput
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        await onSubmit({
            name,
            email,
            phone,
            skills,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter technician name"
                fullWidth
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    fullWidth
                />

                <Input
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    fullWidth
                />
            </div>

            <div>
                <Input
                    label="Skills"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="Electrical, Signage, Ladder work (comma separated)"
                    helperText="Separate multiple skills with commas"
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
                    {initialData ? 'Update Technician' : 'Add Technician'}
                </Button>
            </div>
        </form>
    );
}
