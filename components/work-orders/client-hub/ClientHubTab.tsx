'use client';

import { useState, useEffect } from 'react';
import { workOrdersService } from '@/services';
import { LoadingSpinner } from '@/components/ui';
import { ContactHierarchy } from './ContactHierarchy';
import { ClientChat } from './ClientChat';
import { ClientFilesManager } from './ClientFilesManager';

interface ClientHubTabProps {
    workOrderId: string;
    clientId: string | null;
    pmId: string | null;
}

export function ClientHubTab({ workOrderId, clientId, pmId }: ClientHubTabProps) {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAccess();
    }, [workOrderId]);

    const checkAccess = async () => {
        try {
            const canAccess = await workOrdersService.canAccessClientHub(workOrderId);
            setHasAccess(canAccess);
        } catch (error) {
            console.error('Error checking Client Hub access:', error);
            setHasAccess(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Access restricted for technicians
    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m7-7a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
                <p className="text-gray-500 text-center max-w-sm">
                    The Client Hub is only accessible to work order owners, office staff, and authorized client contacts.
                </p>
            </div>
        );
    }

    // No client assigned
    if (!clientId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-amber-50 rounded-lg border border-amber-200">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Client Assigned</h3>
                <p className="text-gray-500 text-center max-w-sm">
                    Assign a client and project manager to this work order to enable the Client Hub.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Contact Hierarchy Section */}
            <ContactHierarchy
                workOrderId={workOrderId}
                clientId={clientId}
                primaryPmId={pmId}
            />

            {/* Shared Files Section */}
            <ClientFilesManager workOrderId={workOrderId} />

            {/* Client Chat Section */}
            <ClientChat workOrderId={workOrderId} />
        </div>
    );
}
