'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Input, Select, Alert } from '@/components/ui';
import { usersService, CreateUserData, UpdateUserData, UnifiedUser } from '@/services/users.service';
import { getRoles } from '@/services/rbac.service';
import type { Role } from '@/types/rbac';

// Common skills for technicians
const SKILL_OPTIONS = [
    'Electrical',
    'LED Signs',
    'Channel Letters',
    'Neon',
    'Crane/Bucket',
    'Fabrication',
    'Installation',
    'Service',
    'Survey',
];

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: UnifiedUser | null;
    onSuccess: () => void;
}

export function UserFormModal({ isOpen, onClose, user, onSuccess }: UserFormModalProps) {
    // Form State
    const [displayName, setDisplayName] = useState('');
    const [nickName, setNickName] = useState('');
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState<string>('');
    const [isTechnician, setIsTechnician] = useState(false);
    const [isOfficeStaff, setIsOfficeStaff] = useState(false);
    const [skills, setSkills] = useState<string[]>([]);
    const [jobTitle, setJobTitle] = useState('');

    // UI State
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch roles on mount
    useEffect(() => {
        getRoles().then(setRoles).catch(console.error);
    }, []);

    // Populate form when editing
    useEffect(() => {
        if (user) {
            setDisplayName(user.display_name || '');
            setNickName(user.nick_name || '');
            setEmail(user.email || '');
            setRoleId(user.role?.id || '');
            setIsTechnician(!!user.technician);
            setIsOfficeStaff(!!user.office_staff);
            setSkills(user.technician?.skills || []);
            setJobTitle(user.office_staff?.title || '');
        } else {
            // Reset form for new user
            setDisplayName('');
            setNickName('');
            setEmail('');
            setRoleId('');
            setIsTechnician(false);
            setIsOfficeStaff(false);
            setSkills([]);
            setJobTitle('');
        }
        setError(null);
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!displayName.trim()) {
            setError('Full name is required');
            return;
        }
        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        // Check email uniqueness
        const emailTaken = await usersService.isEmailTaken(email, user?.id);
        if (emailTaken) {
            setError('This email is already in use');
            return;
        }

        setLoading(true);

        try {
            if (user) {
                // Update existing user
                const updateData: UpdateUserData = {
                    display_name: displayName,
                    nick_name: nickName || undefined,
                    email,
                    role_id: roleId || null,
                    is_technician: isTechnician,
                    is_office_staff: isOfficeStaff,
                    skills: isTechnician ? skills : undefined,
                    job_title: isOfficeStaff ? jobTitle : undefined,
                };
                await usersService.update(user.id, updateData);
            } else {
                // Create new user
                const createData: CreateUserData = {
                    display_name: displayName,
                    nick_name: nickName || undefined,
                    email,
                    role_id: roleId || null,
                    is_technician: isTechnician,
                    is_office_staff: isOfficeStaff,
                    skills: isTechnician ? skills : undefined,
                    job_title: isOfficeStaff ? jobTitle : undefined,
                };
                await usersService.create(createData);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={user ? 'Edit User' : 'Add New User'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="John Smith"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nick Name <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <Input
                            value={nickName}
                            onChange={(e) => setNickName(e.target.value)}
                            placeholder="Johnny"
                        />
                        <p className="text-xs text-gray-500 mt-1">Displayed in compact views</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@company.com"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">Used for Google Sign-in</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            RBAC Role
                        </label>
                        <Select
                            value={roleId}
                            onChange={(e) => setRoleId(e.target.value)}
                            options={[
                                { value: '', label: 'No Role' },
                                ...roles.map(r => ({
                                    value: r.id,
                                    label: r.display_name + (r.is_system ? ' (System)' : '')
                                }))
                            ]}
                        />
                    </div>
                </div>

                {/* Functional Types */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        User Types
                    </label>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isTechnician}
                                onChange={(e) => setIsTechnician(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Technician</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isOfficeStaff}
                                onChange={(e) => setIsOfficeStaff(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Office Staff</span>
                        </label>
                    </div>
                </div>

                {/* Technician Fields */}
                {isTechnician && (
                    <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                        <label className="block text-sm font-medium text-blue-900">
                            Technician Skills
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SKILL_OPTIONS.map(skill => (
                                <button
                                    key={skill}
                                    type="button"
                                    onClick={() => toggleSkill(skill)}
                                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${skills.includes(skill)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                        }`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Office Staff Fields */}
                {isOfficeStaff && (
                    <div className="p-4 bg-purple-50 rounded-lg space-y-3">
                        <label className="block text-sm font-medium text-purple-900">
                            Job Title
                        </label>
                        <Input
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., Project Manager, Accountant"
                            className="bg-white"
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (user ? 'Save Changes' : 'Add User')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
