import {
    AlignmentType,
    BorderStyle,
    convertInchesToTwip,
    Document,
    HeadingLevel,
    ImageRun,
    LevelFormat,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
} from 'docx';

export interface DocxExportOptions {
    fileName?: string;
    orientation?: 'portrait' | 'landscape';
    title?: string;
    author?: string;
    subject?: string;
    includeMetadata?: boolean;
    embedImages?: boolean;
    docVersion?: string;
}

/**
 * Extract images from HTML and convert to base64 for embedding
 */
const extractAndEmbedImages = async (htmlContent: string): Promise<Map<string, string>> => {
    const imageMap = new Map<string, string>();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const imgElements = doc.querySelectorAll('img');

    for (const img of imgElements) {
        const src = img.getAttribute('src');
        if (src && !imageMap.has(src)) {
            try {
                if (src.startsWith('data:')) {
                    // Already base64
                    imageMap.set(src, src);
                } else if (src.startsWith('http')) {
                    // Fetch external image
                    const response = await fetch(src, { mode: 'cors' });
                    const blob = await response.blob();
                    const reader = new FileReader();
                    await new Promise((resolve) => {
                        reader.onload = () => {
                            imageMap.set(src, reader.result as string);
                            resolve(null);
                        };
                        reader.readAsDataURL(blob);
                    });
                }
            } catch (error) {
                console.error(`Failed to embed image ${src}:`, error);
                // Continue with other images
            }
        }
    }

    return imageMap;
};

/**
 * Parse HTML and convert to DOCX paragraphs with enhanced styling
 */
const htmlToDocxParagraphs = (htmlContent: string, imageMap?: Map<string, string>): Array<Paragraph | Table> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const paragraphs: Array<Paragraph | Table> = [];

    const processNode = (node: Node, isInList = false, listLevel = 0): void => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            const tagName = element.tagName.toLowerCase();
            const text = element.textContent || '';

            // Skip empty nodes
            if (!text.trim() && !['br', 'hr', 'img', 'table'].includes(tagName)) {
                return;
            }

            switch (tagName) {
                case 'h1':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 240, after: 120 },
                        })
                    );
                    break;
                case 'h2':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 200, after: 100 },
                        })
                    );
                    break;
                case 'h3':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 160, after: 80 },
                        })
                    );
                    break;
                case 'h4':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_4,
                            spacing: { before: 120, after: 60 },
                        })
                    );
                    break;
                case 'h5':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_5,
                            spacing: { before: 120, after: 60 },
                        })
                    );
                    break;
                case 'h6':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            heading: HeadingLevel.HEADING_6,
                            spacing: { before: 120, after: 60 },
                        })
                    );
                    break;
                case 'p':
                case 'div':
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
                                const isBold = tag === 'strong' || tag === 'b';
                                const isItalic = tag === 'em' || tag === 'i';
                                const isUnderline = tag === 'u';
                                const isStrike = tag === 's' || tag === 'del';
                                const isCode = tag === 'code';

                                runs.push(
                                    new TextRun({
                                        text: content,
                                        bold: isBold,
                                        italics: isItalic,
                                        underline: isUnderline ? {} : undefined,
                                        strike: isStrike,
                                        font: isCode ? 'Courier New' : undefined,
                                    })
                                );
                            }
                        }
                    };

                    Array.from(element.childNodes).forEach(processTextNode);

                    if (runs.length > 0) {
                        paragraphs.push(
                            new Paragraph({
                                children: runs,
                                spacing: { line: 240, after: 120 },
                            })
                        );
                    } else if (text.trim()) {
                        paragraphs.push(
                            new Paragraph({
                                text,
                                spacing: { line: 240, after: 120 },
                            })
                        );
                    }
                    break;
                case 'ul':
                case 'ol':
                    const isSorted = tagName === 'ol';
                    const listItems = element.querySelectorAll(':scope > li');
                    listItems.forEach((li, index) => {
                        const content = li.textContent || '';
                        if (content.trim()) {
                            paragraphs.push(
                                new Paragraph({
                                    text: content,
                                    bullet: isSorted ? undefined : { level: listLevel },
                                    numbering: isSorted
                                        ? { reference: 'ordered-list', level: listLevel }
                                        : undefined,
                                })
                            );
                        }
                    });
                    break;
                case 'li':
                    // Handled by ul/ol
                    break;
                case 'blockquote':
                    paragraphs.push(
                        new Paragraph({
                            text,
                            indent: { left: convertInchesToTwip(0.5) },
                            border: {
                                left: {
                                    color: '0066CC',
                                    space: 1,
                                    style: BorderStyle.SINGLE,
                                    size: 20,
                                },
                            },
                            spacing: { before: 120, after: 120 },
                        })
                    );
                    break;
                case 'img':
                    const src = element.getAttribute('src') || '';
                    if (src && imageMap?.has(src)) {
                        try {
                            const base64 = imageMap.get(src) || '';
                            // Parse base64
                            const imageMatch = base64.match(
                                /^data:image\/(png|jpe?g|gif|bmp);base64,([A-Za-z0-9+/=]+)$/i,
                            );
                            if (!imageMatch) {
                                throw new Error('Image format is unsupported for DOCX export');
                            }
                            const mimeType = imageMatch[1].toLowerCase();
                            const imageType:
                                | 'jpg'
                                | 'png'
                                | 'gif'
                                | 'bmp' =
                                mimeType === 'jpeg' || mimeType === 'jpg'
                                    ? 'jpg'
                                    : mimeType === 'png'
                                      ? 'png'
                                      : mimeType === 'gif'
                                        ? 'gif'
                                        : 'bmp';
                            const base64Data = imageMatch[2];
                            paragraphs.push(
                                new Paragraph({
                                    children: [
                                        new ImageRun({
                                            type: imageType,
                                            data: Uint8Array.from(atob(base64Data), (character) =>
                                                character.charCodeAt(0),
                                            ),
                                            transformation: {
                                                width: 400,
                                                height: 300,
                                            },
                                        }),
                                    ],
                                    spacing: { before: 120, after: 120 },
                                })
                            );
                        } catch (error) {
                            console.error('Error embedding image:', error);
                            paragraphs.push(new Paragraph({ text: `[Image: ${src}]` }));
                        }
                    } else if (src) {
                        // Fallback: show image URL as text
                        paragraphs.push(new Paragraph({ text: `[Image: ${src}]` }));
                    }
                    break;
                case 'table':
                    try {
                        const headerRows = element.querySelectorAll('thead tr');
                        const bodyRows = element.querySelectorAll('tbody tr');
                        const allRows = Math.max(headerRows.length + bodyRows.length, 0);

                        if (allRows > 0) {
                            const tableRows: TableRow[] = [];

                            // Add header rows
                            headerRows.forEach((row) => {
                                const cells = row.querySelectorAll('th, td');
                                tableRows.push(
                                    new TableRow({
                                        children: Array.from(cells).map(
                                            (cell) =>
                                                new TableCell({
                                                    children: [
                                                        new Paragraph({
                                                            children: [
                                                                new TextRun({
                                                                    text: (cell as HTMLElement).textContent || '',
                                                                    bold: true,
                                                                }),
                                                            ],
                                                            alignment: AlignmentType.CENTER,
                                                        }),
                                                    ],
                                                    shading: { fill: 'D3D3D3' },
                                                })
                                        ),
                                    })
                                );
                            });

                            // Add body rows
                            bodyRows.forEach((row) => {
                                const cells = row.querySelectorAll('th, td');
                                tableRows.push(
                                    new TableRow({
                                        children: Array.from(cells).map(
                                            (cell) =>
                                                new TableCell({
                                                    children: [
                                                        new Paragraph({
                                                            text: (cell as HTMLElement).textContent || '',
                                                        }),
                                                    ],
                                                })
                                        ),
                                    })
                                );
                            });

                            if (tableRows.length > 0) {
                                paragraphs.push(
                                    new Table({
                                        width: { size: 100, type: 'pct' },
                                        rows: tableRows,
                                    })
                                );
                            }
                        }
                    } catch (error) {
                        console.error('Error processing table:', error);
                    }
                    break;
                case 'br':
                case 'hr':
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

    Array.from(doc.body.childNodes).forEach(node => processNode(node));

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
            numbering: {
                config: [
                    {
                        reference: 'ordered-list',
                        levels: [
                            {
                                level: 0,
                                format: LevelFormat.DECIMAL,
                                text: '%1.',
                                alignment: AlignmentType.START,
                            },
                        ],
                    },
                ],
            },
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
            numbering: {
                config: [
                    {
                        reference: 'ordered-list',
                        levels: [
                            {
                                level: 0,
                                format: LevelFormat.DECIMAL,
                                text: '%1.',
                                alignment: AlignmentType.START,
                            },
                        ],
                    },
                ],
            },
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
