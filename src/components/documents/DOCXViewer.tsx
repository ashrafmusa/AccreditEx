import React, { useState, useEffect } from "react";
import mammoth from "mammoth";
import DOMPurify from "dompurify";

interface DOCXViewerProps {
  fileUrl: string;
  className?: string;
}

const DOCXViewer: React.FC<DOCXViewerProps> = ({ fileUrl, className = "" }) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocx = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the DOCX file
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }

        const arrayBuffer = await response.arrayBuffer();

        // Convert DOCX to HTML using mammoth
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Heading 4'] => h4:fresh",
              "p[style-name='Title'] => h1.title:fresh",
              "p[style-name='Subtitle'] => h2.subtitle:fresh",
            ],
            convertImage: mammoth.images.imgElement((image: any) => {
              return image.read("base64").then((imageBuffer: string) => {
                return {
                  src: `data:${image.contentType};base64,${imageBuffer}`,
                };
              });
            }),
          },
        );

        setHtmlContent(result.value);

        // Log any warnings from mammoth
        if (result.messages.length > 0) {
          console.warn("DOCX conversion warnings:", result.messages);
        }
      } catch (err) {
        console.error("Error loading DOCX:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load document",
        );
      } finally {
        setLoading(false);
      }
    };

    if (fileUrl) {
      loadDocx();
    }
  }, [fileUrl]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">
            Error loading document
          </p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`docx-viewer-container ${className}`}>
      <div
        className="prose dark:prose-invert max-w-none p-6"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
        style={{
          backgroundColor: "white",
          minHeight: "500px",
        }}
      />
      <style>{`
        .docx-viewer-container {
          background-color: #f5f5f5;
        }
        .dark .docx-viewer-container {
          background-color: #1a1a1a;
        }
        .docx-viewer-container .prose {
          font-family: 'Calibri', 'Arial', sans-serif;
          line-height: 1.6;
        }
        .docx-viewer-container .prose h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
        }
        .docx-viewer-container .prose h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.75em;
          margin-bottom: 0.75em;
        }
        .docx-viewer-container .prose h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }
        .docx-viewer-container .prose p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .docx-viewer-container .prose img {
          max-width: 100%;
          height: auto;
        }
        .docx-viewer-container .prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        .docx-viewer-container .prose table td,
        .docx-viewer-container .prose table th {
          border: 1px solid #ddd;
          padding: 8px;
        }
      `}</style>
    </div>
  );
};

export default DOCXViewer;
