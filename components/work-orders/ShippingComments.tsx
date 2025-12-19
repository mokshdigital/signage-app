'use client';

import { useState, useEffect } from 'react';
import { ShippingComment } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { createClient } from '@/lib/supabase/client';
import { Button, Textarea, LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface ShippingCommentsProps {
    workOrderId: string;
}

export function ShippingComments({ workOrderId }: ShippingCommentsProps) {
    const [comments, setComments] = useState<ShippingComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        };
        fetchUser();
    }, []);

    // Fetch comments
    useEffect(() => {
        fetchComments();
    }, [workOrderId]);

    const fetchComments = async () => {
        try {
            const data = await workOrdersService.getShippingComments(workOrderId);
            setComments(data);
        } catch (error: any) {
            toast.error('Failed to load comments', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const comment = await workOrdersService.addShippingComment(workOrderId, newComment);
            setComments(prev => [comment, ...prev]);
            setNewComment('');
            toast.success('Comment added');
        } catch (error: any) {
            toast.error('Failed to add comment', { description: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (comment: ShippingComment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const handleSaveEdit = async () => {
        if (!editingId || !editContent.trim()) return;

        try {
            const updated = await workOrdersService.updateShippingComment(editingId, editContent);
            setComments(prev => prev.map(c => c.id === editingId ? updated : c));
            setEditingId(null);
            setEditContent('');
            toast.success('Comment updated');
        } catch (error: any) {
            toast.error('Failed to update comment', { description: error.message });
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await workOrdersService.deleteShippingComment(commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast.success('Comment deleted');
        } catch (error: any) {
            toast.error('Failed to delete comment', { description: error.message });
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-4">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Shipping Comments</h4>

            {/* Add Comment Input */}
            <div className="space-y-2">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a shipping comment..."
                    rows={2}
                    className="w-full"
                />
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        onClick={handleAddComment}
                        loading={submitting}
                        disabled={!newComment.trim()}
                    >
                        Add Comment
                    </Button>
                </div>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-2">No shipping comments yet.</p>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    {comment.user?.avatar_url ? (
                                        <img
                                            src={comment.user.avatar_url}
                                            alt={comment.user.display_name}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                                            {comment.user?.display_name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {safeRender(comment.user?.display_name) || 'Unknown'}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            {formatDate(comment.created_at)}
                                            {comment.updated_at !== comment.created_at && ' (edited)'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions - show only for own comments */}
                                {currentUserId === comment.user_id && editingId !== comment.id && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(comment)}
                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            {editingId === comment.id ? (
                                <div className="space-y-2">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={2}
                                        className="w-full"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-1 text-gray-500 hover:text-gray-700"
                                            title="Cancel"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="p-1 text-green-600 hover:text-green-700"
                                            title="Save"
                                            disabled={!editContent.trim()}
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {safeRender(comment.content)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
