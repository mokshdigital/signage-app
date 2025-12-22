'use client';

import { useState, useEffect } from 'react';
import { usersService, UnifiedUser } from '@/services/users.service';
import { Card, Badge, Alert, LoadingSpinner, Avatar } from '@/components/ui';
import { DataTable, Column } from '@/components/tables';

export function TechniciansTab() {
    const [technicians, setTechnicians] = useState<UnifiedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        loadTechnicians();
    }, []);

    const loadTechnicians = async () => {
        try {
            setLoading(true);
            const data = await usersService.getTechnicians();
            // Filter to active only
            setTechnicians(data.filter(t => t.is_active !== false));
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load technicians'));
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
            render: (tech) => (
                <div className="flex items-center gap-3">
                    <Avatar
                        src={tech.avatar_url}
                        alt={tech.display_name}
                        size="sm"
                    />
                    <div>
                        <div className="font-medium text-gray-900">
                            {tech.nick_name || tech.display_name}
                        </div>
                        {tech.nick_name && (
                            <div className="text-xs text-gray-500">{tech.display_name}</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'email',
            header: 'Contact',
            render: (tech) => (
                <div>
                    <div className="text-sm text-gray-900">{tech.email || '-'}</div>
                    <div className="text-xs text-gray-500">{tech.phone || ''}</div>
                </div>
            )
        },
        {
            key: 'skills',
            header: 'Skills',
            render: (tech) => (
                <div className="flex flex-wrap gap-1">
                    {tech.technician?.skills && tech.technician.skills.length > 0 ? (
                        tech.technician.skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="info" size="sm">
                                {skill}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-gray-400 text-sm">-</span>
                    )}
                    {tech.technician?.skills && tech.technician.skills.length > 3 && (
                        <Badge variant="default" size="sm">
                            +{tech.technician.skills.length - 3}
                        </Badge>
                    )}
                </div>
            )
        },
        {
            key: 'role',
            header: 'Role',
            render: (tech) => (
                tech.role ? (
                    <Badge variant="success" size="sm">{tech.role.display_name}</Badge>
                ) : (
                    <span className="text-gray-400 text-sm">-</span>
                )
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (tech) => (
                tech.onboarding_completed ? (
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
                    <h2 className="text-xl font-semibold text-gray-900">Technicians Directory</h2>
                    <p className="text-sm text-gray-500">
                        View field technicians. To add or edit, go to{' '}
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
                        data={technicians}
                        columns={columns}
                        keyExtractor={(t) => t.id}
                        loading={false}
                        emptyMessage="No technicians found"
                        emptyDescription="Technicians are managed in Settings → Users"
                    />
                )}
            </Card>
        </div>
    );
}
