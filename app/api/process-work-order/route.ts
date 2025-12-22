import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/api';
import { WorkOrder, WorkOrderFile } from '@/types/database';

// Debug: Log environment variable presence (not values)
console.log('[process-work-order] Environment check:', {
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ANALYSIS_PROMPT = `You are an expert AI assistant for a signage company. Your role is to analyze work order documents (PDFs, images) and extract specific operational data.

**INSTRUCTIONS:**
1. **Analyze ALL provided files** to build a complete understanding of the job.
2. **Extract** the exact fields listed below.
3. **Tasks Extraction**: Review the line items in the work order carefully. Identify the actual work to be done. 
   - **Ignore** generic headers like "Installation", "Services", "Labor".
   - **Extract** specific actions like "Install 14'x48' Face Replacement", "Service Outage", "Survey pylon sign".
   - Create a list of specific, actionable tasks.
4. **Format**: Return the result as a VALID JSON object matching the detailed structure.

**REQUIRED JSON STRUCTURE:**
{
  "work_order_number": "String. The official work order ID (e.g., WO-12345, 100200)",
  "site_address": "String. The full address where work will be performed.",
  "work_order_date": "String. Format: YYYY-MM-DD. The date the work order was created/issued.",
  "planned_date": "String. Format: YYYY-MM-DD. The scheduled installation or due date, if found.",
  "skills_required": ["String", "String", ...],
  "permits_required": ["String", "String", ...],
  "equipment_required": ["String", "String", ...],
  "materials_required": ["String", "String", ...],
  "suggested_tasks": [
    {
      "name": "Concise task name (e.g. 'Install Main Sign Face')",
      "description": "Detailed description from line items",
      "priority": "Medium"
    }
  ],
  "jobType": "String. Brief categorization (e.g. 'Installation', 'Service', 'Survey', 'Removal')",
  "scope_of_work": "String. A comprehensive summary text block of the entire scope."
}

**CRITICAL NOTES:**
- Return ONLY valid JSON.
- Do not wrap in markdown code blocks.
- If a field is not found, use null or empty array.
- For tasks: Be precise. "Install Sign" is too vague. "Install channel letters on raceway" is better.
`;

export async function POST(request: NextRequest) {
    console.log('[process-work-order] POST request received');

    try {
        // Check for Gemini API key first
        if (!process.env.GEMINI_API_KEY) {
            console.error('[process-work-order] GEMINI_API_KEY is not set!');
            return NextResponse.json(
                { error: 'GEMINI_API_KEY environment variable is not configured' },
                { status: 500 }
            );
        }

        const { workOrderId } = await request.json();
        console.log('[process-work-order] Processing work order:', workOrderId);

        if (!workOrderId) {
            return NextResponse.json(
                { error: 'Work order ID is required' },
                { status: 400 }
            );
        }

        // Fetch work order from database
        const supabase = createClient();
        console.log('[process-work-order] Fetching work order from database...');

        const { data: workOrderData, error: fetchError } = await supabase
            .from('work_orders')
            .select('*')
            .eq('id', workOrderId)
            .single();

        if (fetchError || !workOrderData) {
            console.error('[process-work-order] Failed to fetch work order:', fetchError);
            return NextResponse.json(
                { error: 'Work order not found', details: fetchError?.message },
                { status: 404 }
            );
        }

        const workOrder = workOrderData as unknown as WorkOrder;
        console.log('[process-work-order] Work order fetched, processed:', workOrder.processed);

        // Fetch all files for this work order
        console.log('[process-work-order] Fetching files...');
        const { data: filesData, error: filesError } = await supabase
            .from('work_order_files')
            .select('*')
            .eq('work_order_id', workOrderId);

        const files = (filesData || []) as unknown as WorkOrderFile[];
        console.log('[process-work-order] Files found:', files.length);

        if (filesError || !files || files.length === 0) {
            console.error('[process-work-order] No files found:', filesError);
            return NextResponse.json(
                { error: 'No files found for this work order', details: filesError?.message },
                { status: 404 }
            );
        }

        // Build content parts for Gemini
        const contentParts: { inlineData: { mimeType: string; data: string } }[] = [];

        for (const file of files) {
            console.log('[process-work-order] Processing file:', file.file_name);

            // Extract file path from URL
            // The URL format is: https://{project}.supabase.co/storage/v1/object/public/work-orders/{path}
            // We need to extract the path after 'work-orders/'
            const bucketMarker = '/work-orders/';
            const bucketIndex = file.file_url.indexOf(bucketMarker);
            const filePath = bucketIndex !== -1
                ? file.file_url.substring(bucketIndex + bucketMarker.length)
                : file.file_url.split('/').pop() || '';

            console.log('[process-work-order] Downloading from path:', filePath);

            // Download file from Supabase Storage
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('work-orders')
                .download(filePath);

            if (downloadError || !fileData) {
                console.error(`[process-work-order] Failed to download file: ${file.file_name}`, downloadError);
                continue;
            }

            // Convert to buffer and base64
            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Data = buffer.toString('base64');
            console.log('[process-work-order] File downloaded, size:', buffer.length);

            // Determine MIME type
            const fileName = file.file_name || '';
            const fileExtension = fileName.split('.').pop()?.toLowerCase();
            let mimeType = file.mime_type || '';

            if (!mimeType) {
                if (['jpg', 'jpeg'].includes(fileExtension || '')) mimeType = 'image/jpeg';
                else if (fileExtension === 'png') mimeType = 'image/png';
                else if (fileExtension === 'gif') mimeType = 'image/gif';
                else if (fileExtension === 'webp') mimeType = 'image/webp';
                else if (fileExtension === 'pdf') mimeType = 'application/pdf';
                else {
                    console.warn(`[process-work-order] Unknown file type: ${fileExtension}, skipping.`);
                    continue;
                }
            }

            contentParts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                },
            });
            console.log('[process-work-order] Added content part:', mimeType);
        }

        if (contentParts.length === 0) {
            console.error('[process-work-order] No valid files found to analyze.');
            return NextResponse.json(
                { error: 'No valid files found to analyze. Please upload PDF or Image files.' },
                { status: 400 }
            );
        }

        // Process with Gemini 3 Flash Preview
        console.log('[process-work-order] Calling Gemini 3 Flash Preview with', contentParts.length, 'files...');
        let analysisText: string;

        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-3-flash-preview',
                generationConfig: {
                    responseMimeType: 'application/json',
                },
            });

            const result = await model.generateContent([
                ANALYSIS_PROMPT,
                ...contentParts,
            ]);

            analysisText = result.response.text();
            console.log('[process-work-order] Gemini response received, length:', analysisText.length);
            console.log('[process-work-order] Raw Response Sample:', analysisText.substring(0, 500));
        } catch (geminiError: any) {
            console.error('[process-work-order] Gemini API error:', geminiError);
            return NextResponse.json(
                { error: 'Gemini API error', details: geminiError.message },
                { status: 500 }
            );
        }

        // Parse the JSON response
        let analysis;
        try {
            // Clean up if wrapped in markdown (shouldn't happen with responseMimeType but just in case)
            let cleanedText = analysisText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanedText = jsonMatch[0];
            }

            analysis = JSON.parse(cleanedText);
            console.log('[process-work-order] Analysis parsed successfully');
        } catch (parseError) {
            console.error('[process-work-order] Failed to parse AI response as JSON:', analysisText);
            return NextResponse.json(
                { error: 'Failed to parse AI response', rawResponse: analysisText.substring(0, 1000) },
                { status: 500 }
            );
        }

        // Extract key fields from AI analysis for direct database columns
        const workOrderUpdate: Record<string, any> = {
            processed: true,
            analysis: analysis,
        };

        if (analysis.work_order_number) {
            workOrderUpdate.work_order_number = String(analysis.work_order_number);
        }
        if (analysis.site_address) {
            workOrderUpdate.site_address = String(analysis.site_address);
        }
        if (analysis.work_order_date) {
            const dateMatch = String(analysis.work_order_date).match(/^\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
                workOrderUpdate.work_order_date = dateMatch[0];
            }
        }
        if (analysis.planned_date) {
            const dateMatch = String(analysis.planned_date).match(/^\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
                workOrderUpdate.planned_dates = [dateMatch[0]];  // Store as array
            }
        }

        // Helper to sanitize array of strings
        const sanitizeStringArray = (arr: any): string[] | undefined => {
            if (!Array.isArray(arr)) return undefined;
            return arr.map(item => String(item)).filter(item => item.trim() !== '');
        };

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
        console.log('[process-work-order] Updating work order in database...');
        const { error: updateError } = await supabase
            .from('work_orders')
            .update(workOrderUpdate)
            .eq('id', workOrderId);

        if (updateError) {
            console.error('[process-work-order] Failed to update work order:', updateError);
            return NextResponse.json(
                { error: 'Failed to update work order', details: updateError.message },
                { status: 500 }
            );
        }
        console.log('[process-work-order] Work order updated successfully');

        // Create Suggested Tasks
        if (Array.isArray(analysis.suggested_tasks) && analysis.suggested_tasks.length > 0) {
            console.log('[process-work-order] Creating', analysis.suggested_tasks.length, 'tasks...');
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
                console.error('[process-work-order] Failed to insert tasks:', tasksError);
            } else {
                console.log('[process-work-order] Tasks created successfully');
            }
        }

        console.log('[process-work-order] Processing complete!');
        return NextResponse.json({
            success: true,
            analysis: analysis,
        });
    } catch (error: any) {
        console.error('[process-work-order] Unhandled error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error', stack: error.stack },
            { status: 500 }
        );
    }
}
