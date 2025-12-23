// Company Settings Service
// Handles CRUD operations for company information

import { createClient } from '@/lib/supabase/client';

export interface CompanySettings {
    id: number;
    name: string;
    logo_url: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    tax_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface CompanySettingsUpdate {
    name?: string;
    logo_url?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    tax_id?: string | null;
}

export const companySettingsService = {
    /**
     * Get company settings (there's only one row)
     */
    async get(): Promise<CompanySettings | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('company_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching company settings:', error);
            return null;
        }

        return data as CompanySettings;
    },

    /**
     * Update company settings
     */
    async update(updates: CompanySettingsUpdate): Promise<CompanySettings> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('company_settings')
            .update(updates)
            .eq('id', 1)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update company settings: ${error.message}`);
        }

        return data as CompanySettings;
    },

    /**
     * Upload company logo
     * Returns the public URL of the uploaded logo
     */
    async uploadLogo(file: File): Promise<string> {
        const supabase = createClient();

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Allowed: JPG, PNG, GIF, WebP, SVG');
        }

        // Validate file size (5MB max for logos)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('File size exceeds 5MB limit');
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `logo_${timestamp}.${fileExt}`;

        // Upload to company-assets bucket
        const { error: uploadError } = await supabase.storage
            .from('company-assets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true // Overwrite if exists
            });

        if (uploadError) {
            throw new Error(`Failed to upload logo: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('company-assets')
            .getPublicUrl(fileName);

        // Update company settings with new logo URL
        await supabase
            .from('company_settings')
            .update({ logo_url: urlData.publicUrl })
            .eq('id', 1);

        return urlData.publicUrl;
    },

    /**
     * Delete company logo
     */
    async deleteLogo(): Promise<void> {
        const supabase = createClient();

        // Get current logo URL to extract filename
        const settings = await this.get();
        if (settings?.logo_url) {
            // Extract filename from URL
            const urlParts = settings.logo_url.split('/');
            const fileName = urlParts[urlParts.length - 1];

            // Delete from storage
            await supabase.storage
                .from('company-assets')
                .remove([fileName]);
        }

        // Clear logo_url in settings
        await supabase
            .from('company_settings')
            .update({ logo_url: null })
            .eq('id', 1);
    },

    /**
     * Get just the company name (for quick lookups like chat display)
     */
    async getCompanyName(): Promise<string> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('company_settings')
            .select('name')
            .eq('id', 1)
            .single();

        if (error || !data) {
            return 'Tops Lighting'; // Fallback
        }

        return data.name;
    }
};
