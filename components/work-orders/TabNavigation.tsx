'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface TabConfig {
    id: string;
    label: string;
    badge?: number;
    disabled?: boolean;
    icon?: React.ReactNode;
}

interface TabNavigationProps {
    tabs: TabConfig[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    children?: React.ReactNode;
    renderTabContent?: (tabId: string) => React.ReactNode;
}

export function TabNavigation({
    tabs,
    activeTab,
    onTabChange,
    children,
    renderTabContent
}: TabNavigationProps) {
    // For mobile accordion
    const [expandedTabs, setExpandedTabs] = useState<string[]>([activeTab]);

    const toggleAccordion = (tabId: string) => {
        setExpandedTabs(prev =>
            prev.includes(tabId)
                ? prev.filter(id => id !== tabId)
                : [...prev, tabId]
        );
    };

    return (
        <>
            {/* Desktop Tab Bar */}
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

            {/* Mobile Accordion */}
            <div className="md:hidden space-y-2">
                {tabs.map((tab) => (
                    <div key={tab.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                            onClick={() => !tab.disabled && toggleAccordion(tab.id)}
                            disabled={tab.disabled}
                            className={`
                w-full flex items-center justify-between px-4 py-3 text-left
                ${tab.disabled
                                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-gray-50'
                                }
              `}
                        >
                            <span className="flex items-center gap-2 font-medium">
                                {tab.icon}
                                {tab.label}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        {tab.badge}
                                    </span>
                                )}
                                {tab.disabled && (
                                    <span className="text-xs text-gray-400">(Coming Soon)</span>
                                )}
                            </span>
                            {!tab.disabled && (
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedTabs.includes(tab.id) ? 'rotate-180' : ''
                                        }`}
                                />
                            )}
                        </button>
                        {!tab.disabled && expandedTabs.includes(tab.id) && renderTabContent && (
                            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                                {renderTabContent(tab.id)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
}
