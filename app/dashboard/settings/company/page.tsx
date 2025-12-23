'use client';

import { useState, useEffect, useRef } from 'react';
import { companySettingsService, CompanySettings, CompanySettingsUpdate } from '@/services/company-settings.service';
import { Button, Input, LoadingSpinner } from '@/components/ui';
import { showToast } from '@/components/providers/ToastProvider';
import { usePermissions } from '@/hooks/usePermissions';

export default function CompanyInfoPage() {
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { hasPermission } = usePermissions();

    const canEdit = hasPermission('settings:manage_company');

    // Form state
    const [formData, setFormData] = useState<CompanySettingsUpdate>({
        name: '',
        phone: '',
        email: '',
        website: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        tax_id: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await companySettingsService.get();
            if (data) {
                setSettings(data);
                setFormData({
                    name: data.name || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    website: data.website || '',
                    address_line1: data.address_line1 || '',
                    address_line2: data.address_line2 || '',
                    city: data.city || '',
                    state: data.state || '',
                    postal_code: data.postal_code || '',
                    country: data.country || '',
                    tax_id: data.tax_id || ''
                });
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showToast.error('Failed to load company settings');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof CompanySettingsUpdate, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!canEdit) return;

        setSaving(true);
        try {
            const updated = await companySettingsService.update(formData);
            setSettings(updated);
            showToast.success('Company information saved successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast.error('Failed to save company settings');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const logoUrl = await companySettingsService.uploadLogo(file);
            setSettings(prev => prev ? { ...prev, logo_url: logoUrl } : null);
            showToast.success('Logo uploaded successfully');
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            showToast.error(error.message || 'Failed to upload logo');
        } finally {
            setUploadingLogo(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteLogo = async () => {
        if (!settings?.logo_url) return;

        try {
            await companySettingsService.deleteLogo();
            setSettings(prev => prev ? { ...prev, logo_url: null } : null);
            showToast.success('Logo removed');
        } catch (error) {
            console.error('Error deleting logo:', error);
            showToast.error('Failed to remove logo');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your company details, logo, and contact information.
                    </p>
                </div>

                <div className="p-6 space-y-8">
                    {/* Logo Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Company Logo</h3>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                                {settings?.logo_url ? (
                                    <img
                                        src={settings.logo_url}
                                        alt="Company Logo"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-gray-400 text-xs text-center px-2">No logo</span>
                                )}
                            </div>
                            {canEdit && (
                                <div className="flex flex-col gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingLogo}
                                    >
                                        {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                                    </Button>
                                    {settings?.logo_url && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleDeleteLogo}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </Button>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        JPG, PNG, GIF, WebP, or SVG. Max 5MB.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Basic Info Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Company Name *
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="Enter company name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Tax ID / EIN
                                </label>
                                <Input
                                    value={formData.tax_id || ''}
                                    onChange={(e) => handleInputChange('tax_id', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="XX-XXXXXXX"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Phone
                                </label>
                                <Input
                                    value={formData.phone || ''}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="(555) 123-4567"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="info@company.com"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Website
                                </label>
                                <Input
                                    value={formData.website || ''}
                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="https://www.company.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Address Line 1
                                </label>
                                <Input
                                    value={formData.address_line1 || ''}
                                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="123 Main Street"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Address Line 2
                                </label>
                                <Input
                                    value={formData.address_line2 || ''}
                                    onChange={(e) => handleInputChange('address_line2', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="Suite 100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    City
                                </label>
                                <Input
                                    value={formData.city || ''}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="City"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    State / Province
                                </label>
                                <Input
                                    value={formData.state || ''}
                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="State"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Postal Code
                                </label>
                                <Input
                                    value={formData.postal_code || ''}
                                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="12345"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Country
                                </label>
                                <Input
                                    value={formData.country || ''}
                                    onChange={(e) => handleInputChange('country', e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="USA"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    {canEdit && (
                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
