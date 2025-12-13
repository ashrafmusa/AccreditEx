declare module 'mammoth' {
    export interface ConvertToHtmlOptions {
        styleMap?: string[];
        convertImage?: (image: ImageConverter) => Promise<{ src: string }>;
    }

    export interface ConvertResult {
        value: string;
        messages: Array<{ type: string; message: string }>;
    }

    export interface ImageConverter {
        read(encoding: string): Promise<string>;
        contentType: string;
    }

    export interface ImageOptions {
        imgElement: (image: any) => Promise<{ src: string }>;
    }

    export const images: ImageOptions;

    export function convertToHtml(
        input: { arrayBuffer: ArrayBuffer },
        options?: ConvertToHtmlOptions
    ): Promise<ConvertResult>;
}
