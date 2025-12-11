'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Technician } from '@/types/database';

export default function TechniciansPage() {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        skills: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch technicians from Supabase
    const fetchTechnicians = async () => {
        try {
            setLoading(true);
            const supabase = createClient();
            const { data, error } = await supabase
                .from('technicians')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTechnicians(data || []);
        } catch (error) {
            console.error('Error fetching technicians:', error);
            alert('Failed to load technicians');
        } finally {
            setLoading(false);
        }
    };

    // Add new technician
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Name is required');
            return;
        }

        try {
            setSubmitting(true);

            // Convert comma-separated skills to array
            const skillsArray = formData.skills
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);

            const supabase = createClient();
            const { error } = await supabase.from('technicians').insert([
                {
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone || null,
                    skills: skillsArray.length > 0 ? skillsArray : null,
                },
            ]);

            if (error) throw error;

            // Reset form
            setFormData({ name: '', email: '', phone: '', skills: '' });

            // Refresh list
            fetchTechnicians();

            alert('Technician added successfully!');
        } catch (error) {
            console.error('Error adding technician:', error);
            alert('Failed to add technician');
        } finally {
            setSubmitting(false);
        }
    };

    // Delete technician
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this technician?')) return;

        try {
            const supabase = createClient();
            const { error } = await supabase
                .from('technicians')
                .delete()
                .eq('id', id);

            if (error) throw error;

            fetchTechnicians();
            alert('Technician deleted successfully!');
        } catch (error) {
            console.error('Error deleting technician:', error);
            alert('Failed to delete technician');
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Technicians</h1>

            {/* Add Technician Form */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Add New Technician
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
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Skills (comma-separated)
                            </label>
                            <input
                                type="text"
                                value={formData.skills}
                                onChange={(e) =>
                                    setFormData({ ...formData, skills: e.target.value })
                                }
                                placeholder="e.g. electrical, signage installation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Adding...' : 'Add Technician'}
                    </button>
                </form>
            </div>

            {/* Technicians Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        All Technicians ({technicians.length})
                    </h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        Loading technicians...
                    </div>
                ) : technicians.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No technicians found. Add your first technician above.
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
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Skills
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {technicians.map((tech) => (
                                    <tr key={tech.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {tech.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tech.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {tech.phone || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {tech.skills && tech.skills.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {tech.skills.map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleDelete(tech.id)}
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
