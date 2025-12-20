'use client';

import { useState, useRef } from 'react';
import { Button, Alert, Badge } from '@/components/ui';
import { Folder, FileText, Image as ImageIcon, Trash2, Plus, ChevronRight, ChevronDown } from 'lucide-react';

interface WorkOrderUploadFormProps {
    onSubmit: (categorizedFiles: Record<string, File[]>, customCategories: { name: string; parent?: string }[]) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

interface CategoryDef {
    name: string;
    key: string;
    required?: boolean;
    subcategories?: CategoryDef[];
    isCustom?: boolean;
}

const SYSTEM_CATEGORIES: CategoryDef[] = [
    { name: 'Work Order', key: 'Work Order', required: true },
    { name: 'Survey', key: 'Survey' },
    { name: 'Plans', key: 'Plans' },
    { name: 'Art Work', key: 'Art Work' },
    {
        name: 'Pictures',
        key: 'Pictures',
        subcategories: [
            { name: 'Reference', key: 'Reference' },
            { name: 'Before', key: 'Before' },
            { name: 'WIP', key: 'WIP' },
            { name: 'After', key: 'After' },
            { name: 'Other', key: 'Other' }
        ]
    },
    {
        name: 'Tech Docs',
        key: 'Tech Docs',
        subcategories: [
            { name: 'Permits', key: 'Permits' },
            { name: 'Safety Docs', key: 'Safety Docs' },
            { name: 'Expense Receipts', key: 'Expense Receipts' }
        ]
    },
    {
        name: 'Office Docs',
        key: 'Office Docs',
        subcategories: [
            { name: 'Quote', key: 'Quote' },
            { name: 'Client PO', key: 'Client PO' }
        ]
    }
];

export function WorkOrderUploadForm({ onSubmit, onCancel, isLoading = false }: WorkOrderUploadFormProps) {
    // Map of "CategoryName/SubName" -> File[]
    const [files, setFiles] = useState<Record<string, File[]>>({});
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'Pictures': true,
        'Tech Docs': false,
        'Office Docs': false
    });
    const [customCategories, setCustomCategories] = useState<CategoryDef[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeCategoryRef = useRef<string | null>(null);

    const toggleExpand = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && activeCategoryRef.current) {
            const selectedFiles = Array.from(e.target.files);
            const categoryKey = activeCategoryRef.current;

            // Limit check? For now user said "No file limit"

            setFiles(prev => ({
                ...prev,
                [categoryKey]: [...(prev[categoryKey] || []), ...selectedFiles]
            }));

            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
            activeCategoryRef.current = null;
            setError(null);
        }
    };

    const triggerUpload = (categoryKey: string) => {
        activeCategoryRef.current = categoryKey;
        fileInputRef.current?.click();
    };

    const removeFile = (categoryKey: string, index: number) => {
        setFiles(prev => ({
            ...prev,
            [categoryKey]: prev[categoryKey].filter((_, i) => i !== index)
        }));
    };

    const addCustomCategory = () => {
        if (!newCategoryName.trim()) return;
        setCustomCategories(prev => [
            ...prev,
            { name: newCategoryName, key: newCategoryName, isCustom: true }
        ]);
        setNewCategoryName('');
        setIsAddingCustom(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Main Work Order file is required
        const woFiles = files['Work Order'];
        if (!woFiles || woFiles.length === 0) {
            setError('The "Work Order" category requires at least one file.');
            return;
        }

        try {
            await onSubmit(files, customCategories.map(c => ({ name: c.name })));
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const size = bytes / k;
        if (size < 1024) return size.toFixed(1) + ' KB';
        return (size / 1024).toFixed(1) + ' MB';
    };

    const renderCategory = (cat: CategoryDef, level = 0, parentKey = '') => {
        const categoryKey = parentKey ? `${parentKey}/${cat.name}` : cat.name;
        // Use just the name for top-level if simple map is desired, but for uniqueness logic in state:
        // System categories names are unique.
        // Let's use name as key for lookup in `files` state to match service layer expected format?
        // Service expects: Category name.
        // But for subcategories, `files` state key needs to identify it unique.
        // I will stick to "Parent/Child" format for internal key, and unpack it on submit.
        // Actually, for system categories, names are distinct even across parents? No, "Other" is in Pictures.
        // So I must track context.

        const myFiles = files[categoryKey] || [];
        const isExpanded = expanded[categoryKey];
        const hasSubcategories = (cat.subcategories && cat.subcategories.length > 0);

        return (
            <div key={categoryKey} className={`mb-4 select-none ${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between group">
                    <div
                        className="flex items-center gap-2 cursor-pointer py-1"
                        onClick={() => hasSubcategories && toggleExpand(categoryKey)}
                    >
                        {hasSubcategories ? (
                            isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
                        ) : (
                            <Folder className={`w-4 h-4 ${cat.required && myFiles.length === 0 ? 'text-red-400' : 'text-blue-500'}`} />
                        )}

                        <span className={`font-medium ${level === 0 ? 'text-gray-800' : 'text-gray-600'} ${cat.required && myFiles.length === 0 ? 'text-red-500' : ''}`}>
                            {cat.name}
                        </span>

                        {cat.required && <span className="text-xs text-red-500 ml-1">*</span>}

                        {myFiles.length > 0 && (
                            <Badge variant="default" className="ml-2">
                                {myFiles.length}
                            </Badge>
                        )}
                    </div>

                    {!hasSubcategories && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => triggerUpload(categoryKey)}
                            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            + Add File
                        </Button>
                    )}
                </div>

                {/* Subcategories (if expanded) */}
                {hasSubcategories && isExpanded && (
                    <div className="mt-2">
                        {cat.subcategories!.map(sub => renderCategory(sub, level + 1, categoryKey))}
                    </div>
                )}

                {/* File List */}
                {!hasSubcategories && myFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {myFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {file.type.startsWith('image/') ? (
                                        <ImageIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    ) : (
                                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <span className="truncate text-gray-700">{file.name}</span>
                                        <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(categoryKey, idx)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Organize Work Order Files</h2>
                <p className="text-sm text-gray-500">Categorize your uploads for better organization.</p>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} id="wo-upload-form">
                    {error && (
                        <Alert variant="error" dismissible onDismiss={() => setError(null)} className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {/* Hidden Global Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {/* System Categories */}
                    {SYSTEM_CATEGORIES.map(cat => renderCategory(cat))}

                    {/* Custom Categories */}
                    {customCategories.length > 0 && (
                        <div className="mt-8 border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Custom Categories</h3>
                            {customCategories.map(cat => renderCategory(cat))}
                        </div>
                    )}

                    {/* Add Custom Category Button */}
                    <div className="mt-4">
                        {isAddingCustom ? (
                            <div className="flex items-center gap-2 max-w-sm">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    placeholder="Enter category name..."
                                    className="flex-1 px-3 py-1.5 text-sm border rounded hover:border-blue-400 focus:outline-none focus:border-blue-500"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addCustomCategory();
                                        }
                                        if (e.key === 'Escape') setIsAddingCustom(false);
                                    }}
                                />
                                <Button type="button" size="sm" onClick={addCustomCategory} disabled={!newCategoryName.trim()}>Add</Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingCustom(false)}>Cancel</Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsAddingCustom(true)}
                                leftIcon={<Plus className="w-4 h-4" />}
                            >
                                Add Custom Category
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
