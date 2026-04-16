/**
 * Document Import Service
 * Converts DOCX files to HTML using mammoth.js
 * Handles file validation and content sanitization
 */

import DOMPurify from 'dompurify';

/**
 * Configuration for mammoth.js conversion
 */
const getMammothOptions = () => ({
    convertImage: async (image: any) => {
        // Try to handle images if needed
        try {
            const arrayBuffer = await image.read('arraybuffer');
            const bytes = new Uint8Array(arrayBuffer);
            const base64 = btoa(String.fromCharCode(...bytes));
            const contentType = image.contentType || 'image/png';
            return {
                src: `data:${contentType};base64,${base64}`,
            };
        } catch {
            return { src: '' };
        }
    },
    styleMap: [
        'b => strong',
        'i => em',
        'u => u',
        's => s',
        'p[style-name="Heading 1"] => h1',
        'p[style-name="Heading 2"] => h2',
        'p[style-name="Heading 3"] => h3',
        'p[style-name="Heading 4"] => h4',
        'p[style-name="Heading 5"] => h5',
        'p[style-name="Heading 6"] => h6',
    ],
});

/**
 * Validate DOCX file
 */
export function validateDocxFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    const validTypes = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword', // Legacy .doc format
    ];

    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file type. Please upload a DOCX or DOC file.',
        };
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size exceeds 10 MB limit',
        };
    }

    return { valid: true };
}

/**
 * Read file as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result instanceof ArrayBuffer) {
                resolve(e.target.result);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Convert DOCX to HTML using dynamic import
 * (mammoth.js may not be pre-installed, so we handle gracefully)
 */
export async function convertDocxToHtml(
    arrayBuffer: ArrayBuffer
): Promise<string> {
    try {
        // Dynamically import mammoth.js
        const mammoth = await import('mammoth');

        const { value } = await mammoth.convertToHtml({ arrayBuffer });
        return value;
    } catch (error) {
        // If mammoth is not available, return helpful error
        console.error('Mammoth.js not available:', error);
        throw new Error(
            'DOCX conversion library not available. Install mammoth.js to enable this feature.'
        );
    }
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
            'ul', 'ol', 'li',
            'blockquote',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img',
            'a',
            'code', 'pre',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style'],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Extract metadata from HTML content
 */
export function extractMetadataFromContent(content: string): {
    title?: string;
    summary?: string;
    wordCount: number;
} {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Get title from first H1 or H2
    const titleEl = doc.querySelector('h1') || doc.querySelector('h2');
    const title = titleEl?.textContent || 'Imported Document';

    // Get summary from first paragraph
    const summaryEl = doc.querySelector('p');
    const summary = summaryEl?.textContent || '';

    // Count words
    const text = doc.body.textContent || '';
    const wordCount = text
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 0).length;

    return { title, summary, wordCount };
}

/**
 * Main import function - handles entire import workflow
 */
export async function importDocxFile(file: File): Promise<{
    html: string;
    metadata: {
        title: string;
        summary: string;
        wordCount: number;
        fileName: string;
    };
}> {
    // Validate file
    const validation = validateDocxFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Read file
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Convert to HTML
    const html = await convertDocxToHtml(arrayBuffer);

    // Sanitize
    const sanitized = sanitizeHtml(html);

    // Extract metadata
    const metadata = extractMetadataFromContent(sanitized);

    return {
        html: sanitized,
        metadata: {
            ...metadata,
            fileName: file.name,
        },
    };
}

/**
 * Batch convert multiple DOCX files
 */
export async function batchImportDocxFiles(
    files: File[],
    onProgress?: (current: number, total: number) => void
): Promise<
    Array<{
        fileName: string;
        html: string;
        error?: string;
    }>
> {
    const results = [];

    for (let i = 0; i < files.length; i++) {
        try {
            const result = await importDocxFile(files[i]);
            results.push({
                fileName: files[i].name,
                html: result.html,
            });
        } catch (error) {
            results.push({
                fileName: files[i].name,
                html: '',
                error: (error as Error).message,
            });
        }

        if (onProgress) {
            onProgress(i + 1, files.length);
        }
    }

    return results;
}
