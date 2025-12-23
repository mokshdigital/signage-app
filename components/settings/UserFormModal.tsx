'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Input, Select, Alert } from '@/components/ui';
import { usersService, CreateInvitationData } from '@/services/users.service';
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

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
    // Form State
    const [displayName, setDisplayName] = useState('');
    const [nickName, setNickName] = useState('');
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState<string>('');
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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setDisplayName('');
            setNickName('');
            setEmail('');
            setRoleId('');
            setSkills([]);
            setJobTitle('');
            setError(null);
        }
    }, [isOpen]);

    // Check if selected role is 'technician'
    const selectedRole = roles.find(r => r.id === roleId);
    const isTechnicianRole = selectedRole?.name === 'technician';

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
        if (!roleId) {
            setError('Please select a role');
            return;
        }

        // Check if email is already taken
        const emailTaken = await usersService.isEmailTaken(email);
        if (emailTaken) {
            setError('This email is already invited or registered');
            return;
        }

        setLoading(true);

        try {
            const invitationData: CreateInvitationData = {
                display_name: displayName,
                nick_name: nickName || undefined,
                email,
                role_id: roleId,
                is_technician: isTechnicianRole,
                skills: isTechnicianRole ? skills : undefined,
                job_title: jobTitle || undefined,
            };

            await usersService.createInvitation(invitationData);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create invitation');
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

    // Group roles by user_type for better UX
    const internalRoles = roles.filter(r => r.user_type === 'internal');
    const externalRoles = roles.filter(r => r.user_type === 'external');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Invite New User"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This creates an invitation. The user will need to sign in with Google using this email to claim their account.
                    </p>
                </div>

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
                        <p className="text-xs text-gray-500 mt-1">Must match their Google account</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title <span className="text-gray-400 text-xs">(optional)</span>
                        </label>
                        <Input
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Project Manager"
                        />
                    </div>
                </div>

                {/* Role Selection - Grouped by user_type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role <span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={roleId}
                        onChange={(e) => setRoleId(e.target.value)}
                        options={[
                            { value: '', label: '-- Select a Role --', disabled: true },
                            ...(internalRoles.length > 0 ? [{ value: '', label: '── Internal Users ──', disabled: true }] : []),
                            ...internalRoles.map(r => ({
                                value: r.id,
                                label: r.display_name + (r.is_system ? ' (System)' : '')
                            })),
                            ...(externalRoles.length > 0 ? [{ value: '', label: '── External Users ──', disabled: true }] : []),
                            ...externalRoles.map(r => ({
                                value: r.id,
                                label: r.display_name + (r.is_system ? ' (System)' : '')
                            })),
                        ]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        The role determines the user&apos;s access level and whether they are internal or external.
                    </p>
                </div>

                {/* Technician Skills - Only shown when Technician role is selected */}
                {isTechnicianRole && (
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
                        {loading ? 'Inviting...' : 'Send Invitation'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// Re-export old name for backwards compatibility
export const UserFormModal = InviteUserModal;
