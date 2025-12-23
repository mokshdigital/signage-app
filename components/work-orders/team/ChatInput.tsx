'use client';

import { useState, useRef } from 'react';
import { Button, Modal, LoadingSpinner } from '@/components/ui';
import { Paperclip, Send } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string, fileReferences: string[]) => Promise<void>;
    disabled?: boolean;
    workOrderFiles: { id: string; filename: string; category: string }[];
}

export function ChatInput({ onSend, disabled, workOrderFiles }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [sending, setSending] = useState(false);
    const [showFilePicker, setShowFilePicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = async () => {
        const trimmed = message.trim();
        if (!trimmed && selectedFiles.length === 0) return;
        if (trimmed.length > 2000) return;

        setSending(true);
        try {
            await onSend(trimmed, selectedFiles);
            setMessage('');
            setSelectedFiles([]);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleFile = (fileId: string) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    // Group files by category
    const filesByCategory = workOrderFiles.reduce((acc, file) => {
        if (!acc[file.category]) acc[file.category] = [];
        acc[file.category].push(file);
        return acc;
    }, {} as Record<string, typeof workOrderFiles>);

    const selectedFileNames = workOrderFiles
        .filter(f => selectedFiles.includes(f.id))
        .map(f => f.filename);

    return (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {selectedFileNames.map((name, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            📎 {name}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                {/* Attach Button */}
                <button
                    type="button"
                    onClick={() => setShowFilePicker(true)}
                    disabled={disabled || sending}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Attach file from Work Order"
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                {/* Message Input */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || sending}
                        placeholder="Type a message... (Shift+Enter for new line)"
                        rows={1}
                        maxLength={2000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        style={{ minHeight: '40px', maxHeight: '120px' }}
                    />
                    {message.length > 1800 && (
                        <span className={`absolute bottom-1 right-2 text-xs ${message.length > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
                            {message.length}/2000
                        </span>
                    )}
                </div>

                {/* Send Button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || sending || (!message.trim() && selectedFiles.length === 0) || message.length > 2000}
                    size="sm"
                >
                    {sending ? <LoadingSpinner /> : <Send className="w-4 h-4" />}
                </Button>
            </div>

            {/* File Picker Modal */}
            <Modal
                isOpen={showFilePicker}
                onClose={() => setShowFilePicker(false)}
                title="Attach Work Order Files"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Select files to reference in your message:
                    </p>

                    {Object.keys(filesByCategory).length === 0 ? (
                        <p className="text-sm text-gray-500 italic py-4 text-center">
                            No files available for this work order.
                        </p>
                    ) : (
                        <div className="space-y-4 max-h-[400px] overflow-y-auto">
                            {Object.entries(filesByCategory).map(([category, files]) => (
                                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                                        <h4 className="text-sm font-medium text-gray-700">{category}</h4>
                                    </div>
                                    <div className="p-2 space-y-1">
                                        {files.map(file => (
                                            <label
                                                key={file.id}
                                                className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFiles.includes(file.id)}
                                                    onChange={() => toggleFile(file.id)}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 truncate">{file.filename}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                        <Button variant="secondary" onClick={() => setShowFilePicker(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => setShowFilePicker(false)}>
                            Done ({selectedFiles.length} selected)
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default ChatInput;
