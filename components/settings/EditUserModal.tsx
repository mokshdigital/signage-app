'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Input, Select, Alert } from '@/components/ui';
import { usersService, UnifiedUser, UpdateUserData } from '@/services/users.service';
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

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UnifiedUser | null;
    onSuccess: () => void;
}

export function EditUserModal({ isOpen, onClose, user, onSuccess }: EditUserModalProps) {
    // Form State
    const [displayName, setDisplayName] = useState('');
    const [nickName, setNickName] = useState('');
    const [phone, setPhone] = useState('');
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

    // Populate form when user changes
    useEffect(() => {
        if (user && isOpen) {
            setDisplayName(user.display_name || '');
            setNickName(user.nick_name || '');
            setPhone(user.phone || '');
            setRoleId(user.role?.id || '');
            setIsTechnician(!!user.technician);
            setIsOfficeStaff(!!user.title);
            setSkills(user.technician?.skills || []);
            setJobTitle(user.title || '');
            setError(null);
        }
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError(null);
        setLoading(true);

        try {
            const updateData: UpdateUserData = {
                display_name: displayName,
                nick_name: nickName || undefined,
                phone: phone || undefined,
                role_id: roleId || null,
                is_technician: isTechnician,
                is_office_staff: isOfficeStaff,
                skills: isTechnician ? skills : undefined,
                job_title: isOfficeStaff ? jobTitle : undefined,
            };

            await usersService.updateUser(user.id, updateData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
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

    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Edit User: ${user.display_name}`}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Email (read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input value={user.email || ''} disabled className="bg-gray-100" />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                        </label>
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="John Smith"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nick Name
                        </label>
                        <Input
                            value={nickName}
                            onChange={(e) => setNickName(e.target.value)}
                            placeholder="Johnny"
                        />
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                    </label>
                    <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 555-5555"
                        type="tel"
                    />
                </div>

                {/* Role */}
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
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
