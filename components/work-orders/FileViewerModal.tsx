'use client';

import { useState } from 'react';
import { WorkOrderFile } from '@/types/database';
import { Button } from '@/components/ui';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react';

interface FileViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    files: WorkOrderFile[];
    initialFileIndex?: number;
}

export function FileViewerModal({ isOpen, onClose, files, initialFileIndex = 0 }: FileViewerModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialFileIndex);

    if (!isOpen || files.length === 0) return null;

    const currentFile = files[currentIndex];
    const fileName = currentFile.file_name || 'File';
    const fileUrl = currentFile.file_url;
    const mimeType = currentFile.mime_type || '';
    const isImage = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
    const isPdf = mimeType === 'application/pdf' || /\.pdf$/i.test(fileName);

    const goNext = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') goNext();
        if (e.key === 'ArrowLeft') goPrev();
    };

    // Add keyboard listener
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', handleKeyDown as any);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col bg-white rounded-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 truncate max-w-md">
                            {fileName}
                        </span>
                        {files.length > 1 && (
                            <span className="text-sm text-gray-500">
                                ({currentIndex + 1} of {files.length})
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(fileUrl, '_blank')}
                            title="Open in new tab"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                        <a href={fileUrl} download={fileName}>
                            <Button variant="ghost" size="sm" title="Download">
                                <Download className="w-4 h-4" />
                            </Button>
                        </a>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* File Viewer */}
                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center">
                    {isImage && (
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-full max-h-full object-contain"
                        />
                    )}
                    {isPdf && (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full"
                            title={fileName}
                        />
                    )}
                    {!isImage && !isPdf && (
                        <div className="text-center text-gray-500 p-8">
                            <p className="mb-4">Preview not available for this file type.</p>
                            <a href={fileUrl} download={fileName}>
                                <Button>Download File</Button>
                            </a>
                        </div>
                    )}
                </div>

                {/* Navigation Arrows (only if multiple files) */}
                {files.length > 1 && (
                    <>
                        <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white disabled:opacity-30"
                            onClick={goPrev}
                            disabled={currentIndex === 0}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white disabled:opacity-30"
                            onClick={goNext}
                            disabled={currentIndex === files.length - 1}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
