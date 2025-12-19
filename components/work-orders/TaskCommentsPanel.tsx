'use client';

import { useState, useEffect, useRef } from 'react';
import { TaskComment, MentionableUser, WorkOrderTask } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { createClient } from '@/lib/supabase/client';
import { Button, Textarea, LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';
import { X, Pencil, Trash2, Check, Paperclip, Send, MessageSquare, Image, FileText } from 'lucide-react';
import { FileViewerModal } from './FileViewerModal';

interface TaskCommentsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    task: WorkOrderTask;
    workOrderId: string;
}

export function TaskCommentsPanel({ isOpen, onClose, task, workOrderId }: TaskCommentsPanelProps) {
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [mentionableUsers, setMentionableUsers] = useState<MentionableUser[]>([]);

    // New comment state
    const [newContent, setNewContent] = useState('');
    const [newAttachments, setNewAttachments] = useState<string[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Mention state
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
    const [selectedMentions, setSelectedMentions] = useState<{ id: string; name: string; type: 'user' | 'technician' }[]>([]);

    // Edit state
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editAttachments, setEditAttachments] = useState<string[]>([]);

    // File viewer state
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerFiles, setViewerFiles] = useState<{ file_url: string; file_name: string; id?: string }[]>([]);
    const [viewerIndex, setViewerIndex] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchUser();
            fetchComments();
            fetchMentionableUsers();
        }
    }, [isOpen, task.id]);

    const fetchUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
    };

    const fetchComments = async () => {
        try {
            setLoading(true);
            const data = await workOrdersService.getTaskComments(task.id);
            setComments(data);
        } catch (err) {
            console.error('Error fetching comments:', err);
            toast.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const fetchMentionableUsers = async () => {
        try {
            const users = await workOrdersService.getMentionableUsers(workOrderId);
            setMentionableUsers(users);
        } catch (err) {
            console.error('Error fetching mentionable users:', err);
        }
    };

    const handleAddComment = async () => {
        if (!newContent.trim()) return;

        try {
            setSubmitting(true);
            const userIds = selectedMentions.filter(m => m.type === 'user').map(m => m.id);
            const techIds = selectedMentions.filter(m => m.type === 'technician').map(m => m.id);

            await workOrdersService.addTaskComment(
                task.id,
                newContent,
                newAttachments,
                userIds,
                techIds
            );

            setNewContent('');
            setNewAttachments([]);
            setSelectedMentions([]);
            await fetchComments();
            toast.success('Comment added');
        } catch (err) {
            console.error('Error adding comment:', err);
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const currentCount = newAttachments.length;
        const remaining = 5 - currentCount;

        if (files.length > remaining) {
            toast.warning(`You can only add ${remaining} more attachment(s)`);
            return;
        }

        try {
            setUploadingFiles(true);
            const uploadedUrls: string[] = [];

            for (let i = 0; i < Math.min(files.length, remaining); i++) {
                const url = await workOrdersService.uploadCommentAttachment(task.id, files[i]);
                uploadedUrls.push(url);
            }

            setNewAttachments(prev => [...prev, ...uploadedUrls]);
            toast.success(`${uploadedUrls.length} file(s) uploaded`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload files');
        } finally {
            setUploadingFiles(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveAttachment = (index: number) => {
        setNewAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Handle text input and @ mention detection
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        setNewContent(value);

        // Check if we're in a mention context
        const textBeforeCursor = value.substring(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf('@');

        if (atIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(atIndex + 1);
            // Only show dropdown if there's no space after @
            if (!textAfterAt.includes(' ')) {
                setShowMentionDropdown(true);
                setMentionFilter(textAfterAt.toLowerCase());
                setMentionStartPos(atIndex);
            } else {
                setShowMentionDropdown(false);
                setMentionStartPos(null);
            }
        } else {
            setShowMentionDropdown(false);
            setMentionStartPos(null);
        }
    };

    const handleSelectMention = (user: MentionableUser) => {
        if (mentionStartPos !== null) {
            const before = newContent.substring(0, mentionStartPos);
            const cursorPos = textareaRef.current?.selectionStart || newContent.length;
            const after = newContent.substring(cursorPos);
            const newText = `${before}@${user.name} ${after}`;
            setNewContent(newText);
            setSelectedMentions(prev => [...prev, { id: user.id, name: user.name, type: user.type }]);
        }
        setShowMentionDropdown(false);
        setMentionFilter('');
        setMentionStartPos(null);
        textareaRef.current?.focus();
    };

    const filteredMentionUsers = mentionableUsers.filter(u =>
        u.name.toLowerCase().includes(mentionFilter)
    );

    // Edit handlers
    const handleEdit = (comment: TaskComment) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
        setEditAttachments(comment.attachments || []);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditContent('');
        setEditAttachments([]);
    };

    const handleSaveEdit = async () => {
        if (!editingCommentId || !editContent.trim()) return;

        try {
            // Extract mentions from content
            const mentionMatches = editContent.match(/@(\w+(?:\s\w+)?)/g) || [];
            const userIds: string[] = [];
            const techIds: string[] = [];

            mentionMatches.forEach(match => {
                const name = match.substring(1); // Remove @
                const user = mentionableUsers.find(u => u.name === name);
                if (user) {
                    if (user.type === 'user') userIds.push(user.id);
                    else techIds.push(user.id);
                }
            });

            await workOrdersService.updateTaskComment(
                editingCommentId,
                editContent,
                editAttachments,
                userIds,
                techIds
            );

            setEditingCommentId(null);
            setEditContent('');
            setEditAttachments([]);
            await fetchComments();
            toast.success('Comment updated');
        } catch (err) {
            console.error('Error updating comment:', err);
            toast.error('Failed to update comment');
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Delete this comment?')) return;

        try {
            await workOrdersService.deleteTaskComment(commentId);
            await fetchComments();
            toast.success('Comment deleted');
        } catch (err) {
            console.error('Error deleting comment:', err);
            toast.error('Failed to delete comment');
        }
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const isEdited = (comment: TaskComment) => {
        return comment.updated_at && comment.updated_at !== comment.created_at;
    };

    const openFileViewer = (attachments: string[], index: number) => {
        setViewerFiles(attachments.map(url => ({
            file_url: url,
            file_name: url.split('/').pop() || 'file'
        })));
        setViewerIndex(index);
        setViewerOpen(true);
    };

    const renderContent = (content: string) => {
        // Highlight @mentions in content
        const parts = content.split(/(@\w+(?:\s\w+)?)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span key={i} className="text-blue-600 font-medium">
                        {part}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const isImageFile = (url: string) => {
        const ext = url.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    };

    const getFileIcon = (url: string) => {
        const ext = url.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return <FileText className="w-4 h-4" />;
        return <Image className="w-4 h-4" />;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-gray-600" />
                        <h2 className="font-semibold text-lg truncate">
                            {safeRender(task.name)}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No comments yet. Be the first to comment!
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                {/* User info */}
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                                        {comment.user?.avatar_url ? (
                                            <img src={comment.user.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            comment.user?.display_name?.charAt(0).toUpperCase() || '?'
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">
                                                {safeRender(comment.user?.display_name) || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDate(comment.created_at)}
                                            </span>
                                            {isEdited(comment) && (
                                                <span className="text-xs text-gray-400 italic">(edited)</span>
                                            )}
                                        </div>

                                        {/* Content or Edit Mode */}
                                        {editingCommentId === comment.id ? (
                                            <div className="mt-2 space-y-2">
                                                <Textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={3}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" onClick={handleSaveEdit}>
                                                        <Check className="w-4 h-4 mr-1" /> Save
                                                    </Button>
                                                    <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm mt-1 whitespace-pre-wrap">
                                                    {renderContent(comment.content)}
                                                </p>

                                                {/* Attachments */}
                                                {comment.attachments && comment.attachments.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {comment.attachments.map((url, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => openFileViewer(comment.attachments, idx)}
                                                                className="relative group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 transition-colors"
                                                            >
                                                                {isImageFile(url) ? (
                                                                    /* Image thumbnail */
                                                                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700">
                                                                        <img
                                                                            src={url}
                                                                            alt="attachment"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">View</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    /* PDF file card */
                                                                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center p-2">
                                                                        <FileText className="w-8 h-8 text-red-500 mb-1" />
                                                                        <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate w-full text-center">
                                                                            {url.split('/').pop()?.substring(0, 12)}...
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                {currentUserId === comment.user_id && (
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleEdit(comment)}
                                                            className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                                                        >
                                                            <Pencil className="w-3 h-3" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(comment.id)}
                                                            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-3 h-3" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    {/* Attachment previews */}
                    {newAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {newAttachments.map((url, idx) => (
                                <div key={idx} className="relative group">
                                    {isImageFile(url) ? (
                                        /* Image thumbnail preview */
                                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                            <img
                                                src={url}
                                                alt="attachment"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        /* PDF file preview */
                                        <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center">
                                            <FileText className="w-6 h-6 text-red-500" />
                                            <span className="text-[8px] text-gray-500 mt-1">PDF</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleRemoveAttachment(idx)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            {/* Mention dropdown - positioned above textarea */}
                            {showMentionDropdown && filteredMentionUsers.length > 0 && (
                                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                        <span className="text-xs text-gray-500 font-medium">Mention someone</span>
                                    </div>
                                    {filteredMentionUsers.map(user => (
                                        <button
                                            key={`${user.type}-${user.id}`}
                                            onClick={() => handleSelectMention(user)}
                                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                                                {user.type === 'technician' ? '🔧 Technician' : '👤 Staff'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <Textarea
                                ref={textareaRef}
                                value={newContent}
                                onChange={handleContentChange}
                                placeholder="Type a comment... Use @ to mention someone"
                                rows={2}
                                className="resize-none pr-10"
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingFiles || newAttachments.length >= 5}
                                className="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                title="Attach files (max 5)"
                            >
                                {uploadingFiles ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <Paperclip className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                        <Button
                            onClick={handleAddComment}
                            disabled={!newContent.trim() || submitting}
                            className="self-end"
                        >
                            {submitting ? <LoadingSpinner size="sm" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* File Viewer */}
            <FileViewerModal
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                files={viewerFiles as any}
                initialFileIndex={viewerIndex}
            />
        </>
    );
}

export default TaskCommentsPanel;
