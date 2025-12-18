import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/api';
import { WorkOrder, WorkOrderFile } from '@/types/database';

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

const ANALYSIS_PROMPT = `You are analyzing work order documents for a signage installation company. You may receive multiple files including:
- Work order documents (PDF/images)
- Site plans and blueprints
- Specifications
- Site photos
- Other relevant documents

Analyze ALL provided files together and extract comprehensive information. Return JSON with:

**IMPORTANT: Extract these fields for DIRECT DATABASE INSERTION (if found in the document):**
work_order_number: the official work order number/ID from the document (e.g., "WO-2024-001", "12345", etc.)
site_address: the full job site address where work will be performed
work_order_date: the date on the work order document (format: YYYY-MM-DD)
skills_required: array of strings listing specific technician skills needed (e.g. "Electrical", "Welding", "High Reach") - OPTIONAL
permits_required: array of strings listing required permits - OPTIONAL
equipment_required: array of strings listing required equipment (e.g. "Scissor Lift", "Bucket Truck", "Ladder") - OPTIONAL
materials_required: array of strings listing required materials/parts - OPTIONAL

**Additional Analysis Fields:**
jobType: type of signage work
location: full address (same as site_address)
orderedBy: client name
contactInfo: phone/email
summary: brief summary of work
recommended_technician_skills: legacy field (same as skills_required)
estimatedHours: number
safety_notes: safety warnings
additionalDetails: any other relevant info

scope_of_work: detailed text description of the scope of work based on the documents.
suggested_tasks: array of objects representing actionable steps. Each object must have:
  - name: string (concise task name)
  - description: string (detailed instructions)
  - priority: 'Low', 'Medium', 'High', or 'Emergency'

Return ONLY valid JSON, no markdown formatting or code blocks.`;

export async function POST(request: NextRequest) {
    try {
        const { workOrderId } = await request.json();

        if (!workOrderId) {
            return NextResponse.json(
                { error: 'Work order ID is required' },
                { status: 400 }
            );
        }

        // Fetch work order from database
        const supabase = createClient();
        const { data: workOrderData, error: fetchError } = await supabase
            .from('work_orders')
            .select('*')
            .eq('id', workOrderId)
            .single();

        if (fetchError || !workOrderData) {
            return NextResponse.json(
                { error: 'Work order not found' },
                { status: 404 }
            );
        }

        // Type assertion
        const workOrder = workOrderData as unknown as WorkOrder;

        // Check if already processed
        if (workOrder.processed) {
            return NextResponse.json({
                message: 'Work order already processed',
                analysis: workOrder.analysis,
            });
        }

        // Fetch all files for this work order
        const { data: filesData, error: filesError } = await supabase
            .from('work_order_files')
            .select('*')
            .eq('work_order_id', workOrderId);

        const files = (filesData || []) as unknown as WorkOrderFile[];

        if (filesError || !files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files found for this work order' },
                { status: 404 }
            );
        }

        // Download and process all files - build content for OpenAI
        const imageContents: { type: 'image_url'; image_url: { url: string; detail: 'high' } }[] = [];
        let textContent = '';

        for (const file of files) {
            // Extract file path from URL
            const urlParts = file.file_url.split('/');
            const filePath = urlParts[urlParts.length - 1];

            // Download file from Supabase Storage
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('work-orders')
                .download(filePath);

            if (downloadError || !fileData) {
                console.error(`Failed to download file: ${file.file_name}`, downloadError);
                continue; // Skip this file but continue with others
            }

            // Convert to buffer
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Determine file type
            const fileName = file.file_name || '';
            const fileExtension = fileName.split('.').pop()?.toLowerCase();

            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
                // For images, add as base64 data URL
                const base64 = buffer.toString('base64');
                const mimeType = file.mime_type || `image/${fileExtension}`;
                imageContents.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${mimeType};base64,${base64}`,
                        detail: 'high'
                    }
                });
            } else if (fileExtension === 'pdf') {
                // For PDFs, we'll need to note that OpenAI doesn't directly support PDFs
                // We'll add a note and try to process as text if possible
                textContent += `\n[PDF File: ${fileName} - Please analyze the content from images if available]\n`;
                // Convert PDF to image would require additional processing
                // For now, we'll just note the PDF exists
            }
        }

        if (imageContents.length === 0 && !textContent) {
            return NextResponse.json(
                { error: 'No supported files found (images only for OpenAI). PDFs require conversion.' },
                { status: 400 }
            );
        }

        // Process with OpenAI GPT-4 Vision
        const analysisText = await analyzeWithOpenAI(imageContents, textContent);

        // Parse the JSON response
        let analysis;
        try {
            // Remove markdown code blocks if present
            const cleanedText = analysisText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            analysis = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', analysisText);
            return NextResponse.json(
                { error: 'Failed to parse AI response', rawResponse: analysisText },
                { status: 500 }
            );
        }

        // Extract key fields from AI analysis for direct database columns
        const workOrderUpdate: Record<string, any> = {
            processed: true,
            analysis: analysis,
        };

        // Populate new fields from AI extraction if available
        if (analysis.work_order_number) {
            workOrderUpdate.work_order_number = String(analysis.work_order_number);
        }
        if (analysis.site_address) {
            workOrderUpdate.site_address = String(analysis.site_address);
        }
        if (analysis.work_order_date) {
            // Validate date format
            const dateMatch = String(analysis.work_order_date).match(/^\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
                workOrderUpdate.work_order_date = dateMatch[0];
            }
        }

        // Helper to sanitize array of strings
        const sanitizeStringArray = (arr: any): string[] | undefined => {
            if (!Array.isArray(arr)) return undefined;
            return arr.map(item => String(item)).filter(item => item.trim() !== '');
        };

        // Populate requirements arrays with sanitization
        const skills = sanitizeStringArray(analysis.skills_required);
        if (skills) workOrderUpdate.skills_required = skills;

        const permits = sanitizeStringArray(analysis.permits_required);
        if (permits) workOrderUpdate.permits_required = permits;

        const equipment = sanitizeStringArray(analysis.equipment_required);
        if (equipment) workOrderUpdate.equipment_required = equipment;

        const materials = sanitizeStringArray(analysis.materials_required);
        if (materials) workOrderUpdate.materials_required = materials;

        if (analysis.scope_of_work) {
            workOrderUpdate.scope_of_work = String(analysis.scope_of_work);
        }

        // Update work order in database
        const { error: updateError } = await supabase
            .from('work_orders')
            .update(workOrderUpdate)
            .eq('id', workOrderId);

        if (updateError) {
            console.error('Failed to update work order:', updateError);
            return NextResponse.json(
                { error: 'Failed to update work order', details: updateError.message },
                { status: 500 }
            );
        }

        // Create Suggested Tasks
        if (Array.isArray(analysis.suggested_tasks) && analysis.suggested_tasks.length > 0) {
            const tasksToInsert = analysis.suggested_tasks.map((task: any) => ({
                work_order_id: workOrderId,
                name: String(task.name).substring(0, 255),
                description: task.description ? String(task.description) : null,
                priority: ['Low', 'Medium', 'High', 'Emergency'].includes(task.priority) ? task.priority : 'Medium',
                status: 'Pending'
            }));

            const { error: tasksError } = await supabase
                .from('work_order_tasks')
                .insert(tasksToInsert);

            if (tasksError) {
                console.error('Failed to insert suggested tasks:', tasksError);
                // Don't fail the whole request, just log it
            }
        }

        return NextResponse.json({
            success: true,
            analysis: analysis,
        });
    } catch (error: any) {
        console.error('Error processing work order:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Analyze with OpenAI GPT-4 Vision
async function analyzeWithOpenAI(
    imageContents: { type: 'image_url'; image_url: { url: string; detail: 'high' } }[],
    additionalText: string
): Promise<string> {
    const messages: any[] = [
        {
            role: 'user',
            content: [
                { type: 'text', text: ANALYSIS_PROMPT + (additionalText ? `\n\nAdditional context:\n${additionalText}` : '') },
                ...imageContents
            ]
        }
    ];

    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 4096,
    });

    return response.choices[0]?.message?.content || '';
}
