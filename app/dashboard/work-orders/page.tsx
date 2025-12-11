'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { WorkOrder, WorkOrderFile } from '@/types/database';

const MAX_ASSOCIATED_FILES = 9; // 9 associated files + 1 work order = 10 total

export default function WorkOrdersPage() {
    const supabase = createClient();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Separate state for work order file (mandatory) and associated files (optional)
    const [workOrderFile, setWorkOrderFile] = useState<File | null>(null);
    const [associatedFiles, setAssociatedFiles] = useState<File[]>([]);

    const [viewingOrder, setViewingOrder] = useState<WorkOrder | null>(null);
    const [viewingFiles, setViewingFiles] = useState<WorkOrderFile[]>([]);
    const [showFilesModal, setShowFilesModal] = useState(false);

    // Helper to safely render any value (string or object)
    const safeRender = (value: any): string => {
        if (!value) return 'N/A';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        return JSON.stringify(value, null, 2);
    };

    // Fetch work orders from Supabase
    const fetchWorkOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('work_orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWorkOrders(data || []);
        } catch (error) {
            console.error('Error fetching work orders:', error);
            alert('Failed to load work orders');
        } finally {
            setLoading(false);
        }
    };

    // Handle work order file selection (single file, mandatory)
    const handleWorkOrderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setWorkOrderFile(e.target.files[0]);
        }
    };

    // Handle associated files selection (multiple files, optional)
    const handleAssociatedFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const totalFiles = associatedFiles.length + filesArray.length;

            if (totalFiles > MAX_ASSOCIATED_FILES) {
                alert(`Maximum ${MAX_ASSOCIATED_FILES} associated files allowed. You selected ${totalFiles} files.`);
                return;
            }

            setAssociatedFiles(prev => [...prev, ...filesArray]);
        }
    };

    // Remove an associated file from the selection
    const removeAssociatedFile = (index: number) => {
        setAssociatedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };


    // Upload files and create work order
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!workOrderFile) {
            alert('Please select a work order file (mandatory)');
            return;
        }

        try {
            setUploading(true);

            // TODO: Get current user ID from auth
            const userId = null;

            // Create work order record first
            const { data: workOrderData, error: workOrderError } = await supabase
                .from('work_orders')
                .insert([
                    {
                        uploaded_by: userId,
                        processed: false,
                        analysis: null,
                    },
                ])
                .select()
                .single();

            if (workOrderError || !workOrderData) {
                throw new Error('Failed to create work order');
            }

            const workOrderId = workOrderData.id;

            // Combine work order file + associated files
            const allFiles = [workOrderFile, ...associatedFiles];

            // Upload all files and create file records
            const uploadPromises = allFiles.map(async (file) => {
                // Generate unique file name
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                // Upload file to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('work-orders')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('work-orders')
                    .getPublicUrl(filePath);

                // Create file record in work_order_files table
                const { error: fileError } = await supabase
                    .from('work_order_files')
                    .insert([
                        {
                            work_order_id: workOrderId,
                            file_url: urlData.publicUrl,
                            file_name: file.name,
                            file_size: file.size,
                            mime_type: file.type,
                        },
                    ]);

                if (fileError) throw fileError;
            });

            await Promise.all(uploadPromises);

            // Reset form
            setWorkOrderFile(null);
            setAssociatedFiles([]);
            const workOrderInput = document.getElementById('work-order-input') as HTMLInputElement;
            const associatedInput = document.getElementById('associated-files-input') as HTMLInputElement;
            if (workOrderInput) workOrderInput.value = '';
            if (associatedInput) associatedInput.value = '';

            // Refresh list
            fetchWorkOrders();

            alert(`Work order created successfully with ${allFiles.length} file(s)!`);
        } catch (error: any) {
            console.error('Error uploading files:', error);
            alert(`Failed to upload files: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Process work order with AI
    const handleProcess = async (id: string) => {
        if (!confirm('Process this work order with AI? This may take a moment.')) return;

        try {
            const response = await fetch('/api/process-work-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workOrderId: id }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process work order');
            }

            fetchWorkOrders();
            alert('Work order processed successfully! Check the analysis in the database.');
        } catch (error: any) {
            console.error('Error processing work order:', error);
            alert(`Failed to process work order: ${error.message}`);
        }
    };


    // Fetch files for a work order
    const fetchWorkOrderFiles = async (workOrderId: string): Promise<WorkOrderFile[]> => {
        const { data, error } = await supabase
            .from('work_order_files')
            .select('*')
            .eq('work_order_id', workOrderId);

        if (error) {
            console.error('Error fetching work order files:', error);
            return [];
        }

        return data || [];
    };

    // View files for a work order
    const handleViewFiles = async (workOrderId: string) => {
        const files = await fetchWorkOrderFiles(workOrderId);
        setViewingFiles(files);
        setShowFilesModal(true);
    };

    // Delete work order and all associated files
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this work order and all its files?')) return;

        try {
            // Fetch all files for this work order
            const files = await fetchWorkOrderFiles(id);

            // Delete all files from storage
            const filePaths = files.map(file => {
                const urlParts = file.file_url.split('/');
                return urlParts[urlParts.length - 1];
            });

            if (filePaths.length > 0) {
                const { error: storageError } = await supabase.storage
                    .from('work-orders')
                    .remove(filePaths);

                if (storageError) console.error('Error deleting files:', storageError);
            }

            // Delete work order (CASCADE will delete file records)
            const { error: dbError } = await supabase
                .from('work_orders')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            fetchWorkOrders();
            alert('Work order and all files deleted successfully!');
        } catch (error) {
            console.error('Error deleting work order:', error);
            alert('Failed to delete work order');
        }
    };

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Work Orders</h1>

            {/* Upload Form */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Create New Work Order
                </h2>
                <form onSubmit={handleUpload} className="space-y-6">
                    {/* Work Order File Section (Mandatory) */}
                    <div className="border-b border-gray-200 pb-6">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Work Order File <span className="text-red-600">*</span> (Required)
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Upload the main work order document (PDF or image)
                        </p>
                        <input
                            id="work-order-input"
                            type="file"
                            onChange={handleWorkOrderFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {workOrderFile && (
                            <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-blue-900 truncate">
                                            📄 {workOrderFile.name}
                                        </p>
                                        <p className="text-xs text-blue-700">
                                            {formatFileSize(workOrderFile.size)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setWorkOrderFile(null)}
                                        className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Associated Files Section (Optional) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Associated Files (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Upload additional files like plans, specifications, site photos, etc. (Max {MAX_ASSOCIATED_FILES} files)
                        </p>
                        <input
                            id="associated-files-input"
                            type="file"
                            onChange={handleAssociatedFilesChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                            multiple
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />

                        {/* Associated Files Preview List */}
                        {associatedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-medium text-gray-700">
                                    Selected Files ({associatedFiles.length}/{MAX_ASSOCIATED_FILES}):
                                </p>
                                <div className="space-y-2">
                                    {associatedFiles.map((file: File, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAssociatedFile(index)}
                                                className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={uploading || !workOrderFile}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                        {uploading ? 'Uploading...' : `Create Work Order ${workOrderFile ? `(${1 + associatedFiles.length} file${1 + associatedFiles.length !== 1 ? 's' : ''})` : ''}`}
                    </button>
                </form>
            </div>

            {/* Work Orders List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        All Work Orders ({workOrders.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        Loading work orders...
                    </div>
                ) : workOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No work orders found. Upload your first work order above.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Work Order ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Uploaded
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {workOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-gray-600">
                                                    {order.id.substring(0, 8)}...
                                                </span>
                                                <button
                                                    onClick={() => handleViewFiles(order.id)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    View Files
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${order.processed
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}
                                            >
                                                {order.processed ? 'Processed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                            {!order.processed && (
                                                <button
                                                    onClick={() => handleProcess(order.id)}
                                                    className="text-green-600 hover:text-green-900 font-medium"
                                                >
                                                    Process
                                                </button>
                                            )}
                                            {order.processed && order.analysis && (
                                                <button
                                                    onClick={() => setViewingOrder(order)}
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    View Analysis
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    📋 Setup Required
                </h3>
                <p className="text-sm text-blue-800">
                    Before uploading files, make sure you've created the 'work-orders' storage bucket in your Supabase dashboard:
                </p>
                <ol className="mt-2 text-sm text-blue-800 list-decimal list-inside space-y-1">
                    <li>Go to Storage in your Supabase dashboard</li>
                    <li>Create a new bucket named 'work-orders'</li>
                    <li>Set it to public or configure appropriate policies</li>
                </ol>
            </div>

            {/* Analysis Modal */}
            {viewingOrder && viewingOrder.analysis && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Work Order Analysis</h2>
                            <button
                                onClick={() => setViewingOrder(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Job Type & Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Job Type</h3>
                                    <p className="text-lg font-medium text-gray-900">{safeRender(viewingOrder.analysis.jobType)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">Location</h3>
                                    <p className="text-lg text-gray-900">{safeRender(viewingOrder.analysis.location)}</p>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Client Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-500">Ordered By:</span>
                                        <p className="font-medium">{safeRender(viewingOrder.analysis.orderedBy)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Contact Info:</span>
                                        <p className="font-medium">{safeRender(viewingOrder.analysis.contactInfo)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Resource Requirements */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Resource Requirements</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-500">Tech Skills:</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {viewingOrder.analysis.resourceRequirements?.techSkills?.map((skill: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                    {skill}
                                                </span>
                                            )) || <span className="text-gray-400">None</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Equipment:</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {viewingOrder.analysis.resourceRequirements?.equipment?.map((item: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                    {item}
                                                </span>
                                            )) || <span className="text-gray-400">None</span>}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Vehicles:</span>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {viewingOrder.analysis.resourceRequirements?.vehicles?.map((vehicle: string, idx: number) => (
                                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                                    {vehicle}
                                                </span>
                                            )) || <span className="text-gray-400">None</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Staffing & Timeline */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Staffing & Timeline</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-500">Number of Techs:</span>
                                        <p className="font-medium">{safeRender(viewingOrder.analysis.numberOfTechs)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Estimated Hours:</span>
                                        <p className="font-medium">{safeRender(viewingOrder.analysis.estimatedHours)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Estimated Days:</span>
                                        <p className="font-medium">{safeRender(viewingOrder.analysis.estimatedDays)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Permits */}
                            {viewingOrder.analysis.permitsRequired && viewingOrder.analysis.permitsRequired.length > 0 && (
                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Permits Required</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {viewingOrder.analysis.permitsRequired.map((permit: string, idx: number) => (
                                            <li key={idx} className="text-gray-700">{permit}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Technical & Access Requirements */}
                            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Requirements</h3>
                                    <p className="text-gray-700">{safeRender(viewingOrder.analysis.technicalRequirements)}</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Requirements</h3>
                                    <p className="text-gray-700">{safeRender(viewingOrder.analysis.accessRequirements)}</p>
                                </div>
                            </div>

                            {/* Risk Factors */}
                            {viewingOrder.analysis.riskFactors && viewingOrder.analysis.riskFactors.length > 0 && (
                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Risk Factors</h3>
                                    <ul className="list-disc list-inside space-y-1">
                                        {viewingOrder.analysis.riskFactors.map((risk: string, idx: number) => (
                                            <li key={idx} className="text-red-700">{risk}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Questions */}
                            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {viewingOrder.analysis.clientQuestions && viewingOrder.analysis.clientQuestions.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Questions</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {viewingOrder.analysis.clientQuestions.map((q: string, idx: number) => (
                                                <li key={idx} className="text-gray-700">{q}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {viewingOrder.analysis.technicianQuestions && viewingOrder.analysis.technicianQuestions.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Technician Questions</h3>
                                        <ul className="list-disc list-inside space-y-1">
                                            {viewingOrder.analysis.technicianQuestions.map((q: string, idx: number) => (
                                                <li key={idx} className="text-gray-700">{q}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Additional Details */}
                            {viewingOrder.analysis.additionalDetails && (
                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Details</h3>
                                    <pre className="text-gray-700 whitespace-pre-wrap">{safeRender(viewingOrder.analysis.additionalDetails)}</pre>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                            <button
                                onClick={() => setViewingOrder(null)}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Files Modal */}
            {showFilesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Associated Files</h2>
                            <button
                                onClick={() => setShowFilesModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-6">
                            {viewingFiles.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No files found for this work order.</p>
                            ) : (
                                <div className="space-y-3">
                                    {viewingFiles.map((file, index) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.file_name || `File ${index + 1}`}
                                                </p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {file.file_size && (
                                                        <span className="text-xs text-gray-500">
                                                            {formatFileSize(file.file_size)}
                                                        </span>
                                                    )}
                                                    {file.mime_type && (
                                                        <span className="text-xs text-gray-500">
                                                            {file.mime_type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <a
                                                href={file.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                View/Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
                            <button
                                onClick={() => setShowFilesModal(false)}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
