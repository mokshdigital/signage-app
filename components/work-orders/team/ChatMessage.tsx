'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui';
import { MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';

interface ChatMessageProps {
    id: string;
    message: string;
    createdAt: string;
    editedAt: string | null;
    user: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
    fileReferences: string[];
    filesMap: Record<string, { filename: string; url: string; mime_type: string }>;
    isOwnMessage: boolean;
    onEdit: (messageId: string, newMessage: string) => Promise<void>;
    onDelete: (messageId: string) => Promise<void>;
}

export function ChatMessage({
    id,
    message,
    createdAt,
    editedAt,
    user,
    fileReferences,
    filesMap,
    isOwnMessage,
    onEdit,
    onDelete,
}: ChatMessageProps) {
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message);
    const [saving, setSaving] = useState(false);

    const formatTimestamp = (dateStr: string) => {
        const date = new Date(dateStr);

        // Relative for recent, absolute for older
        if (isToday(date)) {
            return formatDistanceToNow(date, { addSuffix: true });
        } else if (isYesterday(date)) {
            return `Yesterday at ${format(date, 'h:mm a')}`;
        } else if (isThisWeek(date)) {
            return format(date, 'EEEE \'at\' h:mm a');
        } else {
            return format(date, 'MMM d, yyyy \'at\' h:mm a');
        }
    };

    const handleEdit = async () => {
        if (editText.trim() === message) {
            setIsEditing(false);
            return;
        }
        if (editText.trim().length === 0 || editText.length > 2000) return;

        setSaving(true);
        try {
            await onEdit(id, editText.trim());
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this message?')) return;
        await onDelete(id);
    };

    const handleCancelEdit = () => {
        setEditText(message);
        setIsEditing(false);
    };

    // Check if file is an image
    const isImage = (mimeType: string) => mimeType.startsWith('image/');

    return (
        <div
            className="group flex gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors"
            onMouseLeave={() => setShowMenu(false)}
        >
            <Avatar src={user.avatar_url} alt={user.display_name} size="sm" />

            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-baseline gap-2">
                    <span className="font-medium text-sm text-gray-900">{user.display_name}</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(createdAt)}</span>
                    {editedAt && (
                        <span className="text-xs text-gray-400 italic">· edited</span>
                    )}
                </div>

                {/* Message Content */}
                {isEditing ? (
                    <div className="mt-1">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                            maxLength={2000}
                            autoFocus
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <button
                                onClick={handleEdit}
                                disabled={saving || editText.trim().length === 0}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                            >
                                <Check className="w-3 h-3" />
                                Save
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                disabled={saving}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                            >
                                <X className="w-3 h-3" />
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words mt-0.5">{message}</p>
                )}

                {/* File References */}
                {fileReferences.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {fileReferences.map(fileId => {
                            const file = filesMap[fileId];
                            if (!file) return null;

                            return isImage(file.mime_type) ? (
                                // Image thumbnail
                                <a
                                    key={fileId}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block max-w-[200px] rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                                >
                                    <img
                                        src={file.url}
                                        alt={file.filename}
                                        className="max-h-32 object-cover"
                                    />
                                    <div className="px-2 py-1 bg-gray-50 text-xs text-gray-600 truncate">
                                        {file.filename}
                                    </div>
                                </a>
                            ) : (
                                // Chip for other files
                                <a
                                    key={fileId}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                >
                                    📎 {file.filename}
                                </a>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Actions Menu (hover) */}
            {isOwnMessage && !isEditing && (
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-6 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[100px]">
                            <button
                                onClick={() => {
                                    setIsEditing(true);
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Pencil className="w-3 h-3" />
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete();
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ChatMessage;
