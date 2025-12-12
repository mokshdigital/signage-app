import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/api';
import { WorkOrder, WorkOrderFile } from '@/types/database';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const ANALYSIS_PROMPT = `You are analyzing work order documents for a signage installation company. You may receive multiple files including:
- Work order documents (PDF/images)
- Site plans and blueprints
- Specifications
- Site photos
- Other relevant documents

Analyze ALL provided files together and extract comprehensive information. Return JSON with:

jobType: type of signage work
location: full address
orderedBy: client name
contactInfo: phone/email
resourceRequirements: {techSkills: [], equipment: [], vehicles: []}
permitsRequired: []
numberOfTechs: number and their roles
estimatedHours: number
estimatedDays: number
clientQuestions: []
technicianQuestions: []
technicalRequirements: description
accessRequirements: description
riskFactors: []
additionalDetails: any other relevant info from all documents

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

        // Type assertion - Supabase returns unknown, so we assert the type
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

        // Download and process all files
        const fileParts: any[] = [];

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

            // Determine file type and create appropriate part for Gemini
            const fileName = file.file_name || '';
            const fileExtension = fileName.split('.').pop()?.toLowerCase();

            if (fileExtension === 'pdf') {
                fileParts.push({
                    inlineData: {
                        data: buffer.toString('base64'),
                        mimeType: 'application/pdf',
                    },
                });
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
                fileParts.push({
                    inlineData: {
                        data: buffer.toString('base64'),
                        mimeType: file.mime_type || `image/${fileExtension}`,
                    },
                });
            }
        }

        if (fileParts.length === 0) {
            return NextResponse.json(
                { error: 'No supported files found (PDF or images only)' },
                { status: 400 }
            );
        }

        // Process all files with Gemini
        const analysisText = await analyzeMultipleFilesWithGemini(fileParts);

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

        // Update work order in database
        const { error: updateError } = await supabase
            .from('work_orders')
            .update({
                processed: true,
                analysis: analysis,
            })
            .eq('id', workOrderId);

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to update work order' },
                { status: 500 }
            );
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

// Analyze text content with Gemini
async function analyzeTextWithGemini(text: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `${ANALYSIS_PROMPT}\n\nWork Order Content:\n${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Analyze PDF with Gemini (native PDF support)
async function analyzePdfWithGemini(pdfBuffer: Buffer): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const pdfPart = {
        inlineData: {
            data: pdfBuffer.toString('base64'),
            mimeType: 'application/pdf',
        },
    };

    const result = await model.generateContent([ANALYSIS_PROMPT, pdfPart]);
    const response = await result.response;
    return response.text();
}

// Analyze image with Gemini Vision
async function analyzeImageWithGemini(
    imageBuffer: Buffer,
    mimeType: string
): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const imagePart = {
        inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType: `image/${mimeType}`,
        },
    };

    const result = await model.generateContent([ANALYSIS_PROMPT, imagePart]);
    const response = await result.response;
    return response.text();
}

// Analyze multiple files with Gemini (PDFs and images together)
async function analyzeMultipleFilesWithGemini(fileParts: any[]): Promise<string> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // Send prompt + all file parts to Gemini
    const result = await model.generateContent([ANALYSIS_PROMPT, ...fileParts]);
    const response = await result.response;
    return response.text();
}
