'use client';

import { Modal } from '@/components/ui';
import { WorkOrderFile } from '@/types/database';

interface WorkOrderFilesModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: WorkOrderFile[];
    loading?: boolean;
}

export function WorkOrderFilesModal({ isOpen, onClose, files, loading }: WorkOrderFilesModalProps) {
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Attached Files (${files.length})`}
            size="lg"
        >
            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading files...</div>
            ) : files.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No associated files found.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {files.map((file) => (
                        <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate" title={file.file_name || 'Unknown file'}>
                                        {file.file_name || 'Unknown file'}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatSize(file.file_size || 0)} • {new Date(file.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <a
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    View
                                </a>
                            </div>

                            {/* Preview for images */}
                            {file.mime_type?.startsWith('image/') && (
                                <div className="mt-3 aspect-video bg-gray-100 rounded overflow-hidden">
                                    <img
                                        src={file.file_url}
                                        alt={file.file_name || 'Preview'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
}
