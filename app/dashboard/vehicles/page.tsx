'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types/database';

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        license_plate: '',
        type: '',
        status: 'available' as 'available' | 'in-use' | 'maintenance',
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch vehicles from Supabase
    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('vehicles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVehicles(data || []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            alert('Failed to load vehicles');
        } finally {
            setLoading(false);
        }
    };

    // Add new vehicle
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Name is required');
            return;
        }

        try {
            setSubmitting(true);

            const { error } = await supabase.from('vehicles').insert([
                {
                    name: formData.name,
                    license_plate: formData.license_plate || null,
                    type: formData.type || null,
                    status: formData.status,
                },
            ]);

            if (error) throw error;

            // Reset form
            setFormData({
                name: '',
                license_plate: '',
                type: '',
                status: 'available',
            });

            // Refresh list
            fetchVehicles();

            alert('Vehicle added successfully!');
        } catch (error) {
            console.error('Error adding vehicle:', error);
            alert('Failed to add vehicle');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete vehicle
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;

        try {
            const { error } = await supabase.from('vehicles').delete().eq('id', id);

            if (error) throw error;

            fetchVehicles();
            alert('Vehicle deleted successfully!');
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            alert('Failed to delete vehicle');
        }
    };

    useEffect(() => {
        fetchVehicles();
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
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Vehicles</h1>

            {/* Add Vehicle Form */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Add New Vehicle
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                License Plate
                            </label>
                            <input
                                type="text"
                                value={formData.license_plate}
                                onChange={(e) =>
                                    setFormData({ ...formData, license_plate: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                placeholder="e.g. van, truck"
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
                        {submitting ? 'Adding...' : 'Add Vehicle'}
                    </button>
                </form>
            </div>

            {/* Vehicles Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        All Vehicles ({vehicles.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        Loading vehicles...
                    </div>
                ) : vehicles.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No vehicles found. Add your first vehicle above.
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
                                        License Plate
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
                                {vehicles.map((vehicle) => (
                                    <tr key={vehicle.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {vehicle.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {vehicle.license_plate || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {vehicle.type || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                    vehicle.status
                                                )}`}
                                            >
                                                {vehicle.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleDelete(vehicle.id)}
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
