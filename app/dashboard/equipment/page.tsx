'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Equipment } from '@/types/database';

export default function EquipmentPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        status: 'available' as 'available' | 'in-use' | 'maintenance',
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch equipment from Supabase
    const fetchEquipment = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('equipment')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEquipment(data || []);
        } catch (error) {
            console.error('Error fetching equipment:', error);
            alert('Failed to load equipment');
        } finally {
            setLoading(false);
        }
    };

    // Add new equipment
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Name is required');
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await supabase.from('equipment').insert([
                {
                    name: formData.name,
                    type: formData.type || null,
                    status: formData.status,
                },
            ]);

            if (error) throw error;

            // Reset form
            setFormData({
                name: '',
                type: '',
                status: 'available',
            });

            // Refresh list
            fetchEquipment();

            alert('Equipment added successfully!');
        } catch (error) {
            console.error('Error adding equipment:', error);
            alert('Failed to add equipment');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete equipment
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this equipment?')) return;

        try {
            const { error } = await supabase.from('equipment').delete().eq('id', id);

            if (error) throw error;

            fetchEquipment();
            alert('Equipment deleted successfully!');
        } catch (error) {
            console.error('Error deleting equipment:', error);
            alert('Failed to delete equipment');
        }
    };

    useEffect(() => {
        fetchEquipment();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-700';
            case 'in-use':
                return 'bg-blue-100 text-blue-700';
            case 'maintenance':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Equipment</h1>

            {/* Add Equipment Form */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Add New Equipment
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <input
                                type="text"
                                value={formData.type}
                                onChange={(e) =>
                                    setFormData({ ...formData, type: e.target.value })
                                }
                                placeholder="e.g. ladder, power tool"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        status: e.target.value as
                                            | 'available'
                                            | 'in-use'
                                            | 'maintenance',
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="available">Available</option>
                                <option value="in-use">In Use</option>
                                <option value="maintenance">Maintenance</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Adding...' : 'Add Equipment'}
                    </button>
                </form>
            </div>

            {/* Equipment Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        All Equipment ({equipment.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        Loading equipment...
                    </div>
                ) : equipment.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No equipment found. Add your first equipment above.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
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
                                {equipment.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.type || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    item.status
                                                )}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleDelete(item.id)}
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
        </div>
    );
}
