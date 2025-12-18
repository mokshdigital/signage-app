'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsIndex() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard/settings/roles');
    }, [router]);

    return null;
}
