'use client';

import { useState, useEffect, useRef } from 'react';
import { workOrdersService } from '@/services';
import { createClient } from '@/lib/supabase/client';
import { Button, LoadingSpinner } from '@/components/ui';
import { showToast } from '@/components/providers/ToastProvider';

interface ClientChatProps {
    workOrderId: string;
}

interface ChatMessage {
    id: string;
    message: string;
    file_references: string[];
    sender_company_name: string | null;
    edited_at: string | null;
    is_deleted: boolean;
    created_at: string;
    sender: { id: string; display_name: string; avatar_url: string | null };
}

export function ClientChat({ workOrderId }: ClientChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<{ file: File; url: string }[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadMessages();
        setupRealtimeSubscription();
        getCurrentUser();

        return () => {
            // Cleanup realtime subscription
            const supabase = createClient();
            supabase.channel(`client-chat-${workOrderId}`).unsubscribe();
        };
    }, [workOrderId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getCurrentUser = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
    };

    const loadMessages = async () => {
        try {
            const data = await workOrdersService.getClientChatMessages(workOrderId);
            setMessages(data);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        const supabase = createClient();

        supabase
            .channel(`client-chat-${workOrderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'work_order_client_chat',
                    filter: `work_order_id=eq.${workOrderId}`
                },
                () => {
                    loadMessages(); // Reload to get full message with sender info
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'work_order_client_chat',
                    filter: `work_order_id=eq.${workOrderId}`
                },
                () => {
                    loadMessages();
                }
            )
            .subscribe();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && pendingFiles.length === 0) return;
        if (!newMessage.trim() && pendingFiles.length > 0) {
            showToast.error('Please add a message with your file attachments');
            return;
        }

        setSending(true);
        try {
            const fileRefs = pendingFiles.map(f => f.url);
            await workOrdersService.sendClientChatMessage(workOrderId, newMessage, fileRefs);
            setNewMessage('');
            setPendingFiles([]);
        } catch (error: any) {
            showToast.error(error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const url = await workOrdersService.uploadClientChatAttachment(workOrderId, file);
            setPendingFiles(prev => [...prev, { file, url }]);
        } catch (error: any) {
            showToast.error(error.message || 'Failed to upload file');
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = '';
    messages.forEach(msg => {
        const msgDate = formatDate(msg.created_at);
        if (msgDate !== currentDate) {
            currentDate = msgDate;
            groupedMessages.push({ date: msgDate, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    });

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-center h-48">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col" style={{ height: '500px' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Client Chat</h3>
                    <span className="text-xs text-gray-500">• {messages.length} messages</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    groupedMessages.map((group) => (
                        <div key={group.date}>
                            {/* Date Separator */}
                            <div className="flex items-center justify-center my-4">
                                <div className="px-3 py-1 bg-white rounded-full text-xs text-gray-500 shadow-sm border border-gray-100">
                                    {group.date}
                                </div>
                            </div>

                            {/* Messages for this date */}
                            {group.messages.map((msg) => {
                                const isOwn = msg.sender.id === currentUserId;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                                    >
                                        <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                                            {/* Sender Info */}
                                            <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
                                                {!isOwn && (
                                                    <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center text-xs font-semibold text-purple-700">
                                                        {msg.sender.display_name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-xs font-medium text-gray-700">
                                                    {msg.sender.display_name}
                                                </span>
                                                {msg.sender_company_name && (
                                                    <span className="text-xs text-gray-400">
                                                        ({msg.sender_company_name})
                                                    </span>
                                                )}
                                            </div>

                                            {/* Message Bubble */}
                                            <div
                                                className={`rounded-2xl px-4 py-2 ${isOwn
                                                        ? 'bg-purple-600 text-white rounded-br-md'
                                                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>

                                                {/* File Attachments */}
                                                {msg.file_references && msg.file_references.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {msg.file_references.map((url, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`flex items-center gap-2 text-xs ${isOwn ? 'text-purple-200 hover:text-white' : 'text-purple-600 hover:text-purple-700'
                                                                    }`}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                </svg>
                                                                Attachment {idx + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Time & Edited */}
                                            <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${isOwn ? 'justify-end' : ''}`}>
                                                <span>{formatTime(msg.created_at)}</span>
                                                {msg.edited_at && <span>(edited)</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Pending Files Preview */}
            {pendingFiles.length > 0 && (
                <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                        {pendingFiles.map((pf, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200">
                                <span className="text-xs text-gray-700 truncate max-w-[150px]">{pf.file.name}</span>
                                <button
                                    onClick={() => removePendingFile(idx)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-end gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Attach file"
                    >
                        {uploadingFile ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        )}
                    </button>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent max-h-24"
                        style={{ minHeight: '40px' }}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={sending || (!newMessage.trim() && pendingFiles.length === 0)}
                        className="rounded-full px-4"
                    >
                        {sending ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
