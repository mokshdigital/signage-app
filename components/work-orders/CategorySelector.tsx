'use client';

import { useState, useEffect, useRef } from 'react';
import { WorkOrderCategory } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { ChevronDown, Plus, Check } from 'lucide-react';

// Preset colors for categories
const PRESET_COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#6B7280', // Gray
];

interface CategorySelectorProps {
    workOrderId: string;
    value: string | null;
    onChange: (categoryId: string | null) => void;
    disabled?: boolean;
}

export function CategorySelector({ workOrderId, value, onChange, disabled }: CategorySelectorProps) {
    const [categories, setCategories] = useState<WorkOrderCategory[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchCategories();
    }, [workOrderId]);

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

    const fetchCategories = async () => {
        const data = await workOrdersService.getCategories(workOrderId);
        setCategories(data);
    };

    const handleSelect = (categoryId: string | null) => {
        onChange(categoryId);
        setIsOpen(false);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;

        try {
            const category = await workOrdersService.createCategory(workOrderId, newName.trim(), newColor);
            await fetchCategories();
            onChange(category.id);
            setNewName('');
            setNewColor(PRESET_COLORS[0]);
            setIsCreating(false);
            setIsOpen(false);
        } catch (err) {
            console.error('Failed to create category:', err);
        }
    };

    const selectedCategory = categories.find(c => c.id === value);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {selectedCategory ? (
                    <div className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedCategory.color }}
                        />
                        <span>{selectedCategory.name}</span>
                    </div>
                ) : (
                    <span className="text-gray-500">Select category...</span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {/* Clear option */}
                    {value && (
                        <button
                            onClick={() => handleSelect(null)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                        >
                            Clear selection
                        </button>
                    )}

                    {/* Existing categories */}
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => handleSelect(category.id)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: category.color }}
                                />
                                <span>{category.name}</span>
                            </div>
                            {category.id === value && (
                                <Check className="w-4 h-4 text-blue-500" />
                            )}
                        </button>
                    ))}

                    {/* Create new */}
                    {isCreating ? (
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Category name..."
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
                            Create new category
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default CategorySelector;
