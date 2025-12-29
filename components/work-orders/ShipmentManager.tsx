'use client';

import { useState, useEffect } from 'react';
import { WorkOrderShipment, ReceiverOption } from '@/types/database';
import { workOrdersService } from '@/services/work-orders.service';
import { Button, Card, Badge, Modal, Input, LoadingSpinner } from '@/components/ui';
import { toast } from '@/components/providers';
import { safeRender } from '@/lib/utils/helpers';

interface ShipmentManagerProps {
    workOrderId: string;
    shipments: WorkOrderShipment[];
    onShipmentsChange: () => void;
    canManage?: boolean;
}

export default function ShipmentManager({ workOrderId, shipments, onShipmentsChange, canManage = true }: ShipmentManagerProps) {
    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingShipment, setEditingShipment] = useState<WorkOrderShipment | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        tracking_id: '',
        contents: '',
        status_location: 'In Transit',
        received_by_id: '',
        received_by_type: '' as 'technician' | 'office_staff' | '',
        received_at: '',
        notes: ''
    });

    // Photo upload state
    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);

    // Receiver options
    const [receiverOptions, setReceiverOptions] = useState<ReceiverOption[]>([]);
    const [loadingReceivers, setLoadingReceivers] = useState(false);

    // Loading states
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Fetch receiver options when modal opens
    useEffect(() => {
        if (isAddOpen || isEditOpen) {
            fetchReceiverOptions();
        }
    }, [isAddOpen, isEditOpen]);

    const fetchReceiverOptions = async () => {
        setLoadingReceivers(true);
        try {
            const options = await workOrdersService.getReceiverOptions();
            setReceiverOptions(options);
        } catch (error: any) {
            toast.error('Failed to load receiver options');
        } finally {
            setLoadingReceivers(false);
        }
    };

    const resetForm = () => {
        setFormData({
            tracking_id: '',
            contents: '',
            status_location: 'In Transit',
            received_by_id: '',
            received_by_type: '',
            received_at: '',
            notes: ''
        });
        setSelectedPhotos([]);
    };

    const handleOpenAdd = () => {
        resetForm();
        setIsAddOpen(true);
    };

    const handleOpenEdit = (shipment: WorkOrderShipment) => {
        setEditingShipment(shipment);
        setFormData({
            tracking_id: shipment.tracking_id || '',
            contents: shipment.contents || '',
            status_location: shipment.status_location || 'In Transit',
            received_by_id: shipment.received_by_id || '',
            received_by_type: shipment.received_by_type || '',
            received_at: shipment.received_at ? new Date(shipment.received_at).toISOString().slice(0, 16) : '',
            notes: shipment.notes || ''
        });
        setIsEditOpen(true);
    };

    const handleReceiverChange = (receiverId: string) => {
        const receiver = receiverOptions.find(r => r.id === receiverId);
        setFormData(prev => ({
            ...prev,
            received_by_id: receiverId,
            received_by_type: receiver?.type || ''
        }));
    };

    const handleAddShipment = async () => {
        if (!formData.contents) {
            toast.error('Please enter shipment contents');
            return;
        }

        setSaving(true);
        try {
            const newShipment = await workOrdersService.createShipment({
                work_order_id: workOrderId,
                tracking_id: formData.tracking_id || null,
                contents: formData.contents,
                status_location: formData.status_location,
                received_by_id: formData.received_by_id || null,
                received_by_type: (formData.received_by_type as 'technician' | 'office_staff') || null,
                received_at: formData.received_at ? new Date(formData.received_at).toISOString() : null,
                receipt_photos: null,
                notes: formData.notes || null
            });

            // Upload photos if any
            if (selectedPhotos.length > 0) {
                setUploadingPhotos(true);
                await workOrdersService.uploadShipmentPhotos(newShipment.id, selectedPhotos);
            }

            toast.success('Shipment added');
            setIsAddOpen(false);
            onShipmentsChange();
        } catch (error: any) {
            toast.error('Failed to add shipment', { description: error.message });
        } finally {
            setSaving(false);
            setUploadingPhotos(false);
        }
    };

    const handleUpdateShipment = async () => {
        if (!editingShipment) return;

        setSaving(true);
        try {
            await workOrdersService.updateShipment(editingShipment.id, {
                tracking_id: formData.tracking_id || null,
                contents: formData.contents || null,
                status_location: formData.status_location,
                received_by_id: formData.received_by_id || null,
                received_by_type: (formData.received_by_type as 'technician' | 'office_staff') || null,
                received_at: formData.received_at ? new Date(formData.received_at).toISOString() : null,
                notes: formData.notes || null
            });

            // Upload new photos if any
            if (selectedPhotos.length > 0) {
                setUploadingPhotos(true);
                await workOrdersService.uploadShipmentPhotos(editingShipment.id, selectedPhotos);
            }

            toast.success('Shipment updated');
            setIsEditOpen(false);
            onShipmentsChange();
        } catch (error: any) {
            toast.error('Failed to update shipment', { description: error.message });
        } finally {
            setSaving(false);
            setUploadingPhotos(false);
        }
    };

    const handleDeleteShipment = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this shipment?')) return;

        setDeleting(id);
        try {
            await workOrdersService.deleteShipment(id);
            toast.success('Shipment deleted');
            onShipmentsChange();
        } catch (error: any) {
            toast.error('Failed to delete shipment', { description: error.message });
        } finally {
            setDeleting(null);
        }
    };

    const isNotInTransit = formData.status_location.toLowerCase() !== 'in transit';

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    };

    const getStatusBadgeVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
        const lower = status.toLowerCase();
        if (lower === 'in transit') return 'warning';
        if (lower.includes('received') || lower.includes('delivered')) return 'success';
        if (lower.includes('warehouse') || lower.includes('office')) return 'info';
        return 'default';
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                    Shipments ({shipments.length})
                </h3>
                {canManage && (
                    <Button size="sm" onClick={handleOpenAdd}>
                        + Add Shipment
                    </Button>
                )}
            </div>

            {shipments.length === 0 ? (
                <Card className="text-center py-8">
                    <p className="text-gray-500">No shipments tracked for this work order</p>
                    {canManage && (
                        <Button size="sm" variant="ghost" onClick={handleOpenAdd} className="mt-2">
                            Add first shipment
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-3">
                    {shipments.map(shipment => (
                        <Card key={shipment.id} className="p-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant={getStatusBadgeVariant(shipment.status_location)} size="sm">
                                            {safeRender(shipment.status_location)}
                                        </Badge>
                                        {shipment.tracking_id && (
                                            <span className="text-sm text-gray-500 font-mono">
                                                #{safeRender(shipment.tracking_id)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-900 font-medium truncate">
                                        {safeRender(shipment.contents) || 'No description'}
                                    </p>
                                    {shipment.received_at && (
                                        <p className="text-sm text-green-600 mt-1">
                                            ✓ Received: {formatDate(shipment.received_at)}
                                            {shipment.received_by_name && (
                                                <span className="ml-1">by {safeRender(shipment.received_by_name)}</span>
                                            )}
                                        </p>
                                    )}
                                    {shipment.receipt_photos && shipment.receipt_photos.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {shipment.receipt_photos.map((url, idx) => (
                                                <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block w-12 h-12 rounded overflow-hidden border border-gray-200 hover:border-blue-400"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Receipt ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    {canManage && (
                                        <>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleOpenEdit(shipment)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteShipment(shipment.id)}
                                                loading={deleting === shipment.id}
                                            >
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Shipment Modal */}
            <Modal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Add Shipment"
                size="md"
            >
                <ShipmentForm
                    formData={formData}
                    setFormData={setFormData}
                    receiverOptions={receiverOptions}
                    loadingReceivers={loadingReceivers}
                    onReceiverChange={handleReceiverChange}
                    isNotInTransit={isNotInTransit}
                    selectedPhotos={selectedPhotos}
                    setSelectedPhotos={setSelectedPhotos}
                    existingPhotos={[]}
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                    <Button variant="secondary" onClick={() => setIsAddOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddShipment} loading={saving || uploadingPhotos}>
                        {uploadingPhotos ? 'Uploading Photos...' : 'Add Shipment'}
                    </Button>
                </div>
            </Modal>

            {/* Edit Shipment Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Shipment"
                size="md"
            >
                <ShipmentForm
                    formData={formData}
                    setFormData={setFormData}
                    receiverOptions={receiverOptions}
                    loadingReceivers={loadingReceivers}
                    onReceiverChange={handleReceiverChange}
                    isNotInTransit={isNotInTransit}
                    selectedPhotos={selectedPhotos}
                    setSelectedPhotos={setSelectedPhotos}
                    existingPhotos={editingShipment?.receipt_photos || []}
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                    <Button variant="secondary" onClick={() => setIsEditOpen(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateShipment} loading={saving || uploadingPhotos}>
                        {uploadingPhotos ? 'Uploading Photos...' : 'Save Changes'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

// Type for formData state
type ShipmentFormData = {
    tracking_id: string;
    contents: string;
    status_location: string;
    received_by_id: string;
    received_by_type: 'technician' | 'office_staff' | '';
    received_at: string;
    notes: string;
};

// Reusable form component
interface ShipmentFormProps {
    formData: ShipmentFormData;
    setFormData: React.Dispatch<React.SetStateAction<ShipmentFormData>>;
    receiverOptions: ReceiverOption[];
    loadingReceivers: boolean;
    onReceiverChange: (id: string) => void;
    isNotInTransit: boolean;
    selectedPhotos: File[];
    setSelectedPhotos: React.Dispatch<React.SetStateAction<File[]>>;
    existingPhotos: string[];
}

function ShipmentForm({
    formData,
    setFormData,
    receiverOptions,
    loadingReceivers,
    onReceiverChange,
    isNotInTransit,
    selectedPhotos,
    setSelectedPhotos,
    existingPhotos
}: ShipmentFormProps) {
    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedPhotos(prev => [...prev, ...files]);
    };

    const removeSelectedPhoto = (index: number) => {
        setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {/* Tracking ID */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tracking ID
                </label>
                <Input
                    value={formData.tracking_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, tracking_id: e.target.value }))}
                    placeholder="e.g., 1Z999AA10123456784"
                />
            </div>

            {/* Contents */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contents *
                </label>
                <textarea
                    value={formData.contents}
                    onChange={(e) => setFormData(prev => ({ ...prev, contents: e.target.value }))}
                    placeholder="Describe shipment contents..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                    required
                />
            </div>

            {/* Status/Location */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status / Location
                </label>
                <Input
                    value={formData.status_location}
                    onChange={(e) => setFormData(prev => ({ ...prev, status_location: e.target.value }))}
                    placeholder="e.g., In Transit, Warehouse, Received at Office"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Enter location/status manually (e.g., "In Transit", "At Warehouse", "Delivered to Site")
                </p>
            </div>

            {/* Received By - Highlighted when not in transit */}
            <div className={isNotInTransit ? 'p-3 bg-green-50 rounded-lg border border-green-200' : ''}>
                {isNotInTransit && (
                    <p className="text-sm text-green-700 font-medium mb-2">
                        📦 Record who received this shipment:
                    </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Received By
                        </label>
                        {loadingReceivers ? (
                            <div className="flex items-center gap-2 py-2">
                                <LoadingSpinner />
                                <span className="text-sm text-gray-500">Loading...</span>
                            </div>
                        ) : (
                            <select
                                value={formData.received_by_id}
                                onChange={(e) => onReceiverChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select person...</option>
                                <optgroup label="Technicians">
                                    {receiverOptions.filter(r => r.type === 'technician').map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Office Staff">
                                    {receiverOptions.filter(r => r.type === 'office_staff').map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} {r.title ? `(${r.title})` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Received At
                        </label>
                        <Input
                            type="datetime-local"
                            value={formData.received_at}
                            onChange={(e) => setFormData(prev => ({ ...prev, received_at: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            {/* Receipt Photos */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Receipt Photos
                </label>

                {/* Existing photos */}
                {existingPhotos.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {existingPhotos.map((url, idx) => (
                            <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-16 h-16 rounded overflow-hidden border border-gray-200 hover:border-blue-400"
                            >
                                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                            </a>
                        ))}
                    </div>
                )}

                {/* New photos to upload */}
                {selectedPhotos.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                        {selectedPhotos.map((file, idx) => (
                            <div key={idx} className="relative w-16 h-16">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`New ${idx + 1}`}
                                    className="w-full h-full object-cover rounded border border-blue-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSelectedPhoto(idx)}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            {/* Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                </label>
                <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                />
            </div>
        </div>
    );
}
