'use client';

import { useState, useEffect, useRef } from 'react';
import { TaskTag } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { ChevronDown, Plus, X, Check } from 'lucide-react';

// Preset colors for tags
const PRESET_COLORS = [
    '#10B981', // Green
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6B7280', // Gray
];

interface TagSelectorProps {
    taskId: string;
    value: string[]; // Tag IDs
    onChange: (tagIds: string[]) => void;
    disabled?: boolean;
}

export function TagSelector({ taskId, value, onChange, disabled }: TagSelectorProps) {
    const [allTags, setAllTags] = useState<TaskTag[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTags();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchTags = async () => {
        const data = await workOrdersService.getAllTags();
        setAllTags(data);
    };

    const handleToggleTag = (tagId: string) => {
        if (value.includes(tagId)) {
            onChange(value.filter(id => id !== tagId));
        } else {
            onChange([...value, tagId]);
        }
    };

    const handleRemoveTag = (tagId: string) => {
        onChange(value.filter(id => id !== tagId));
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;

        try {
            const tag = await workOrdersService.createTag(newName.trim(), newColor);
            await fetchTags();
            onChange([...value, tag.id]);
            setNewName('');
            setNewColor(PRESET_COLORS[0]);
            setIsCreating(false);
            setSearchQuery('');
        } catch (err) {
            console.error('Failed to create tag:', err);
        }
    };

    const selectedTags = allTags.filter(t => value.includes(t.id));
    const filteredTags = allTags.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Selected Tags Display */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`min-h-[38px] w-full flex flex-wrap items-center gap-1.5 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {selectedTags.length > 0 ? (
                    selectedTags.map(tag => (
                        <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                        >
                            {tag.name}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTag(tag.id);
                                }}
                                className="hover:bg-white/20 rounded-full p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))
                ) : (
                    <span className="text-gray-500 py-0.5">Select tags...</span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-72 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tags..."
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                        />
                    </div>

                    {/* Tag list */}
                    <div className="max-h-40 overflow-y-auto">
                        {filteredTags.length === 0 && !isCreating ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                No tags found. Create one below.
                            </div>
                        ) : (
                            filteredTags.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => handleToggleTag(tag.id)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span>{tag.name}</span>
                                    </div>
                                    {value.includes(tag.id) && (
                                        <Check className="w-4 h-4 text-blue-500" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Create new */}
                    {isCreating ? (
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Tag name..."
                                autoFocus
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded mb-2 bg-white dark:bg-gray-900"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                    if (e.key === 'Escape') setIsCreating(false);
                                }}
                            />
                            <div className="flex flex-wrap gap-1 mb-2">
                                {PRESET_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setNewColor(color)}
                                        className={`w-5 h-5 rounded-full border-2 ${newColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700"
                        >
                            <Plus className="w-4 h-4" />
                            Create new tag
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default TagSelector;
