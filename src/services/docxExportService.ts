import {
    Document,
    Paragraph,
    TextRun,
    HeadingLevel,
    convertInchesToTwip,
    Packer,
} from 'docx';

export interface DocxExportOptions {
    fileName?: string;
    orientation?: 'portrait' | 'landscape';
}

/**
 * Parse HTML and convert to DOCX paragraphs
 */
const htmlToDocxParagraphs = (htmlContent: string): Paragraph[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const paragraphs: Paragraph[] = [];

    const processNode = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            const text = element.textContent || '';

            // Skip empty nodes
            if (!text.trim() && !['br', 'hr'].includes(tagName)) {
                return;
            }

            switch (tagName) {
                case 'h1':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_1,
                        })
                    );
                    break;
                case 'h2':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_2,
                        })
                    );
                    break;
                case 'h3':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_3,
                        })
                    );
                    break;
                case 'p':
                    const runs: TextRun[] = [];
                    const processTextNode = (textNode: Node) => {
                        if (textNode.nodeType === Node.TEXT_NODE) {
                            const content = textNode.textContent || '';
                            if (content.trim()) {
                                runs.push(new TextRun(content));
                            }
                        } else if (textNode.nodeType === Node.ELEMENT_NODE) {
                            const el = textNode as HTMLElement;
                            const content = el.textContent || '';
                            const tag = el.tagName.toLowerCase();

                            if (content.trim()) {
                                runs.push(
                                    new TextRun({
                                        text: content,
                                        bold: tag === 'strong' || tag === 'b',
                                        italics: tag === 'em' || tag === 'i',
                                        underline: tag === 'u' ? {} : undefined,
                                    })
                                );
                            }
                        }
                    };

                    Array.from(element.childNodes).forEach(processTextNode);

                    if (runs.length > 0) {
                        paragraphs.push(new Paragraph({ children: runs }));
                    } else if (text.trim()) {
                        paragraphs.push(new Paragraph({ text }));
                    }
                    break;
                case 'li':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            bullet: { level: 0 },
                        })
                    );
                    break;
                case 'br':
                    paragraphs.push(new Paragraph({ text: '' }));
                    break;
                default:
                    // For other elements, extract text content
                    if (text.trim()) {
                        paragraphs.push(new Paragraph({ text }));
                    }
            }
        }
    };

    Array.from(doc.body.childNodes).forEach(processNode);

    // Ensure at least one paragraph
    if (paragraphs.length === 0) {
        paragraphs.push(new Paragraph({ text: '' }));
    }

    return paragraphs;
};

/**
 * Convert HTML content to DOCX and download
 */
export const exportToDocx = async (
    htmlContent: string,
    options: DocxExportOptions = {}
): Promise<void> => {
    try {
        const { fileName = 'document.docx', orientation = 'portrait' } = options;

        const paragraphs = htmlToDocxParagraphs(htmlContent);

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: convertInchesToTwip(1),
                                right: convertInchesToTwip(1),
                                bottom: convertInchesToTwip(1),
                                left: convertInchesToTwip(1),
                            },
                        },
                    },
                    children: paragraphs,
                },
            ],
        });

        // Generate DOCX file
        const blob = await Packer.toBlob(doc);

        // Download the file
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName.endsWith('.docx') ? fileName : `${fileName}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting to DOCX:', error);
        throw new Error('Failed to export document to DOCX format');
    }
};

/**
 * Convert HTML content to DOCX blob (without downloading)
 */
export const convertToDocxBlob = async (
    htmlContent: string,
    options: Omit<DocxExportOptions, 'fileName'> = {}
): Promise<Blob> => {
    try {
        const paragraphs = htmlToDocxParagraphs(htmlContent);

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: convertInchesToTwip(1),
                                right: convertInchesToTwip(1),
                                bottom: convertInchesToTwip(1),
                                left: convertInchesToTwip(1),
                            },
                        },
                    },
                    children: paragraphs,
                },
            ],
        });

        return await Packer.toBlob(doc);
    } catch (error) {
        console.error('Error converting to DOCX blob:', error);
        throw new Error('Failed to convert document to DOCX format');
    }
};

/**
 * Upload DOCX blob to Cloudinary or other storage
 */
export const uploadDocxBlob = async (
    blob: Blob,
    fileName: string,
    uploadFunction: (file: File) => Promise<string>
): Promise<string> => {
    const file = new File([blob], fileName, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return await uploadFunction(file);
};
