'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileCategory, WorkOrderFile } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { Button, Card, Badge, Modal, Input, Alert, LoadingSpinner } from '@/components/ui';
import {
    Folder,
    FileText,
    Image as ImageIcon,
    Trash2,
    MoveRight,
    Upload,
    ChevronRight,
    ChevronDown,
    Eye,
    MoreVertical,
    FilePlus
} from 'lucide-react';
import { toast } from '@/components/providers';
import { formatFileSize } from '@/lib/utils/formatters';

interface WorkOrderFilesCardProps {
    workOrderId: string;
    canManage?: boolean;
}

export function WorkOrderFilesCard({ workOrderId, canManage: canManageProp = true }: WorkOrderFilesCardProps) {
    const [categories, setCategories] = useState<FileCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
    const [movingFile, setMovingFile] = useState<WorkOrderFile | null>(null);
    const [moveTarget, setMoveTarget] = useState<string>('');
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

    // Permission state (simplified for now, ideally from a hook)
    const [userRole, setUserRole] = useState<string>('office_staff'); // Default fallback

    useEffect(() => {
        fetchData();
        checkUserRole();
    }, [workOrderId]);

    const checkUserRole = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Fetch profile role (simplified)
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('role:roles(name)')
                .eq('id', user.id)
                .single();
            if (profile?.role) {
                // @ts-ignore
                setUserRole(profile.role.name);
            }
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await workOrdersService.getFileCategories(workOrderId);
            setCategories(data);

            // Auto-expand categories with files
            const newExpanded: Record<string, boolean> = {};
            data.forEach(cat => {
                if (cat.files && cat.files.length > 0) {
                    newExpanded[cat.id] = true;
                }
                // Also expand parents of populated subcats?
                // Logic simpler: just expand top level widely used ones?
                if (['Pictures', 'Work Order'].includes(cat.name)) {
                    newExpanded[cat.id] = true;
                }
            });
            setExpanded(prev => ({ ...prev, ...newExpanded }));
        } catch (error) {
            console.error('Failed to load files:', error);
            toast.error('Failed to load file categories');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (catId: string) => {
        setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: string, categoryPath: string) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const toastId = toast.loading(`Uploading ${file.name}...`);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            await workOrdersService.uploadFileToCategory(
                workOrderId,
                categoryId,
                file,
                user.id,
                categoryPath
            );

            toast.success('File uploaded', { id: toastId });
            fetchData();
        } catch (error: any) {
            toast.error('Upload failed', { description: error.message, id: toastId });
        } finally {
            setUploadingCategory(null);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file? This cannot be undone.')) return;

        const toastId = toast.loading('Deleting file...');
        try {
            await workOrdersService.deleteFile(fileId);
            toast.success('File deleted', { id: toastId });
            fetchData();
        } catch (error: any) {
            toast.error('Delete failed', { description: error.message, id: toastId });
        }
    };

    const handleMoveFile = async () => {
        if (!movingFile || !moveTarget) return;

        const toastId = toast.loading('Moving file...');
        try {
            await workOrdersService.recategorizeFile(movingFile.id, moveTarget);
            toast.success('File moved', { id: toastId });
            setIsMoveModalOpen(false);
            setMovingFile(null);
            setMoveTarget('');
            fetchData();
        } catch (error: any) {
            toast.error('Move failed', { description: error.message, id: toastId });
        }
    };

    const canManageCategory = (cat: FileCategory) => {
        // RBAC Logic
        // 'office' -> accessible by admin/office
        // 'field' -> accessible by all (techs usually can manage field docs)
        // 'office_only' -> only admin/office

        // This is a UI check, actual security is in RLS.
        // Simplified for this demo:
        if (userRole === 'technician') {
            return cat.rbac_level === 'field';
        }
        return true; // Admins/Office can manage all (mostly)
    };

    const renderCategory = (cat: FileCategory, level = 0) => {
        const subcategories = categories.filter(c => c.parent_id === cat.id);
        const hasSubcategories = subcategories.length > 0;
        const isExpanded = expanded[cat.id];
        const canManage = canManageProp && canManageCategory(cat);

        return (
            <div key={cat.id} className={`border-b border-gray-100 last:border-0`}>
                <div
                    className={`
                        flex items-center justify-between p-3 hover:bg-gray-50 transition-colors
                        ${level > 0 ? 'pl-8 bg-gray-50/50' : ''}
                    `}
                >
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            onClick={() => toggleExpand(cat.id)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500"
                        >
                            {hasSubcategories || (cat.files && cat.files.length > 0) ? (
                                isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                            ) : (
                                <Folder className="w-4 h-4 text-gray-400" />
                            )}
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700 text-sm">{cat.name}</span>
                            {cat.files && cat.files.length > 0 && (
                                <Badge variant="default" className="ml-1 text-[10px] h-5 px-1.5">
                                    {cat.files.length}
                                </Badge>
                            )}
                            {!cat.is_system && <Badge variant="purple" className="text-[10px] h-4 px-1">Custom</Badge>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {canManage && (
                            <div className="relative">
                                <input
                                    type="file"
                                    id={`upload-${cat.id}`}
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e, cat.id, cat.name)} // Using name as basic path for now
                                />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => document.getElementById(`upload-${cat.id}`)?.click()}
                                    title="Upload File"
                                >
                                    <FilePlus className="w-4 h-4 text-blue-600" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <div>
                        {/* Files in this category */}
                        {cat.files && cat.files.length > 0 && (
                            <div className={`space-y-1 py-1 ${level > 0 ? 'pl-12 pr-4' : 'pl-10 pr-4'}`}>
                                {cat.files.map(file => (
                                    <div key={file.id} className="group flex items-center justify-between py-2 px-3 bg-white border border-gray-100 rounded-md hover:border-blue-200 hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {file.mime_type?.startsWith('image/') ? (
                                                <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden relative">
                                                    <img src={file.file_url} alt={file.file_name || 'Image'} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                </div>
                                            )}

                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-700 truncate max-w-[200px] sm:max-w-xs">{file.file_name}</p>
                                                <p className="text-[10px] text-gray-400">
                                                    {file.file_size ? formatFileSize(file.file_size) : 'Unknown size'} • {new Date(file.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                title="View"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </a>

                                            {canManage && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setMovingFile(file);
                                                            setMoveTarget(cat.id); // Default to current
                                                            setIsMoveModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded"
                                                        title="Move Category"
                                                    >
                                                        <MoveRight className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFile(file.id)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Render Subcategories */}
                        {subcategories.map(sub => renderCategory(sub, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Filter top level categories for initial render loop
    const topLevelCategories = categories.filter(c => !c.parent_id);

    return (
        <Card
            title="Project Files"
            headerActions={
                <Button size="sm" variant="ghost" onClick={fetchData} leftIcon={<LoadingSpinner className={loading ? "animate-spin" : "opacity-0"} />}>
                    Refresh
                </Button>
            }
        >
            {loading && categories.length === 0 ? (
                <div className="p-8 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {topLevelCategories.map(cat => renderCategory(cat))}
                    {topLevelCategories.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                            No file categories found.
                        </div>
                    )}
                </div>
            )}

            {/* Move File Modal */}
            <Modal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                title="Move File"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Select a new category for <b>{movingFile?.file_name}</b>:
                    </p>

                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setMoveTarget(cat.id)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${moveTarget === cat.id ? 'bg-blue-50 text-blue-700' : ''}`}
                            >
                                <span className={cat.parent_id ? 'pl-4' : ''}>{cat.name}</span>
                                {moveTarget === cat.id && <Badge variant="default" size="sm" className="h-2 w-2 p-0 rounded-full bg-blue-500" />}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setIsMoveModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleMoveFile} disabled={!moveTarget || moveTarget === movingFile?.category_id}>
                            Move File
                        </Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
}
