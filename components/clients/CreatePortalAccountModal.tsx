'use client';

import { useState } from 'react';
import { Button, Modal, Input, Alert } from '@/components/ui';
import { createClientAccount, generateSecurePassword } from '@/app/actions/client-accounts';
import type { ProjectManager } from '@/types/database';

interface CreatePortalAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectManager: ProjectManager | null;
    onSuccess: () => void;
}

interface Credentials {
    email: string;
    password: string;
}

export function CreatePortalAccountModal({
    isOpen,
    onClose,
    projectManager,
    onSuccess,
}: CreatePortalAccountModalProps) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const [copied, setCopied] = useState<'email' | 'password' | 'both' | null>(null);

    // Reset state when modal opens
    const handleClose = () => {
        setPassword('');
        setError(null);
        setCredentials(null);
        setCopied(null);
        onClose();
    };

    const handleGeneratePassword = async () => {
        const generated = await generateSecurePassword();
        setPassword(generated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectManager) return;

        setError(null);
        setLoading(true);

        try {
            const result = await createClientAccount({
                displayName: projectManager.name,
                email: projectManager.email || '',
                password,
                projectManagerId: projectManager.id,
            });

            if (!result.success) {
                setError(result.error || 'Failed to create account');
                return;
            }

            // Show credentials summary
            setCredentials({
                email: result.credentials!.email,
                password: result.credentials!.password,
            });

            onSuccess();
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string, type: 'email' | 'password' | 'both') => {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const copyBoth = async () => {
        if (!credentials) return;
        const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
        await copyToClipboard(text, 'both');
    };

    // Credentials summary view (after successful creation)
    if (credentials) {
        return (
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="Portal Account Created"
                size="md"
            >
                <div className="space-y-6">
                    <Alert variant="success">
                        Portal account created successfully! Share these credentials with the client contact.
                    </Alert>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                                Email
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                                    {credentials.email}
                                </code>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => copyToClipboard(credentials.email, 'email')}
                                >
                                    {copied === 'email' ? '✓ Copied' : 'Copy'}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                                Password
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                                    {credentials.password}
                                </code>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => copyToClipboard(credentials.password, 'password')}
                                >
                                    {copied === 'password' ? '✓ Copied' : 'Copy'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        variant="secondary"
                        onClick={copyBoth}
                    >
                        {copied === 'both' ? '✓ Copied Both' : 'Copy Both to Clipboard'}
                    </Button>

                    <p className="text-sm text-gray-500 text-center">
                        The client can login at <code className="bg-gray-100 px-1 rounded">/client-login</code>
                    </p>

                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={handleClose}>Done</Button>
                    </div>
                </div>
            </Modal>
        );
    }

    // Creation form view
    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Create Portal Account"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <strong>Creating account for:</strong> {projectManager?.name}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                        Email: {projectManager?.email || 'No email set'}
                    </p>
                </div>

                {!projectManager?.email && (
                    <Alert variant="warning">
                        This contact has no email address. Please add an email first.
                    </Alert>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter or generate password"
                            required
                            minLength={6}
                            className="flex-1 font-mono"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGeneratePassword}
                        >
                            Generate
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Minimum 6 characters. Use "Generate" for a secure random password.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || !password || !projectManager?.email}
                    >
                        {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
