'use client';

import { PeopleTable } from '@/components/people/PeopleTable';

export default function PeoplePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">People</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your organization's workforce
                </p>
            </div>

            <PeopleTable />
        </div>
    );
}
