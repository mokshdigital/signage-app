'use client';

import { useState, useEffect } from 'react';
import { WorkOrderShipment } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { Card, Badge, LoadingSpinner } from '@/components/ui';
import { safeRender } from '@/lib/utils/helpers';

interface RecentShipmentsWidgetProps {
    limit?: number;
}

export default function RecentShipmentsWidget({ limit = 5 }: RecentShipmentsWidgetProps) {
    const [shipments, setShipments] = useState<WorkOrderShipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRecentShipments();
    }, [limit]);

    const fetchRecentShipments = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await workOrdersService.getRecentReceivedShipments(limit);
            setShipments(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load shipments');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
            ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    if (loading) {
        return (
            <Card title="Recent Shipments" className="min-h-[200px]">
                <div className="flex items-center justify-center h-32">
                    <LoadingSpinner />
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card title="Recent Shipments" className="min-h-[200px]">
                <div className="flex items-center justify-center h-32 text-red-500">
                    {error}
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="Recent Shipments Received"
            subtitle={`Last ${limit} received shipments`}
            className="h-full"
        >
            {shipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>No shipments received yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {shipments.map((shipment) => (
                        <div
                            key={shipment.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {safeRender(shipment.contents) || 'Shipment'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {shipment.tracking_id && (
                                        <span className="text-xs text-gray-500 font-mono bg-gray-200 px-1.5 py-0.5 rounded">
                                            #{safeRender(shipment.tracking_id).slice(0, 12)}
                                        </span>
                                    )}
                                    <Badge variant="success" size="sm">
                                        {safeRender(shipment.status_location)}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {shipment.received_by_name ? (
                                        <>
                                            Received by <span className="font-medium">{safeRender(shipment.received_by_name)}</span>
                                        </>
                                    ) : (
                                        'Received'
                                    )}
                                    {' · '}
                                    {formatDate(shipment.received_at)}
                                </p>
                            </div>
                            {shipment.receipt_photos && shipment.receipt_photos.length > 0 && (
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden">
                                        <img
                                            src={shipment.receipt_photos[0]}
                                            alt="Receipt"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {shipment.receipt_photos.length > 1 && (
                                        <span className="text-xs text-gray-400 mt-0.5 block text-center">
                                            +{shipment.receipt_photos.length - 1}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
