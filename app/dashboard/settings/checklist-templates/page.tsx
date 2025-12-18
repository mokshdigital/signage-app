'use client';

import { useState, useEffect } from 'react';
import { workOrdersService } from '@/services';
import { ChecklistTemplate, ChecklistTemplateItem } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/components/providers';
import { Plus, Trash2, Edit2, GripVertical, CheckSquare } from 'lucide-react';

export default function ChecklistTemplatesPage() {
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    // const { toast } = useToast(); -> Removed

    // Fetch templates
    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await workOrdersService.getChecklistTemplates();
            setTemplates(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleCreate = async () => {
        if (!formData.name.trim()) return;
        try {
            await workOrdersService.createChecklistTemplate(formData);
            toast.success('Template created successfully');
            setIsCreateModalOpen(false);
            setFormData({ name: '', description: '' });
            fetchTemplates();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await workOrdersService.deleteChecklistTemplate(id);
            toast.success('Template deleted');
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">Checklist Templates</h2>
                    <p className="text-sm text-gray-500">Create reusable checklists for work orders.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                </Button>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No templates</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new checklist template.</p>
                    <div className="mt-6">
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Template
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                        <Card key={template.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                                        {template.description && (
                                            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setEditingTemplate(template)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Checklist Items ({template.items?.length || 0})
                                    </div>
                                    <ul className="space-y-1">
                                        {template.items?.slice(0, 3).map((item, idx) => (
                                            <li key={item.id} className="text-sm text-gray-600 flex items-start gap-2">
                                                <span className="text-gray-400 mt-1">•</span>
                                                <span className="line-clamp-1">{item.content}</span>
                                            </li>
                                        ))}
                                        {(template.items?.length || 0) > 3 && (
                                            <li className="text-xs text-blue-500 pt-1">
                                                + {(template.items?.length || 0) - 3} more items
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setEditingTemplate(template)}
                                >
                                    Manage Items
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Checklist Template"
            >
                <div className="space-y-4">
                    <Input
                        label="Template Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Standard Installation"
                    />
                    <Textarea
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of this template..."
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>
                            Create Template
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit/Manage Items Modal */}
            {editingTemplate && (
                <TemplateEditorModal
                    template={editingTemplate}
                    onClose={() => {
                        setEditingTemplate(null);
                        fetchTemplates();
                    }}
                />
            )}
        </div>
    );
}

function TemplateEditorModal({ template, onClose }: { template: ChecklistTemplate; onClose: () => void }) {
    const [items, setItems] = useState<ChecklistTemplateItem[]>(template.items || []);
    const [newItemContent, setNewItemContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddItem = async () => {
        if (!newItemContent.trim()) return;
        try {
            setLoading(true); // Optimistic UI could be better but sticking to safe simple logic
            const newItem = await workOrdersService.createChecklistTemplateItem({
                template_id: template.id,
                content: newItemContent,
                sort_order: items.length // Simple append
            });
            setItems([...items, newItem]);
            setNewItemContent('');
        } catch (error) {
            toast.error('Failed to add item');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            await workOrdersService.deleteChecklistTemplateItem(itemId);
            setItems(items.filter(i => i.id !== itemId));
        } catch (error) {
            toast.error('Failed to delete item');
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Edit Template: ${template.name}`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Add Item Form */}
                <div className="flex gap-2">
                    <Input
                        value={newItemContent}
                        onChange={(e) => setNewItemContent(e.target.value)}
                        placeholder="Add new checklist item..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="flex-1"
                    />
                    <Button onClick={handleAddItem} disabled={loading || !newItemContent.trim()}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Items List */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 min-h-[200px] max-h-[400px] overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <p className="text-center text-gray-400 py-8">No items yet. Add one above!</p>
                    ) : (
                        <ul className="space-y-2">
                            {items.map((item, index) => (
                                <li key={item.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400 font-mono w-4">{index + 1}.</span>
                                        <span className="text-gray-800">{item.content}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button onClick={onClose}>
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
