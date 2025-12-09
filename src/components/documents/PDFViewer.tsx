import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "../../hooks/useTranslation";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName = "document.pdf",
}) => {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [searchText, setSearchText] = useState<string>("");

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) =>
      Math.min(Math.max(1, prevPageNumber + offset), numPages)
    );
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);

  const downloadPDF = () => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Page Navigation */}
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t("previousPage") || "Previous Page"}
            aria-label={t("previousPage") || "Previous Page"}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {t("page")} {pageNumber} {t("of")} {numPages}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t("nextPage") || "Next Page"}
            aria-label={t("nextPage") || "Next Page"}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={resetZoom}
            className="px-3 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={t("resetZoom") || "Reset Zoom"}
            aria-label={t("resetZoom") || "Reset Zoom"}
          >
            {t("fit") || "Fit"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={t("searchInPDF") || "Search in PDF..."}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-gray-700"
              aria-label={t("searchInPDF") || "Search in PDF"}
            />
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          {/* Download */}
          <button
            onClick={downloadPDF}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title={t("downloadPDF") || "Download PDF"}
            aria-label={t("downloadPDF") || "Download PDF"}
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <div className="shadow-lg">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-96 text-red-500">
                <p>
                  {t("failedToLoadPDF") ||
                    "Failed to load PDF. Please try again."}
                </p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="bg-white"
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
