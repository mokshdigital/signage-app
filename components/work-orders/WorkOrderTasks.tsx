'use client';

import { useState, useEffect } from 'react';
import { WorkOrderTask, TaskChecklist, WorkOrderAssignment, WorkOrderCategory, TaskTag, TechnicianUser } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { Button, Card, Badge, Modal, Input, Textarea } from '@/components/ui';
import { toast } from '@/components/providers';
import {
    CheckSquare, Plus, User, AlertCircle, Clock,
    Calendar, ChevronDown, ChevronRight, X, UserPlus, Pencil, Trash2, MessageSquare, Tag, Folder
} from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { TaskCommentsPanel } from './TaskCommentsPanel';
import { CategorySelector } from './CategorySelector';
import { TagSelector } from './TagSelector';

// Helper to get initials
const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

// Task permissions type
export interface TaskPermissions {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    assign: boolean;
    status: boolean;
    block: boolean;
    comment: boolean;
    commentEditOwn: boolean;
    commentDeleteOwn: boolean;
    checklistAdd: boolean;
    checklistToggle: boolean;
    checklistEdit: boolean;
    checklistDelete: boolean;
}

// Default permissions (all true for backwards compatibility)
const defaultTaskPermissions: TaskPermissions = {
    view: true, create: true, edit: true, delete: true, assign: true, status: true, block: true,
    comment: true, commentEditOwn: true, commentDeleteOwn: true,
    checklistAdd: true, checklistToggle: true, checklistEdit: true, checklistDelete: true
};

export function WorkOrderTasks({ workOrderId, availableTechnicians = [], taskPermissions = defaultTaskPermissions }: { workOrderId: string, availableTechnicians?: TechnicianUser[], taskPermissions?: TaskPermissions }) {
    const [tasks, setTasks] = useState<WorkOrderTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Task comments panel state
    const [commentsTask, setCommentsTask] = useState<WorkOrderTask | null>(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await workOrdersService.getTasks(workOrderId);
            setTasks(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [workOrderId]);

    const handleTaskCreated = () => {
        setIsCreateOpen(false);
        fetchTasks();
    };

    return (
        <Card
            title="Tasks & Execution"
            headerActions={
                taskPermissions.create ? (
                    <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Task
                    </Button>
                ) : null
            }
        >
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-4 text-gray-500">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <CheckSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">No tasks added yet.</p>
                        {taskPermissions.create && (
                            <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(true)} className="text-blue-600 hover:text-blue-700">
                                Create your first task
                            </Button>
                        )}
                    </div>
                ) : (
                    tasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onUpdate={fetchTasks}
                            availableTechnicians={availableTechnicians}
                            onOpenComments={() => setCommentsTask(task)}
                            taskPermissions={taskPermissions}
                        />
                    ))
                )}
            </div>

            {/* Task Comments Panel */}
            {commentsTask && (
                <TaskCommentsPanel
                    isOpen={!!commentsTask}
                    onClose={() => setCommentsTask(null)}
                    task={commentsTask}
                    workOrderId={workOrderId}
                    canComment={taskPermissions.comment}
                    canEditOwn={taskPermissions.commentEditOwn}
                    canDeleteOwn={taskPermissions.commentDeleteOwn}
                />
            )}

            <CreateTaskModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                workOrderId={workOrderId}
                onCreated={handleTaskCreated}
            />
        </Card>
    );
}

function TaskItem({ task, onUpdate, availableTechnicians, onOpenComments, taskPermissions = defaultTaskPermissions }: { task: WorkOrderTask, onUpdate: () => void, availableTechnicians: TechnicianUser[], onOpenComments: () => void, taskPermissions?: TaskPermissions }) {
    const [expanded, setExpanded] = useState(false);
    const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
    const [loadingChecklists, setLoadingChecklists] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [commentCount, setCommentCount] = useState(0);

    // Category and Tags state
    const [category, setCategory] = useState<WorkOrderCategory | null>(null);
    const [tags, setTags] = useState<TaskTag[]>([]);
    const [editCategoryId, setEditCategoryId] = useState<string | null>(task.category_id);
    const [editTagIds, setEditTagIds] = useState<string[]>([]);

    const [editTaskData, setEditTaskData] = useState({
        name: task.name,
        description: task.description || '',
        priority: task.priority as string,
        due_date: task.due_date ? task.due_date.split('T')[0] : ''
    });

    // Fetch comment count, category, and tags on mount
    useEffect(() => {
        workOrdersService.getTaskCommentCount(task.id).then(setCommentCount);

        // Fetch category if task has one
        if (task.category_id) {
            workOrdersService.getCategories(task.work_order_id).then(cats => {
                const cat = cats.find(c => c.id === task.category_id);
                if (cat) setCategory(cat);
            });
        }

        // Fetch tags
        workOrdersService.getTaskTags(task.id).then(taskTags => {
            setTags(taskTags);
            setEditTagIds(taskTags.map(t => t.id));
        });
    }, [task.id, task.category_id, task.work_order_id]);

    // Fetch checklists when expanded
    useEffect(() => {
        if (expanded && checklists.length === 0) {
            fetchChecklists();
        }
    }, [expanded]);

    const fetchChecklists = async () => {
        try {
            setLoadingChecklists(true);
            const data = await workOrdersService.getTaskChecklists(task.id);
            setChecklists(data);
        } catch (err) {
            toast.error('Error loading checklists');
        } finally {
            setLoadingChecklists(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            await workOrdersService.updateTask(task.id, { status: newStatus as any });
            onUpdate();
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const toggleChecklist = async (item: TaskChecklist) => {
        try {
            // Optimistic update
            const updatedLists = checklists.map(c =>
                c.id === item.id ? { ...c, is_completed: !c.is_completed } : c
            );
            setChecklists(updatedLists);

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await workOrdersService.toggleChecklistItem(item.id, !item.is_completed, user.id);
            // In a real app we might fetch user profile to update "completed_by" UI immediately,
            // but for now re-fetch is safer or just leave optimistic.
            // Let's refetch to get the proper profile info if completed
            fetchChecklists();
            // Also need to update parent task progress
            onUpdate();
        } catch (err) {
            toast.error('Failed to toggle item');
            fetchChecklists(); // Revert
        }
    };

    const deleteChecklist = async (id: string) => {
        if (!confirm('Delete this item?')) return;
        try {
            await workOrdersService.deleteChecklistItem(id);
            setChecklists(checklists.filter(c => c.id !== id));
            onUpdate();
        } catch (err) {
            toast.error('Failed to delete item');
        }
    };

    const addChecklist = async (content: string) => {
        try {
            const newItem = await workOrdersService.createChecklistItem({
                task_id: task.id,
                content,
                sort_order: checklists.length
            });
            setChecklists([...checklists, newItem]);
            onUpdate();
        } catch (err) {
            toast.error('Failed to add item');
        }
    };

    const saveTaskEdit = async () => {
        try {
            // Update task basic info and category
            await workOrdersService.updateTask(task.id, {
                name: editTaskData.name,
                description: editTaskData.description || null,
                priority: editTaskData.priority as any,
                due_date: editTaskData.due_date || null
            });

            // Update category separately
            await workOrdersService.setTaskCategory(task.id, editCategoryId);

            // Update tags
            await workOrdersService.assignTagsToTask(task.id, editTagIds);

            toast.success('Task updated');
            setIsEditingTask(false);
            onUpdate();
        } catch (err) {
            toast.error('Failed to update task');
        }
    };

    // Calculate progress (local if loaded, else from prop if we trusted the parent calculation, but parent might be stale if we just toggled locally)
    const progress = task.progress || 0;
    // Actually task.progress is from the parent map.

    const priorityColors: any = {
        Low: 'bg-gray-100 text-gray-800',
        Medium: 'bg-blue-100 text-blue-800',
        High: 'bg-orange-100 text-orange-800',
        Emergency: 'bg-red-100 text-red-800'
    };

    const statusColors: any = {
        Pending: 'bg-gray-100 text-gray-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        Done: 'bg-green-100 text-green-800',
        Blocked: 'bg-red-100 text-red-800'
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Header */}
            <div className="p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpanded(!expanded)}>
                <button className="mt-1 text-gray-400">
                    {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className={`text-base font-medium ${task.status === 'Done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {task.name}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                                {task.priority}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status] || 'bg-gray-100'}`}>
                                {task.status}
                            </span>
                        </div>
                    </div>
                    {task.description && <p className={`text-sm text-gray-500 mt-1 ${expanded ? '' : 'line-clamp-3'}`}>{task.description}</p>}

                    {/* Category and Tags */}
                    {(category || tags.length > 0) && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {category && (
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-white"
                                    style={{ backgroundColor: category.color }}
                                >
                                    <Folder className="w-3 h-3" />
                                    {category.name}
                                </span>
                            )}
                            {tags.map(tag => (
                                <span
                                    key={tag.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                    style={{ backgroundColor: tag.color }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        {task.due_date && (
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{format(new Date(task.due_date), 'MMM d')}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            {/* Assignees avatars */}
                            {task.assignments && task.assignments.length > 0 ? (
                                <div className="flex -space-x-1">
                                    {task.assignments.map(a => (
                                        <div key={a.id} className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] ring-1 ring-white" title={a.user_profile?.display_name}>
                                            {getInitials(a.user_profile?.display_name)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-gray-400 italic">Unassigned</span>
                            )}
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-2 flex-1 max-w-[120px]">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span>{progress}%</span>
                        </div>

                        {/* Comments Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenComments();
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-colors"
                            title="View comments"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {commentCount > 0 && (
                                <span className="text-xs font-medium">{commentCount}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
                    {/* Status Controls */}
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex gap-2">
                            {/* Status buttons - regular statuses for users with status permission */}
                            {taskPermissions.status && (
                                <>
                                    {['Pending', 'In Progress', 'Done'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleStatusChange(s)}
                                            className={`px-3 py-1 rounded border transition-colors ${task.status === s
                                                ? 'bg-white border-blue-500 text-blue-600 shadow-sm font-medium'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </>
                            )}
                            {/* Blocked button - only for users with block permission */}
                            {taskPermissions.block && (
                                <button
                                    onClick={() => handleStatusChange('Blocked')}
                                    className={`px-3 py-1 rounded border transition-colors ${task.status === 'Blocked'
                                        ? 'bg-white border-red-500 text-red-600 shadow-sm font-medium'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    Blocked
                                </button>
                            )}
                            {/* Show current status read-only if no permissions */}
                            {!taskPermissions.status && !taskPermissions.block && (
                                <span className="px-3 py-1 text-gray-500 italic">Status: {task.status}</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {taskPermissions.edit && (
                                <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600" onClick={() => setIsEditingTask(true)}>
                                    <span className="text-xs">Edit Task</span>
                                </Button>
                            )}
                            {taskPermissions.delete && (
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => {
                                    if (confirm('Delete task?')) {
                                        workOrdersService.deleteTask(task.id).then(onUpdate);
                                    }
                                }}>
                                    <span className="text-xs">Delete Task</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Block reason if Blocked - only editable with block permission */}
                    {task.status === 'Blocked' && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-md">
                            <label className="text-xs font-medium text-red-800 block mb-1">Reason for Blocking</label>
                            {taskPermissions.block ? (
                                <Input
                                    value={task.block_reason || ''}
                                    onChange={(e) => {
                                        // Debounce or Blur save ideally.
                                    }}
                                    onBlur={(e) => {
                                        workOrdersService.updateTask(task.id, { block_reason: e.target.value });
                                    }}
                                    placeholder="Why is this blocked?"
                                    className="bg-white border-red-200"
                                />
                            ) : (
                                <p className="text-sm text-red-700">{task.block_reason || 'No reason provided'}</p>
                            )}
                        </div>
                    )}

                    {/* Checklists */}
                    <div className="bg-white rounded border border-gray-200 p-4">
                        <h5 className="font-medium text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-gray-500" />
                            Checklist Items
                        </h5>

                        {loadingChecklists ? (
                            <div className="text-sm text-gray-500">Loading checklist...</div>
                        ) : (
                            <ul className="space-y-2 mb-3">
                                {checklists.map(item => (
                                    <ChecklistItemRow
                                        key={item.id}
                                        item={item}
                                        onToggle={taskPermissions.checklistToggle ? () => toggleChecklist(item) : undefined}
                                        onDelete={taskPermissions.checklistDelete ? () => deleteChecklist(item.id) : undefined}
                                        onUpdate={taskPermissions.checklistEdit ? (newContent) => {
                                            workOrdersService.updateChecklistItem(item.id, newContent).then(() => {
                                                setChecklists(checklists.map(c => c.id === item.id ? { ...c, content: newContent } : c));
                                            });
                                        } : undefined}
                                    />
                                ))}
                            </ul>
                        )}

                        {/* Add checklist item - only with checklistAdd permission */}
                        {taskPermissions.checklistAdd && (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add checklist item..."
                                    id={`new-item-${task.id}`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addChecklist(e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                    className="text-sm"
                                />
                                {/* Templates Dropdown could go here */}
                                <TemplateSelector onSelect={async (templateId) => {
                                    await workOrdersService.applyTemplateToTask(task.id, templateId);
                                    fetchChecklists();
                                    onUpdate();
                                }} />
                            </div>
                        )}
                    </div>

                    {/* Assignees */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Assigned Techs:</span>
                        <div className="flex gap-1 flex-wrap">
                            {(availableTechnicians || [])
                                .filter(t => task.assignments?.some(a => a.user_profile_id === t.id))
                                .map(tech => (
                                    <Badge key={tech.id} variant="default" className="text-xs">
                                        {tech.display_name}
                                        {taskPermissions.assign && (
                                            <button className="ml-1 hover:text-red-500" onClick={() => {
                                                const newIds = task.assignments!.filter(a => a.user_profile_id !== tech.id).map(a => a.user_profile_id);
                                                workOrdersService.assignTask(task.id, newIds).then(onUpdate);
                                            }}>×</button>
                                        )}
                                    </Badge>
                                ))
                            }
                            {taskPermissions.assign && (
                                <div className="relative group">
                                    <Button variant="secondary" size="sm" className="h-6 px-2 text-xs">
                                        + Assign
                                    </Button>
                                    {/* Simple Dropdown for assignment */}
                                    <div className="absolute bottom-full left-0 mb-1 w-48 bg-white border border-gray-200 shadow-lg rounded-md hidden group-hover:block z-10 p-1">
                                        {availableTechnicians.length === 0 ? <div className="p-2 text-xs text-gray-500">No techs available</div> :
                                            availableTechnicians.map(t => {
                                                const currentIds = task.assignments?.map(a => a.user_profile_id) || [];
                                                const isAssigned = currentIds.includes(t.id);
                                                return (
                                                    <button
                                                        key={t.id}
                                                        className={`w-full text-left px-2 py-1.5 text-xs rounded truncate flex items-center justify-between ${isAssigned
                                                            ? 'bg-green-50 text-green-700 font-medium'
                                                            : 'hover:bg-gray-100'
                                                            }`}
                                                        onClick={() => {
                                                            if (!isAssigned) {
                                                                workOrdersService.assignTask(task.id, [...currentIds, t.id]).then(onUpdate);
                                                            }
                                                        }}
                                                    >
                                                        <span>{t.display_name}</span>
                                                        {isAssigned && <span className="text-green-600">✓</span>}
                                                    </button>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* Edit Task Modal */}
            <Modal isOpen={isEditingTask} onClose={() => setIsEditingTask(false)} title="Edit Task">
                <div className="space-y-4">
                    <Input
                        label="Task Name"
                        value={editTaskData.name}
                        onChange={e => setEditTaskData({ ...editTaskData, name: e.target.value })}
                    />
                    <Textarea
                        label="Description"
                        value={editTaskData.description}
                        onChange={e => setEditTaskData({ ...editTaskData, description: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <select
                                className="w-full border rounded p-2"
                                value={editTaskData.priority}
                                onChange={e => setEditTaskData({ ...editTaskData, priority: e.target.value })}
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                                <option>Emergency</option>
                            </select>
                        </div>
                        <Input
                            label="Due Date"
                            type="date"
                            value={editTaskData.due_date}
                            onChange={e => setEditTaskData({ ...editTaskData, due_date: e.target.value })}
                        />
                    </div>

                    {/* Category Selector */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <CategorySelector
                            workOrderId={task.work_order_id}
                            value={editCategoryId}
                            onChange={setEditCategoryId}
                        />
                    </div>

                    {/* Tag Selector */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Tags</label>
                        <TagSelector
                            taskId={task.id}
                            value={editTagIds}
                            onChange={setEditTagIds}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setIsEditingTask(false)}>Cancel</Button>
                        <Button onClick={saveTaskEdit}>Save Changes</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function CreateTaskModal({ isOpen, onClose, workOrderId, onCreated }: { isOpen: boolean, onClose: () => void, workOrderId: string, onCreated: () => void }) {
    const [data, setData] = useState({ name: '', description: '', priority: 'Medium', due_date: '' });
    const [categoryId, setCategoryId] = useState<string | null>(null);
    const [tagIds, setTagIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!data.name) return;
        try {
            setIsSubmitting(true);

            // Create the task first
            const newTask = await workOrdersService.createTask({
                work_order_id: workOrderId,
                ...data,
                priority: data.priority as any
            });

            // Set category if selected
            if (categoryId) {
                await workOrdersService.setTaskCategory(newTask.id, categoryId);
            }

            // Assign tags if any selected
            if (tagIds.length > 0) {
                await workOrdersService.assignTagsToTask(newTask.id, tagIds);
            }

            toast.success('Task created');

            // Reset form
            setData({ name: '', description: '', priority: 'Medium', due_date: '' });
            setCategoryId(null);
            setTagIds([]);

            onCreated();
        } catch (e) {
            toast.error('Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
            <div className="space-y-4">
                <Input label="Task Name" value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. Install Channel Letters" />
                <Textarea label="Description" value={data.description} onChange={e => setData({ ...data, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <select className="w-full border rounded p-2" value={data.priority} onChange={e => setData({ ...data, priority: e.target.value })}>
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                            <option>Emergency</option>
                        </select>
                    </div>
                    <Input label="Due Date" type="date" value={data.due_date} onChange={e => setData({ ...data, due_date: e.target.value })} />
                </div>

                {/* Category Selector */}
                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <CategorySelector
                        workOrderId={workOrderId}
                        value={categoryId}
                        onChange={setCategoryId}
                    />
                </div>

                {/* Tag Selector */}
                <div>
                    <label className="block text-sm font-medium mb-1">Tags</label>
                    <TagSelector
                        taskId=""
                        value={tagIds}
                        onChange={setTagIds}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !data.name}>
                        {isSubmitting ? 'Creating...' : 'Create Task'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

function TemplateSelector({ onSelect }: { onSelect: (id: string) => void }) {
    const [templates, setTemplates] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        workOrdersService.getChecklistTemplates().then(setTemplates).catch(console.error);
    }, []);

    if (templates.length === 0) return null;

    return (
        <select
            className="text-sm border border-gray-200 rounded px-2 py-2 max-w-[150px]"
            onChange={(e) => {
                if (e.target.value) {
                    onSelect(e.target.value);
                    e.target.value = ''; // Reset
                }
            }}
        >
            <option value="">+ Add from Template...</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
    );
}

function ChecklistItemRow({
    item,
    onToggle,
    onDelete,
    onUpdate
}: {
    item: TaskChecklist,
    onToggle?: () => void,
    onDelete?: () => void,
    onUpdate?: (newContent: string) => void
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.content);

    const handleSave = () => {
        if (editValue.trim() && editValue !== item.content && onUpdate) {
            onUpdate(editValue.trim());
        }
        setIsEditing(false);
    };

    return (
        <li className="flex items-start gap-3 text-sm py-1.5 px-2 -mx-2 rounded hover:bg-gray-50 group">
            <input
                type="checkbox"
                checked={item.is_completed}
                onChange={onToggle}
                disabled={!onToggle}
                className={`mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${!onToggle ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') {
                                setEditValue(item.content);
                                setIsEditing(false);
                            }
                        }}
                        autoFocus
                        className="w-full text-sm border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                ) : (
                    <>
                        <span className={`${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {item.content}
                        </span>
                        {item.is_completed && item.completed_by && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                Completed by {item.completed_by.display_name?.split(' ')[0]}
                                {item.completed_at && ` on ${format(new Date(item.completed_at), 'MMM d, p')}`}
                            </p>
                        )}
                    </>
                )}
            </div>
            {!isEditing && (
                <div className="flex items-center gap-1">
                    {onUpdate && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}
        </li>
    );
}
