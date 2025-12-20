'use client';

interface ComingSoonProps {
    title: string;
    description?: string;
}

export function ComingSoon({ title, description = 'Coming Soon' }: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <span className="text-5xl mb-4" aria-hidden="true">🚧</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
            <p className="text-xs text-gray-400 mt-2">This feature is under development</p>
        </div>
    );
}
