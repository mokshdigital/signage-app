'use client';

import { useState, useEffect, useCallback } from 'react';
import { workOrdersService } from '@/services';
import { WorkOrderFile } from '@/types/database';
import { LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/providers';

interface ClientFilesManagerProps {
    workOrderId: string;
}

export function ClientFilesManager({ workOrderId }: ClientFilesManagerProps) {
    const [clientVisible, setClientVisible] = useState<WorkOrderFile[]>([]);
    const [notClientVisible, setNotClientVisible] = useState<WorkOrderFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddMore, setShowAddMore] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const loadFiles = useCallback(async () => {
        try {
            const data = await workOrdersService.getFilesWithVisibility(workOrderId);
            setClientVisible(data.clientVisible);
            setNotClientVisible(data.notClientVisible);
        } catch (err) {
            console.error('Failed to load files:', err);
        } finally {
            setLoading(false);
        }
    }, [workOrderId]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const handleToggleVisibility = async (fileId: string, makeVisible: boolean) => {
        setTogglingId(fileId);
        try {
            await workOrdersService.toggleFileClientVisibility(fileId, makeVisible);
            await loadFiles();
            toast.success(makeVisible ? 'File shared with client' : 'File hidden from client');
        } catch (err: any) {
            toast.error('Failed to update file visibility', { description: err.message });
        } finally {
            setTogglingId(null);
        }
    };

    const getFileThumbnail = (file: WorkOrderFile) => {
        const mimeType = file.mime_type || '';

        if (mimeType.startsWith('image/')) {
            return (
                <img
                    src={file.file_url}
                    alt={file.file_name || 'Image'}
                    className="w-full h-full object-cover"
                />
            );
        }

        if (mimeType.includes('pdf')) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-red-50">
                    <span className="text-2xl">📄</span>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <span className="text-2xl">📎</span>
            </div>
        );
    };

    const FileCard = ({
        file,
        isShared,
        onToggle
    }: {
        file: WorkOrderFile;
        isShared: boolean;
        onToggle: () => void;
    }) => (
        <div className="relative group">
            {/* Thumbnail */}
            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-purple-400 transition-colors">
                {getFileThumbnail(file)}
            </div>

            {/* File Name */}
            <p className="mt-1 text-xs text-gray-600 truncate w-24" title={file.file_name || 'Unnamed'}>
                {file.file_name || 'Unnamed'}
            </p>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                disabled={togglingId === file.id}
                className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${isShared
                        ? 'bg-green-500 hover:bg-red-500 text-white'
                        : 'bg-gray-300 hover:bg-green-500 text-gray-600 hover:text-white'
                    } ${togglingId === file.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isShared ? 'Click to hide from client' : 'Click to share with client'}
            >
                {togglingId === file.id ? (
                    <span className="animate-spin text-xs">⏳</span>
                ) : isShared ? (
                    <span className="text-sm">✓</span>
                ) : (
                    <span className="text-sm">+</span>
                )}
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
            </div>
        );
    }

    const totalFiles = clientVisible.length + notClientVisible.length;

    if (totalFiles === 0) {
        return (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl">📁</span>
                </div>
                <p className="text-gray-500">No files uploaded to this work order yet.</p>
                <p className="text-gray-400 text-sm mt-1">Upload files in the Files tab to share with clients.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-purple-500">📄</span>
                Files Shared with Client
                {clientVisible.length > 0 && (
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                        {clientVisible.length}
                    </span>
                )}
            </h3>

            {/* Client Visible Files */}
            {clientVisible.length === 0 ? (
                <p className="text-gray-400 text-sm italic mb-4">No files shared with client yet.</p>
            ) : (
                <div className="flex flex-wrap gap-4 mb-4">
                    {clientVisible.map(file => (
                        <FileCard
                            key={file.id}
                            file={file}
                            isShared={true}
                            onToggle={() => handleToggleVisibility(file.id, false)}
                        />
                    ))}
                </div>
            )}

            {/* Add More Files Section */}
            {notClientVisible.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                    <button
                        onClick={() => setShowAddMore(!showAddMore)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors"
                    >
                        <span className={`transform transition-transform ${showAddMore ? 'rotate-90' : ''}`}>
                            ▶
                        </span>
                        Share More Files ({notClientVisible.length} available)
                    </button>

                    {showAddMore && (
                        <div className="mt-4 flex flex-wrap gap-4">
                            {notClientVisible.map(file => (
                                <FileCard
                                    key={file.id}
                                    file={file}
                                    isShared={false}
                                    onToggle={() => handleToggleVisibility(file.id, true)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
                <span className="inline-flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</span>
                    = Client can see
                </span>
                <span className="mx-3">|</span>
                <span className="inline-flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center">+</span>
                    = Click to share
                </span>
            </p>
        </div>
    );
}
