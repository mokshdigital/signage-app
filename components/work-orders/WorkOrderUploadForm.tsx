'use client';

import { useState, useRef } from 'react';
import { Button, Card, Alert, UploadIcon, Textarea } from '@/components/ui';

interface WorkOrderUploadFormProps {
    onSubmit: (mainFile: File, associatedFiles: File[], shipmentStatus?: string) => Promise<void>;
    isLoading?: boolean;
}

const MAX_ASSOCIATED_FILES = 9;

export function WorkOrderUploadForm({ onSubmit, isLoading = false }: WorkOrderUploadFormProps) {
    const [mainFile, setMainFile] = useState<File | null>(null);
    const [associatedFiles, setAssociatedFiles] = useState<File[]>([]);
    const [shipmentStatus, setShipmentStatus] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Refs for resetting inputs
    const mainInputRef = useRef<HTMLInputElement>(null);
    const associatedInputRef = useRef<HTMLInputElement>(null);

    const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMainFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleAssociatedFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const totalFiles = associatedFiles.length + filesArray.length;

            if (totalFiles > MAX_ASSOCIATED_FILES) {
                setError(`Maximum ${MAX_ASSOCIATED_FILES} associated files allowed. You selected ${totalFiles} files.`);
                return;
            }

            setAssociatedFiles(prev => [...prev, ...filesArray]);
            setError(null);

            // Reset input so same files can be selected again if needed (though unlikely)
            if (associatedInputRef.current) {
                associatedInputRef.current.value = '';
            }
        }
    };

    const removeAssociatedFile = (index: number) => {
        setAssociatedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!mainFile) {
            setError('Please select a main work order file.');
            return;
        }

        try {
            await onSubmit(mainFile, associatedFiles, shipmentStatus || undefined);
            // Reset form on success
            setMainFile(null);
            setAssociatedFiles([]);
            setShipmentStatus('');
            if (mainInputRef.current) mainInputRef.current.value = '';
            if (associatedInputRef.current) associatedInputRef.current.value = '';
        } catch (err) {
            // Error is handled by parent or service, but we keep form state
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Card title="Upload Work Order" className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <Alert variant="error" dismissible onDismiss={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Main File */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Order File (Mandatory) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            ref={mainInputRef}
                            type="file"
                            onChange={handleMainFileChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            required
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Upload the main PDF or image for the work order.
                    </p>
                </div>

                {/* Associated Files */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Associated Files (Optional)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            ref={associatedInputRef}
                            type="file"
                            multiple
                            onChange={handleAssociatedFilesChange}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-gray-50 file:text-gray-700
                                hover:file:bg-gray-100"
                            disabled={associatedFiles.length >= MAX_ASSOCIATED_FILES}
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Photos, diagrams, or other related documents (Max 10 total).
                    </p>

                    {/* File List */}
                    {associatedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {associatedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-gray-400">📄</span>
                                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                        <span className="text-xs text-gray-400">({formatSize(file.size)})</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAssociatedFile(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Initial Shipment Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initial Shipment Status (Optional)
                    </label>
                    <Textarea
                        value={shipmentStatus}
                        onChange={(e) => setShipmentStatus(e.target.value)}
                        placeholder="Enter any initial notes about materials, shipment tracking, or delivery status..."
                        rows={3}
                        className="w-full"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        This will be displayed in the Shipment section of the work order.
                    </p>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button
                        type="submit"
                        loading={isLoading}
                        leftIcon={<UploadIcon />}
                    >
                        Upload & Process
                    </Button>
                </div>
            </form>
        </Card>
    );
}
