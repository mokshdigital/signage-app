'use client';

import { Tabs } from '@/components/ui';
import { TechniciansTab } from '@/components/people/TechniciansTab';
import { OfficeStaffTab } from '@/components/people/OfficeStaffTab';

export default function PeoplePage() {
    const tabs = [
        {
            id: 'technicians',
            label: 'Technicians',
            content: <TechniciansTab />
        },
        {
            id: 'office-staff',
            label: 'Office Staff',
            content: <OfficeStaffTab />
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">People</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your organization's workforce
                </p>
            </div>

            <Tabs tabs={tabs} defaultTab="technicians" />
        </div>
    );
}
