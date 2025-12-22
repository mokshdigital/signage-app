'use client';

import { useState, useEffect } from 'react';
import { usersService, UnifiedUser } from '@/services/users.service';
import { Card, Badge, Alert, LoadingSpinner, Avatar } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';

export function OfficeStaffTab() {
    const [staff, setStaff] = useState<UnifiedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            setLoading(true);
            const data = await usersService.getOfficeStaff();
            // Filter to active only
            setStaff(data.filter(s => s.is_active !== false));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load office staff'));
        } finally {
            setLoading(false);
        }
    };

    // Columns Definition (read-only)
    const columns: Column<UnifiedUser>[] = [
        {
            key: 'display_name',
            header: 'Name',
            sortable: true,
            render: (person) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={person.avatar_url}
                        alt={person.display_name}
                        size="sm"
                    />
                    <div>
                        <div className="font-medium text-gray-900">
                            {person.nick_name || person.display_name}
                        </div>
                        {person.nick_name && (
                            <div className="text-xs text-gray-500">{person.display_name}</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'title',
            header: 'Title',
            sortable: true,
            render: (person) => (
                person.office_staff?.title ? (
                    <Badge variant="info" size="sm">{person.office_staff.title}</Badge>
                ) : (
                    <span className="text-gray-400 text-sm">Staff</span>
                )
            )
        },
        {
            key: 'email',
            header: 'Contact',
            render: (person) => (
                <div>
                    <div className="text-sm text-gray-900">{person.email || '-'}</div>
                    <div className="text-xs text-gray-500">{person.phone || ''}</div>
                </div>
            )
        },
        {
            key: 'role',
            header: 'Role',
            render: (person) => (
                person.role ? (
                    <Badge variant="success" size="sm">{person.role.display_name}</Badge>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (person) => (
                person.onboarding_completed ? (
                    <Badge variant="success" size="sm">Active</Badge>
                ) : (
                    <Badge variant="warning" size="sm">Pending</Badge>
                )
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-900">Office Staff</h2>
                    <p className="text-sm text-gray-500">
                        View office personnel. To add or edit, go to{' '}
                        <a href="/dashboard/settings/users" className="text-blue-600 hover:underline">
                            Settings → Users
                        </a>
                    </p>
                </div>
            </div>

            {error && (
                <Alert variant="error" title="Error" dismissible>
                    {error.message}
                </Alert>
            )}

            <Card noPadding>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <DataTable
                        data={staff}
                        columns={columns}
                        keyExtractor={(s) => s.id}
                        loading={false}
                        emptyMessage="No office staff found"
                        emptyDescription="Office staff are managed in Settings → Users"
                    />
                )}
            </Card>
        </div>
    );
}
