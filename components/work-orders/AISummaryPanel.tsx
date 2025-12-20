'use client';

import { useState } from 'react';
import { X, ExternalLink, MapPin, Users, Clock, AlertTriangle, HelpCircle, Wrench, FileText, Shield } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { safeRender } from '@/lib/utils/helpers';

interface AISummaryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: any;
    workOrderNumber?: string;
}

export function AISummaryPanel({ isOpen, onClose, analysis, workOrderNumber }: AISummaryPanelProps) {
    if (!isOpen) return null;

    const hasData = analysis && Object.keys(analysis).length > 0;

    const renderArrayOrString = (value: any) => {
        if (!value) return null;
        if (Array.isArray(value)) {
            return value.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                    {value.map((item, i) => (
                        <li key={i} className="text-gray-700">{safeRender(item)}</li>
                    ))}
                </ul>
            ) : null;
        }
        return <p className="text-gray-700">{safeRender(value)}</p>;
    };

    const renderBadgeArray = (items: string[] | undefined, variant: 'default' | 'info' | 'warning' | 'success' = 'default') => {
        if (!items || items.length === 0) return <span className="text-gray-400 italic text-sm">Not specified</span>;
        return (
            <div className="flex flex-wrap gap-2">
                {items.map((item, i) => (
                    <Badge key={i} variant={variant}>{item}</Badge>
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Slide-out Panel */}
            <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <span className="text-xl">✨</span>
                            AI Analysis Summary
                        </h2>
                        {workOrderNumber && (
                            <p className="text-sm text-gray-500">WO: {workOrderNumber}</p>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <span className="text-4xl mb-4">🤖</span>
                            <p className="text-lg font-medium">No AI Analysis Available</p>
                            <p className="text-sm">This work order hasn't been processed by AI yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* Job Overview */}
                            {(analysis.jobType || analysis.location) && (
                                <Section title="Job Overview" icon={<FileText className="w-4 h-4" />}>
                                    {analysis.jobType && (
                                        <InfoRow label="Job Type" value={analysis.jobType} />
                                    )}
                                    {analysis.location && (
                                        <InfoRow label="Location" value={analysis.location} icon={<MapPin className="w-4 h-4" />} />
                                    )}
                                </Section>
                            )}

                            {/* Client Information */}
                            {(analysis.orderedBy || analysis.contactInfo) && (
                                <Section title="Client Information" icon={<Users className="w-4 h-4" />}>
                                    {analysis.orderedBy && (
                                        <InfoRow label="Ordered By" value={analysis.orderedBy} />
                                    )}
                                    {analysis.contactInfo && (
                                        <InfoRow label="Contact" value={analysis.contactInfo} />
                                    )}
                                </Section>
                            )}

                            {/* Resource Requirements */}
                            {analysis.resourceRequirements && (
                                <Section title="Resource Requirements" icon={<Wrench className="w-4 h-4" />}>
                                    {analysis.resourceRequirements.techSkills && (
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-500 mb-1">Required Skills</p>
                                            {renderBadgeArray(analysis.resourceRequirements.techSkills, 'info')}
                                        </div>
                                    )}
                                    {analysis.resourceRequirements.equipment && (
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-500 mb-1">Equipment</p>
                                            {renderBadgeArray(analysis.resourceRequirements.equipment, 'default')}
                                        </div>
                                    )}
                                    {analysis.resourceRequirements.vehicles && (
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">Vehicles</p>
                                            {renderBadgeArray(analysis.resourceRequirements.vehicles, 'default')}
                                        </div>
                                    )}
                                </Section>
                            )}

                            {/* Permits */}
                            {analysis.permitsRequired && analysis.permitsRequired.length > 0 && (
                                <Section title="Permits Required" icon={<Shield className="w-4 h-4" />}>
                                    {renderBadgeArray(analysis.permitsRequired, 'warning')}
                                </Section>
                            )}

                            {/* Staffing & Timeline */}
                            {(analysis.numberOfTechs || analysis.estimatedHours || analysis.estimatedDays) && (
                                <Section title="Staffing & Timeline" icon={<Clock className="w-4 h-4" />}>
                                    {analysis.numberOfTechs && (
                                        <InfoRow label="Technicians" value={analysis.numberOfTechs} />
                                    )}
                                    {analysis.estimatedHours && (
                                        <InfoRow label="Estimated Hours" value={`${analysis.estimatedHours} hours`} />
                                    )}
                                    {analysis.estimatedDays && (
                                        <InfoRow label="Estimated Days" value={`${analysis.estimatedDays} days`} />
                                    )}
                                </Section>
                            )}

                            {/* Technical Requirements */}
                            {analysis.technicalRequirements && (
                                <Section title="Technical Requirements">
                                    <p className="text-gray-700 text-sm">{safeRender(analysis.technicalRequirements)}</p>
                                </Section>
                            )}

                            {/* Access Requirements */}
                            {analysis.accessRequirements && (
                                <Section title="Access Requirements">
                                    <p className="text-gray-700 text-sm">{safeRender(analysis.accessRequirements)}</p>
                                </Section>
                            )}

                            {/* Risk Factors */}
                            {analysis.riskFactors && analysis.riskFactors.length > 0 && (
                                <Section title="Risk Factors" icon={<AlertTriangle className="w-4 h-4 text-red-500" />} variant="danger">
                                    <ul className="space-y-2">
                                        {analysis.riskFactors.map((risk: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-red-700">
                                                <span className="text-red-500 mt-0.5">⚠️</span>
                                                <span className="text-sm">{safeRender(risk)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}

                            {/* Questions */}
                            {(analysis.clientQuestions?.length > 0 || analysis.technicianQuestions?.length > 0) && (
                                <Section title="Questions to Clarify" icon={<HelpCircle className="w-4 h-4" />}>
                                    {analysis.clientQuestions?.length > 0 && (
                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-gray-600 mb-1">For Client:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                {analysis.clientQuestions.map((q: string, i: number) => (
                                                    <li key={i}>{safeRender(q)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {analysis.technicianQuestions?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">For Technicians:</p>
                                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                                                {analysis.technicianQuestions.map((q: string, i: number) => (
                                                    <li key={i}>{safeRender(q)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </Section>
                            )}

                            {/* Scope of Work */}
                            {analysis.scope_of_work && (
                                <Section title="Scope of Work">
                                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{safeRender(analysis.scope_of_work)}</p>
                                </Section>
                            )}

                            {/* Suggested Tasks */}
                            {analysis.suggested_tasks && analysis.suggested_tasks.length > 0 && (
                                <Section title="Suggested Tasks">
                                    <ul className="space-y-2">
                                        {analysis.suggested_tasks.map((task: any, i: number) => (
                                            <li key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                                                <span className="text-blue-500">📋</span>
                                                <div>
                                                    <p className="font-medium text-sm">{safeRender(task.name || task)}</p>
                                                    {task.description && (
                                                        <p className="text-xs text-gray-500">{safeRender(task.description)}</p>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            )}

                            {/* Additional Details */}
                            {analysis.additionalDetails && (
                                <Section title="Additional Details">
                                    {typeof analysis.additionalDetails === 'object' ? (
                                        <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-x-auto">
                                            {JSON.stringify(analysis.additionalDetails, null, 2)}
                                        </pre>
                                    ) : (
                                        <p className="text-gray-700 text-sm">{safeRender(analysis.additionalDetails)}</p>
                                    )}
                                </Section>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <Button variant="secondary" className="w-full" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>

            {/* Animation styles */}
            <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
        </>
    );
}

// Helper Components
function Section({
    title,
    children,
    icon,
    variant = 'default'
}: {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    variant?: 'default' | 'danger';
}) {
    return (
        <div className={`
      p-4 rounded-lg border
      ${variant === 'danger' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}
    `}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                {icon}
                {title}
            </h3>
            {children}
        </div>
    );
}

function InfoRow({
    label,
    value,
    icon
}: {
    label: string;
    value: any;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2 mb-2 last:mb-0">
            {icon && <span className="text-gray-400 mt-0.5">{icon}</span>}
            <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-medium text-gray-900">{safeRender(value)}</p>
            </div>
        </div>
    );
}
