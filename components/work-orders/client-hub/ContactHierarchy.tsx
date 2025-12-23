'use client';

import { useState, useEffect } from 'react';
import { workOrdersService } from '@/services';
import { usePermissions } from '@/hooks/usePermissions';
import { Button, LoadingSpinner } from '@/components/ui';
import { showToast } from '@/components/providers/ToastProvider';

interface ContactHierarchyProps {
    workOrderId: string;
    clientId: string;
    primaryPmId: string | null;
}

interface Contact {
    id: string;
    pm_id?: string;
    name: string;
    email: string | null;
    phone: string | null;
    user_profile_id: string | null;
    client_name: string;
}

export function ContactHierarchy({ workOrderId, clientId, primaryPmId }: ContactHierarchyProps) {
    const [primaryPM, setPrimaryPM] = useState<Contact | null>(null);
    const [additionalContacts, setAdditionalContacts] = useState<Contact[]>([]);
    const [availableContacts, setAvailableContacts] = useState<{ id: string; name: string; email: string | null }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [adding, setAdding] = useState(false);
    const [selectedPmId, setSelectedPmId] = useState<string>('');
    const { hasPermission } = usePermissions();

    const canManageContacts = hasPermission('client_hub:manage_contacts');

    useEffect(() => {
        loadContacts();
    }, [workOrderId]);

    const loadContacts = async () => {
        try {
            const { primaryPM, additionalContacts } = await workOrdersService.getClientHubContacts(workOrderId);
            setPrimaryPM(primaryPM);
            setAdditionalContacts(additionalContacts);

            if (canManageContacts) {
                const available = await workOrdersService.getAvailableClientContacts(workOrderId);
                setAvailableContacts(available);
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async () => {
        if (!selectedPmId) return;

        setAdding(true);
        try {
            await workOrdersService.addClientContact(workOrderId, selectedPmId);
            showToast.success('Contact added successfully');
            setShowAddModal(false);
            setSelectedPmId('');
            loadContacts();
        } catch (error: any) {
            showToast.error(error.message || 'Failed to add contact');
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveContact = async (accessId: string) => {
        if (!confirm('Remove this contact from the Client Hub?')) return;

        try {
            await workOrdersService.removeClientContact(accessId);
            showToast.success('Contact removed');
            loadContacts();
        } catch (error: any) {
            showToast.error(error.message || 'Failed to remove contact');
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-center h-24">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Client Contacts</h3>
                </div>
                {canManageContacts && availableContacts.length > 0 && (
                    <Button size="sm" variant="secondary" onClick={() => setShowAddModal(true)}>
                        + Add Contact
                    </Button>
                )}
            </div>

            <div className="p-4 space-y-4">
                {/* Primary PM */}
                {primaryPM ? (
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-semibold">
                                {primaryPM.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{primaryPM.name}</span>
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-200 text-purple-700">
                                        Primary
                                    </span>
                                    {!primaryPM.user_profile_id && (
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                            No Portal Access
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {primaryPM.email && <span>{primaryPM.email}</span>}
                                    {primaryPM.email && primaryPM.phone && <span className="mx-1">•</span>}
                                    {primaryPM.phone && <span>{primaryPM.phone}</span>}
                                </div>
                                <div className="text-xs text-purple-600">{primaryPM.client_name}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500 text-sm">
                        No primary project manager assigned
                    </div>
                )}

                {/* Additional Contacts */}
                {additionalContacts.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Additional Contacts</h4>
                        {additionalContacts.map((contact) => (
                            <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{contact.name}</span>
                                            {!contact.user_profile_id && (
                                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                                    No Portal Access
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {contact.email && <span>{contact.email}</span>}
                                            {contact.email && contact.phone && <span className="mx-1">•</span>}
                                            {contact.phone && <span>{contact.phone}</span>}
                                        </div>
                                    </div>
                                </div>
                                {canManageContacts && (
                                    <button
                                        onClick={() => handleRemoveContact(contact.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                        title="Remove contact"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!primaryPM && additionalContacts.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                        No client contacts configured for this work order.
                    </div>
                )}
            </div>

            {/* Add Contact Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="px-4 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Add Client Contact</h3>
                        </div>
                        <div className="p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Project Manager
                            </label>
                            <select
                                value={selectedPmId}
                                onChange={(e) => setSelectedPmId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Choose a contact...</option>
                                {availableContacts.map((pm) => (
                                    <option key={pm.id} value={pm.id}>
                                        {pm.name} {pm.email ? `(${pm.email})` : ''}
                                    </option>
                                ))}
                            </select>
                            {availableContacts.length === 0 && (
                                <p className="text-sm text-gray-500 mt-2">
                                    No additional contacts available from this client.
                                </p>
                            )}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddContact}
                                disabled={!selectedPmId || adding}
                            >
                                {adding ? 'Adding...' : 'Add Contact'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
