'use client';

import { Modal, Button } from '@/components/ui';

interface WorkOrderAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: any; // The JSON blob from Gemini
}

export function WorkOrderAnalysisModal({ isOpen, onClose, analysis }: WorkOrderAnalysisModalProps) {

    // Safely render any value
    const safeRender = (value: any): string => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="AI Analysis Result"
            size="xl"
            footer={
                <Button onClick={onClose} fullWidth>Close</Button>
            }
        >
            {analysis ? (
                <div className="space-y-6">
                    {/* Render predefined sections common in work orders */}
                    {Object.entries(analysis).map(([key, value]) => (
                        <div key={key} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                {key.replace(/_/g, ' ')}
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                                {safeRender(value)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    No analysis data available.
                </div>
            )}
        </Modal>
    );
}
