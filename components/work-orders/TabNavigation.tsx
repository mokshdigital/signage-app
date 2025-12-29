'use client';

import { useState } from 'react';
import { ChevronDown, ClipboardList, FolderOpen, Users, MessageCircle, Package, Settings, UserCheck, MoreHorizontal, X } from 'lucide-react';

export interface TabConfig {
    id: string;
    label: string;
    badge?: number;
    disabled?: boolean;
    icon?: React.ReactNode;
    className?: string;
    priority?: boolean; // Show in bottom bar on mobile
}

interface TabNavigationProps {
    tabs: TabConfig[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    children?: React.ReactNode;
    renderTabContent?: (tabId: string) => React.ReactNode;
}

// Default icons for tabs if not provided
const defaultIcons: Record<string, React.ReactNode> = {
    'tasks': <ClipboardList className="w-5 h-5" />,
    'files': <FolderOpen className="w-5 h-5" />,
    'team': <MessageCircle className="w-5 h-5" />,
    'technicians': <UserCheck className="w-5 h-5" />,
    'requirements': <Settings className="w-5 h-5" />,
    'shipments': <Package className="w-5 h-5" />,
    'client-hub': <Users className="w-5 h-5" />,
};

// Priority tabs to show in mobile bottom bar (max 4 + More)
const MOBILE_PRIORITY_TABS = ['tasks', 'files', 'team', 'technicians'];

export function TabNavigation({
    tabs,
    activeTab,
    onTabChange,
    children,
    renderTabContent
}: TabNavigationProps) {
    // For "More" sheet on mobile
    const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

    // Split tabs into priority (bottom bar) and overflow (More menu)
    const priorityTabs = tabs.filter(tab => MOBILE_PRIORITY_TABS.includes(tab.id) && !tab.disabled);
    const overflowTabs = tabs.filter(tab => !MOBILE_PRIORITY_TABS.includes(tab.id));

    const getIcon = (tab: TabConfig) => {
        return tab.icon || defaultIcons[tab.id] || <ClipboardList className="w-5 h-5" />;
    };

    // Check if active tab is in overflow
    const isActiveInOverflow = overflowTabs.some(tab => tab.id === activeTab);

    return (
        <>
            {/* ═══════════════════════════════════════════════════════════════════
                DESKTOP: Horizontal Tab Bar (hidden on mobile)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block border-b border-gray-200 bg-white sticky top-[140px] z-10">
                <nav className="flex overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => !tab.disabled && onTabChange(tab.id)}
                            disabled={tab.disabled}
                            className={`
                                whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : tab.disabled
                                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                                ${tab.className || ''}
                            `}
                        >
                            <span className="flex items-center gap-2">
                                {tab.icon}
                                {tab.label}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className={`
                                        ml-1 px-2 py-0.5 rounded-full text-xs font-medium
                                        ${activeTab === tab.id
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-gray-100 text-gray-600'
                                        }
                                    `}>
                                        {tab.badge}
                                    </span>
                                )}
                                {tab.disabled && (
                                    <span className="text-xs text-gray-400">(Soon)</span>
                                )}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Desktop Tab Content */}
            <div className="hidden md:block">
                {children}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE: Tab Content (full screen, above bottom bar)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden pb-20">
                {/* Current active tab content */}
                <div className="p-4">
                    {renderTabContent && renderTabContent(activeTab)}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE: Fixed Bottom Tab Bar
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <nav className="flex justify-around items-center h-16">
                    {/* Priority tabs */}
                    {priorityTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                                flex flex-col items-center justify-center flex-1 h-full gap-1 relative
                                ${activeTab === tab.id
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }
                            `}
                        >
                            {/* Icon with badge */}
                            <div className="relative">
                                {getIcon(tab)}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold bg-blue-500 text-white flex items-center justify-center">
                                        {tab.badge > 99 ? '99+' : tab.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{tab.label}</span>
                            {/* Active indicator */}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-t-full" />
                            )}
                        </button>
                    ))}

                    {/* More button (for overflow tabs) */}
                    {overflowTabs.length > 0 && (
                        <button
                            onClick={() => setIsMoreSheetOpen(true)}
                            className={`
                                flex flex-col items-center justify-center flex-1 h-full gap-1 relative
                                ${isActiveInOverflow
                                    ? 'text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }
                            `}
                        >
                            <MoreHorizontal className="w-5 h-5" />
                            <span className="text-xs font-medium">More</span>
                            {isActiveInOverflow && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-t-full" />
                            )}
                        </button>
                    )}
                </nav>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                MOBILE: "More" Bottom Sheet
            ═══════════════════════════════════════════════════════════════════ */}
            {isMoreSheetOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-50"
                        onClick={() => setIsMoreSheetOpen(false)}
                    />

                    {/* Sheet */}
                    <div
                        className="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[70vh] overflow-y-auto"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        {/* Handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">More Options</h3>
                            <button
                                onClick={() => setIsMoreSheetOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Overflow tab options */}
                        <div className="py-2">
                            {overflowTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        if (!tab.disabled) {
                                            onTabChange(tab.id);
                                            setIsMoreSheetOpen(false);
                                        }
                                    }}
                                    disabled={tab.disabled}
                                    className={`
                                        w-full flex items-center gap-4 px-5 py-4 text-left
                                        ${activeTab === tab.id
                                            ? 'bg-blue-50 text-blue-700'
                                            : tab.disabled
                                                ? 'text-gray-300 cursor-not-allowed'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }
                                        ${tab.className || ''}
                                    `}
                                >
                                    <div className={`
                                        ${activeTab === tab.id ? 'text-blue-600' : tab.disabled ? 'text-gray-300' : 'text-gray-400'}
                                    `}>
                                        {getIcon(tab)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{tab.label}</p>
                                        {tab.disabled && (
                                            <p className="text-xs text-gray-400">Coming Soon</p>
                                        )}
                                    </div>
                                    {tab.badge !== undefined && tab.badge > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            {tab.badge}
                                        </span>
                                    )}
                                    {activeTab === tab.id && (
                                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
