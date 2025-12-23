'use client';

import { useState, useEffect, useRef } from 'react';
import { LoadingSpinner, Alert } from '@/components/ui';
import { workOrdersService } from '@/services/work-orders.service';
import { createClient } from '@/lib/supabase/client';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { MessageSquare } from 'lucide-react';

interface Message {
    id: string;
    message: string;
    file_references: string[];
    edited_at: string | null;
    is_deleted: boolean;
    created_at: string;
    user_profile: {
        id: string;
        display_name: string;
        avatar_url: string | null;
    };
}

interface WorkOrderFile {
    id: string;
    filename: string;
    category: string;
    url: string;
    mime_type: string;
}

interface TeamChatProps {
    workOrderId: string;
    currentUserId: string;
    workOrderFiles: WorkOrderFile[];
}

export function TeamChat({ workOrderId, currentUserId, workOrderFiles }: TeamChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Create file map for quick lookup
    const filesMap = workOrderFiles.reduce((acc, file) => {
        acc[file.id] = { filename: file.filename, url: file.url, mime_type: file.mime_type };
        return acc;
    }, {} as Record<string, { filename: string; url: string; mime_type: string }>);

    useEffect(() => {
        fetchMessages();

        // Set up realtime subscription
        const supabase = createClient();
        const channel = supabase
            .channel(`chat:${workOrderId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'work_order_chat_messages',
                    filter: `work_order_id=eq.${workOrderId}`,
                },
                (payload) => {
                    handleRealtimeUpdate(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workOrderId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await workOrdersService.getChatMessages(workOrderId);
            setMessages(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRealtimeUpdate = async (payload: any) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'INSERT') {
            // Fetch the full message with user profile
            const supabase = createClient();
            const { data } = await supabase
                .from('work_order_chat_messages')
                .select('id, message, file_references, edited_at, is_deleted, created_at, user_profile:user_profiles(id, display_name, avatar_url)')
                .eq('id', newRecord.id)
                .single();

            if (data && !data.is_deleted) {
                setMessages(prev => [...prev, data as any]);
            }
        } else if (eventType === 'UPDATE') {
            if (newRecord.is_deleted) {
                // Remove soft-deleted message
                setMessages(prev => prev.filter(m => m.id !== newRecord.id));
            } else {
                // Update existing message
                setMessages(prev =>
                    prev.map(m =>
                        m.id === newRecord.id
                            ? { ...m, message: newRecord.message, edited_at: newRecord.edited_at }
                            : m
                    )
                );
            }
        } else if (eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== oldRecord.id));
        }
    };

    const handleSendMessage = async (message: string, fileReferences: string[]) => {
        try {
            await workOrdersService.sendChatMessage(workOrderId, message, fileReferences);
            // Realtime will handle adding the message to the list
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEditMessage = async (messageId: string, newMessage: string) => {
        try {
            await workOrdersService.editChatMessage(messageId, newMessage);
            // Realtime will handle updating the message
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await workOrdersService.deleteChatMessage(messageId);
            // Realtime will handle removing the message
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">Team Chat</h3>
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 pt-2">
                    <Alert variant="error" title="Error" dismissible onDismiss={() => setError(null)}>
                        {error}
                    </Alert>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: '300px', maxHeight: '500px' }}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {messages.map(msg => (
                            <ChatMessage
                                key={msg.id}
                                id={msg.id}
                                message={msg.message}
                                createdAt={msg.created_at}
                                editedAt={msg.edited_at}
                                user={msg.user_profile}
                                fileReferences={msg.file_references}
                                filesMap={filesMap}
                                isOwnMessage={msg.user_profile.id === currentUserId}
                                onEdit={handleEditMessage}
                                onDelete={handleDeleteMessage}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <ChatInput
                onSend={handleSendMessage}
                workOrderFiles={workOrderFiles.map(f => ({ id: f.id, filename: f.filename, category: f.category }))}
            />
        </div>
    );
}

export default TeamChat;
