'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clientPortalService, ClientWorkOrderSummary, ClientWorkOrderDetail, ClientVisibleFile, ChatMessageForExport, CompanySettings } from '@/services/client-portal.service'
import jsPDF from 'jspdf'

type TabId = 'chat' | 'files' | 'reports';

interface ChatMessage {
    id: string;
    message: string;
    sender_id: string;
    sender_company_name: string | null;
    file_references: string[];
    created_at: string;
    is_deleted: boolean;
    sender?: {
        display_name: string;
    };
}

export default function ClientDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [pmInfo, setPmInfo] = useState<{ name: string; client_name: string } | null>(null)
    const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
    const [workOrders, setWorkOrders] = useState<ClientWorkOrderSummary[]>([])
    const [selectedWOId, setSelectedWOId] = useState<string | null>(null)
    const [selectedWO, setSelectedWO] = useState<ClientWorkOrderDetail | null>(null)
    const [activeTab, setActiveTab] = useState<TabId>('chat')
    const [files, setFiles] = useState<ClientVisibleFile[]>([])
    const [loadingFiles, setLoadingFiles] = useState(false)

    // Chat state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [loadingChat, setLoadingChat] = useState(false)
    const [newMessage, setNewMessage] = useState('')
    const [sendingMessage, setSendingMessage] = useState(false)
    const [exportingPDF, setExportingPDF] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/client-login')
                return
            }

            // Verify user is external
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('user_type, is_active')
                .eq('id', user.id)
                .single()

            if (!profile?.is_active || profile?.user_type !== 'external') {
                await supabase.auth.signOut()
                router.push('/client-login')
                return
            }

            // Load PM info, company settings, and accessible work orders
            const [pm, settings, wos] = await Promise.all([
                clientPortalService.getCurrentProjectManager(),
                clientPortalService.getCompanySettings(),
                clientPortalService.getAccessibleWorkOrders()
            ])

            if (!pm) {
                await supabase.auth.signOut()
                router.push('/client-login')
                return
            }

            setPmInfo({ name: pm.name, client_name: pm.client_name })
            setCompanySettings(settings)
            setWorkOrders(wos)
            setLoading(false)
        }

        loadData()
    }, [supabase, router])

    // Load WO details when selected
    useEffect(() => {
        if (!selectedWOId) {
            setSelectedWO(null)
            return
        }

        const loadWODetails = async () => {
            const details = await clientPortalService.getWorkOrderForClient(selectedWOId)
            setSelectedWO(details)
        }

        loadWODetails()
    }, [selectedWOId])

    // Load chat messages
    const loadChatMessages = useCallback(async () => {
        if (!selectedWOId) return
        setLoadingChat(true)

        const { data } = await supabase
            .from('work_order_client_chat')
            .select(`
                id, message, sender_id, sender_company_name, file_references, created_at, is_deleted,
                sender:user_profiles!work_order_client_chat_sender_id_fkey(display_name)
            `)
            .eq('work_order_id', selectedWOId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })

        setChatMessages(data || [])
        setLoadingChat(false)
    }, [selectedWOId, supabase])

    // Load files
    const loadFiles = useCallback(async () => {
        if (!selectedWOId) return
        setLoadingFiles(true)
        const fileData = await clientPortalService.getClientVisibleFiles(selectedWOId)
        setFiles(fileData)
        setLoadingFiles(false)
    }, [selectedWOId])

    // Load tab content when tab changes or WO changes
    useEffect(() => {
        if (!selectedWOId) return

        if (activeTab === 'chat') {
            loadChatMessages()
        } else if (activeTab === 'files') {
            loadFiles()
        }
    }, [activeTab, selectedWOId, loadChatMessages, loadFiles])

    // Real-time chat subscription
    useEffect(() => {
        if (!selectedWOId || activeTab !== 'chat') return

        const channel = supabase
            .channel(`client-chat-${selectedWOId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'work_order_client_chat',
                filter: `work_order_id=eq.${selectedWOId}`
            }, () => {
                loadChatMessages()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedWOId, activeTab, supabase, loadChatMessages])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/client-login')
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedWOId || sendingMessage) return

        setSendingMessage(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            await supabase.from('work_order_client_chat').insert({
                work_order_id: selectedWOId,
                sender_id: user.id,
                message: newMessage.trim(),
                sender_company_name: pmInfo?.client_name || null
            })
            setNewMessage('')
        }

        setSendingMessage(false)
    }

    const handleExportChat = async () => {
        if (!selectedWOId || !selectedWO || !companySettings) return
        setExportingPDF(true)

        try {
            const messages = await clientPortalService.getChatMessagesForExport(selectedWOId)
            const doc = new jsPDF()
            let y = 20

            // Header - Company Logo placeholder (if no logo, use text)
            doc.setFontSize(20)
            doc.setFont('helvetica', 'bold')
            doc.text(companySettings.name, 20, y)
            y += 10

            // Work Order Info
            doc.setFontSize(12)
            doc.setFont('helvetica', 'normal')
            doc.text(`Work Order: ${selectedWO.work_order_number || 'N/A'}`, 20, y)
            y += 7
            doc.text(`Client: ${selectedWO.client?.name || 'N/A'}`, 20, y)
            y += 7

            if (selectedWO.project_manager) {
                doc.text(`Primary Contact: ${selectedWO.project_manager.name}`, 20, y)
                y += 5
                doc.setFontSize(10)
                if (selectedWO.project_manager.email) {
                    doc.text(`  Email: ${selectedWO.project_manager.email}`, 20, y)
                    y += 4
                }
                if (selectedWO.project_manager.phone) {
                    doc.text(`  Phone: ${selectedWO.project_manager.phone}`, 20, y)
                    y += 4
                }
                doc.setFontSize(12)
                y += 3
            }

            if (selectedWO.owner) {
                doc.text(`WO Owner: ${selectedWO.owner.display_name}`, 20, y)
                y += 5
                doc.setFontSize(10)
                if (selectedWO.owner.email) {
                    doc.text(`  Email: ${selectedWO.owner.email}`, 20, y)
                    y += 4
                }
                if (selectedWO.owner.phone) {
                    doc.text(`  Phone: ${selectedWO.owner.phone}`, 20, y)
                    y += 4
                }
                doc.setFontSize(12)
                y += 3
            }

            // Export date
            doc.setFontSize(10)
            doc.text(`Exported: ${new Date().toLocaleString()}`, 20, y)
            y += 15

            // Divider
            doc.setDrawColor(200, 200, 200)
            doc.line(20, y, 190, y)
            y += 10

            // Chat History Header
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('Chat History', 20, y)
            y += 10

            // Messages
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')

            for (const msg of messages) {
                // Check if we need a new page
                if (y > 270) {
                    doc.addPage()
                    y = 20
                }

                const date = new Date(msg.created_at).toLocaleString()
                const sender = msg.sender_company
                    ? `${msg.sender_name} (${msg.sender_company})`
                    : msg.sender_name

                doc.setFont('helvetica', 'bold')
                doc.text(`[${date}] ${sender}:`, 20, y)
                y += 5

                doc.setFont('helvetica', 'normal')
                // Word wrap message
                const lines = doc.splitTextToSize(msg.message, 170)
                for (const line of lines) {
                    if (y > 280) {
                        doc.addPage()
                        y = 20
                    }
                    doc.text(line, 25, y)
                    y += 5
                }
                y += 5
            }

            // Save
            doc.save(`chat-export-${selectedWO.work_order_number || selectedWOId}.pdf`)
        } catch (err) {
            console.error('Export failed:', err)
        } finally {
            setExportingPDF(false)
        }
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'Unknown size'
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Company Logo & Name */}
                        <div className="flex items-center gap-3">
                            {companySettings?.logo_url ? (
                                <img
                                    src={companySettings.logo_url}
                                    alt={companySettings.name}
                                    className="h-10 w-auto object-contain"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                    {companySettings?.name?.substring(0, 2) || 'TL'}
                                </div>
                            )}
                            <span className="text-white font-semibold text-lg hidden sm:block">
                                {companySettings?.name || 'Tops Lighting'}
                            </span>
                        </div>

                        {/* Right: Client Name & User Menu */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-amber-200 text-sm">{pmInfo?.client_name}</p>
                                <p className="text-gray-300 text-xs">{pmInfo?.name}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-red-600/20 rounded-lg transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Work Order Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-amber-200 mb-2">
                        Select Work Order
                    </label>
                    <select
                        value={selectedWOId || ''}
                        onChange={(e) => setSelectedWOId(e.target.value || null)}
                        className="w-full max-w-md px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                        <option value="" className="bg-slate-800">Choose a work order...</option>
                        {workOrders.map(wo => (
                            <option key={wo.id} value={wo.id} className="bg-slate-800">
                                {wo.work_order_number || 'No WO#'} — {wo.site_address ? (wo.site_address.length > 40 ? wo.site_address.substring(0, 40) + '...' : wo.site_address) : 'No address'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selected Work Order Content */}
                {selectedWO ? (
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
                        {/* WO Header */}
                        <div className="p-6 border-b border-white/10">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl font-bold text-white">
                                            {selectedWO.work_order_number || 'Work Order'}
                                        </h1>
                                        <span className="px-3 py-1 bg-red-600/30 text-red-200 text-sm rounded-full">
                                            {selectedWO.job_status}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mb-1">
                                        PO: {selectedWO.client_po_number || 'No PO'}
                                    </p>
                                    <p className="text-white/80">
                                        📍 {selectedWO.site_address || 'No address specified'}
                                    </p>
                                </div>

                                {/* WO Owner Contact */}
                                {selectedWO.owner && (
                                    <div className="bg-white/5 rounded-xl p-4 min-w-[240px]">
                                        <p className="text-amber-300/70 text-xs uppercase tracking-wider mb-2">Your Contact</p>
                                        <p className="text-white font-medium">{selectedWO.owner.display_name}</p>
                                        {selectedWO.owner.phone && (
                                            <p className="text-gray-300 text-sm">📞 {selectedWO.owner.phone}</p>
                                        )}
                                        {selectedWO.owner.email && (
                                            <p className="text-gray-300 text-sm">✉️ {selectedWO.owner.email}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            {(['chat', 'files', 'reports'] as TabId[]).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab
                                        ? 'text-white bg-white/10 border-b-2 border-red-500'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {tab === 'chat' && '💬 '}
                                    {tab === 'files' && '📄 '}
                                    {tab === 'reports' && '📊 '}
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'chat' && (
                                <div className="space-y-4">
                                    {/* Export Button */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleExportChat}
                                            disabled={exportingPDF || chatMessages.length === 0}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                                        >
                                            {exportingPDF ? 'Exporting...' : '📥 Export Chat (PDF)'}
                                        </button>
                                    </div>

                                    {/* Messages */}
                                    <div className="h-[400px] overflow-y-auto space-y-3 bg-white/5 rounded-xl p-4">
                                        {loadingChat ? (
                                            <div className="flex justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                                            </div>
                                        ) : chatMessages.length === 0 ? (
                                            <p className="text-center text-gray-400 py-8">No messages yet. Start the conversation!</p>
                                        ) : (
                                            chatMessages.map(msg => (
                                                <div key={msg.id} className="bg-white/5 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-white font-medium text-sm">
                                                            {(msg.sender as any)?.display_name || 'Unknown'}
                                                        </span>
                                                        {msg.sender_company_name && (
                                                            <span className="text-amber-300/70 text-xs">
                                                                ({msg.sender_company_name})
                                                            </span>
                                                        )}
                                                        <span className="text-gray-500 text-xs ml-auto">
                                                            {new Date(msg.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-white/90 text-sm">{msg.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim() || sendingMessage}
                                            className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'files' && (
                                <div className="space-y-4">
                                    {loadingFiles ? (
                                        <div className="flex justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                                        </div>
                                    ) : files.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-4xl mb-4">📄</p>
                                            <p className="text-gray-400">No files available for this work order yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {files.map(file => (
                                                <div key={file.id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 bg-amber-500/30 rounded-lg flex items-center justify-center text-amber-200">
                                                            {file.mime_type?.includes('pdf') ? '📄' :
                                                                file.mime_type?.includes('image') ? '🖼️' : '📎'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-white font-medium truncate">
                                                                {file.file_name || 'Unnamed file'}
                                                            </p>
                                                            <p className="text-gray-400 text-sm">
                                                                {formatFileSize(file.file_size)}
                                                                {file.category_name && ` • ${file.category_name}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={file.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors shrink-0"
                                                    >
                                                        Download
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reports' && (
                                <div className="text-center py-16">
                                    <p className="text-6xl mb-4">📊</p>
                                    <h3 className="text-white font-semibold text-xl mb-2">Reports Coming Soon</h3>
                                    <p className="text-gray-400">
                                        Project reports and analytics will be available here in a future update.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
                        <p className="text-5xl mb-4">📋</p>
                        <h2 className="text-white text-xl font-semibold mb-2">Select a Work Order</h2>
                        <p className="text-gray-400">
                            Choose a work order from the dropdown above to view details, chat, and files.
                        </p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="mt-auto py-6 text-center text-gray-500 text-sm">
                © {new Date().getFullYear()} {companySettings?.name || 'Tops Lighting'}. All rights reserved.
            </footer>
        </div>
    )
}
